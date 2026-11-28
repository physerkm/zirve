using System.Collections.Concurrent;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using Microsoft.Extensions.Options;

namespace Zirve.Runner.Execution;

/// <summary>Bir çalıştırmaya ayrılan yalıtım yuvası: o çalıştırmanın süreçleri bu Linux kullanıcısıyla çalışır.</summary>
public sealed record SandboxLease(int Uid);

/// <summary>
/// Çalıştırma başına işletim sistemi düzeyinde yalıtım (bkz. <see cref="IsolationOptions"/>).
/// <list type="bullet">
/// <item>Her eşzamanlı yuvanın kendi kullanıcısı vardır. Çocuk süreç <c>setpriv</c> ile o kullanıcıya geçer ve
/// hiçbir yetki (capability) taşımaz: Runner'ın <c>/proc/&lt;pid&gt;/environ</c>'una, başka yuvaların süreçlerine
/// ve çalışma klasörlerine erişemez, onlara sinyal gönderemez.</item>
/// <item>Çalışma klasörü yalnızca o kullanıcıya açıktır (0700).</item>
/// <item>Veri belleği RLIMIT_DATA ile sınırlanır; V8 yığınının dışında kalan ArrayBuffer'ları da kapsar.</item>
/// <item>Çalıştırma bitince o kullanıcının arkada kalan bütün süreçleri öldürülür; yuva bir sonraki
/// çalıştırmaya temiz verilir.</item>
/// </list>
/// Kapalıyken (Windows'ta yerel geliştirme, testler) hiçbir şey değişmez.
/// </summary>
public sealed partial class Sandbox
{
    private readonly IsolationOptions _options;
    private readonly ILogger<Sandbox> _logger;
    private readonly ConcurrentQueue<int> _freeUids = new();

    public Sandbox(IOptions<RunnerOptions> options, ILogger<Sandbox> logger)
    {
        _options = options.Value.Isolation;
        _logger = logger;

        if (!_options.Enabled)
        {
            return;
        }

        if (!OperatingSystem.IsLinux())
        {
            throw new InvalidOperationException("Runner:Isolation yalnızca Linux'ta kullanılabilir.");
        }

        if (!Environment.IsPrivilegedProcess)
        {
            throw new InvalidOperationException(
                "Runner:Isolation için Runner root olarak (yalnızca SETUID, SETGID, KILL, CHOWN ve DAC_OVERRIDE yetkileriyle) çalışmalıdır.");
        }

        foreach (var path in new[] { _options.SetprivPath, _options.ShellPath })
        {
            if (!File.Exists(path))
            {
                throw new InvalidOperationException($"Runner:Isolation için gereken program bulunamadı: {path}");
            }
        }

        // Yuva sayısı eşzamanlılık sınırıyla aynıdır; ExecutionService yuvayı semafordan sonra alır.
        for (var slot = 0; slot < options.Value.EffectiveConcurrency; slot++)
        {
            _freeUids.Enqueue(_options.FirstUid + slot);
        }
    }

    public bool Enabled => _options.Enabled;

    /// <summary>Boş bir yuva verir; yalıtım kapalıysa null. Çağıran, eşzamanlılık semaforunu önceden almış olmalıdır.</summary>
    public SandboxLease? Acquire()
    {
        if (!Enabled)
        {
            return null;
        }

        return _freeUids.TryDequeue(out var uid)
            ? new SandboxLease(uid)
            : throw new InvalidOperationException("Boş yalıtım yuvası yok; eşzamanlılık semaforu ile yuva sayısı uyuşmuyor.");
    }

    /// <summary>Yuvanın arkada kalan bütün süreçlerini öldürür ve yuvayı geri verir.</summary>
    public async Task ReleaseAsync(SandboxLease? lease)
    {
        if (lease is null)
        {
            return;
        }

        try
        {
            await KillAllAsync(lease);
        }
        finally
        {
            _freeUids.Enqueue(lease.Uid);
        }
    }

    /// <summary>Çalışma klasörünü (ve Runner'ın içine yazdığı dosyaları) yuvanın kullanıcısına verir; 0700.</summary>
    public void PrepareDirectory(string directory, SandboxLease? lease)
    {
        if (lease is null || !OperatingSystem.IsLinux())
        {
            return;
        }

        // İzin, sahiplik devredilmeden ÖNCE ayarlanır: başkasına ait bir dosyanın iznini değiştirmek CAP_FOWNER
        // ister; Runner'a bu yetkiyi vermiyoruz.
        File.SetUnixFileMode(directory, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);

        foreach (var path in Directory.EnumerateFileSystemEntries(directory, "*", SearchOption.AllDirectories).Prepend(directory))
        {
            if (lchown(path, (uint)lease.Uid, (uint)lease.Uid) != 0)
            {
                throw new IOException($"Sahiplik değiştirilemedi ({Marshal.GetLastPInvokeError()}): {path}");
            }
        }
    }

    /// <summary>
    /// Süreci yuvanın kullanıcısıyla, yetkisiz ve bellek sınırıyla başlatacak biçimde sarar:
    /// <c>setpriv --reuid=U --regid=U --clear-groups … -- sh -c 'ulimit -d KB &amp;&amp; exec "$0" "$@"' program argümanlar</c>.
    /// Ortam değişkenleri ve çalışma klasörü aynen korunur.
    /// </summary>
    public ProcessStartInfo Wrap(ProcessStartInfo inner, SandboxLease? lease, int dataLimitMb)
    {
        if (lease is null)
        {
            return inner;
        }

        var wrapped = new ProcessStartInfo(_options.SetprivPath) { WorkingDirectory = inner.WorkingDirectory };

        foreach (var argument in Drop(lease))
        {
            wrapped.ArgumentList.Add(argument);
        }

        var dataLimitKb = (dataLimitMb * 1024L).ToString(CultureInfo.InvariantCulture);
        wrapped.ArgumentList.Add(_options.ShellPath);
        wrapped.ArgumentList.Add("-c");
        wrapped.ArgumentList.Add($"ulimit -d {dataLimitKb} && exec \"$0\" \"$@\"");
        wrapped.ArgumentList.Add(inner.FileName);

        foreach (var argument in inner.ArgumentList)
        {
            wrapped.ArgumentList.Add(argument);
        }

        wrapped.Environment.Clear();
        foreach (var (key, value) in inner.Environment)
        {
            wrapped.Environment[key] = value;
        }

        return wrapped;
    }

    /// <summary>setpriv'in kullanıcı değiştirme ve yetki bırakma bağımsız değişkenleri ("--" dahil).</summary>
    private static string[] Drop(SandboxLease lease)
    {
        var id = lease.Uid.ToString(CultureInfo.InvariantCulture);
        // Kök olmayan bir kullanıcıya geçişte çekirdek bütün yetkileri (ambient dahil) zaten sıfırlar.
        return [$"--reuid={id}", $"--regid={id}", "--clear-groups", "--no-new-privs", "--"];
    }

    /// <summary>
    /// Yuvanın kullanıcısıyla <c>kill -9 -1</c> çalıştırır: Linux'ta bu, çağıranın sinyal gönderebildiği (yani aynı
    /// kullanıcıya ait) bütün süreçleri, çağıranın kendisi dışında öldürür. Arka plana atılmış ya da süreç
    /// ağacından kopmuş süreçler de böylece temizlenir.
    /// </summary>
    private async Task KillAllAsync(SandboxLease lease)
    {
        var startInfo = new ProcessStartInfo(_options.SetprivPath)
        {
            UseShellExecute = false,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
        };

        foreach (var argument in Drop(lease))
        {
            startInfo.ArgumentList.Add(argument);
        }

        startInfo.ArgumentList.Add(_options.ShellPath);
        startInfo.ArgumentList.Add("-c");
        startInfo.ArgumentList.Add("kill -9 -1 2>/dev/null; exit 0");
        startInfo.Environment.Clear();

        try
        {
            using var process = Process.Start(startInfo) ?? throw new InvalidOperationException("setpriv başlatılamadı.");
            await process.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(5));
        }
        catch (Exception ex) when (ex is InvalidOperationException or System.ComponentModel.Win32Exception or TimeoutException)
        {
            _logger.LogError(ex, "Yalıtım yuvası {Uid} temizlenemedi.", lease.Uid);
        }
    }

    // Sembolik bağları izlemeden sahiplik değiştirir.
    [LibraryImport("libc", EntryPoint = "lchown", SetLastError = true, StringMarshalling = StringMarshalling.Utf8)]
    private static partial int lchown(string path, uint owner, uint group);
}
