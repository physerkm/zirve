using System.ComponentModel.DataAnnotations;

namespace Zirve.Runner;

public sealed class RunnerOptions
{
    public const string SectionName = "Runner";

    /// <summary>Ayarlıysa, istekler <c>X-Runner-Key</c> başlığında bu anahtarı taşımak zorundadır.</summary>
    public string? ApiKey { get; set; }

    /// <summary>Aynı anda çalışabilecek en fazla kod sayısı. 0 ise işlemci sayısına göre belirlenir.</summary>
    [Range(0, 64)]
    public int MaxConcurrency { get; set; }

    /// <summary>Boş yuva beklerken en fazla bekleme süresi.</summary>
    [Range(1, 120)]
    public int QueueTimeoutSeconds { get; set; } = 15;

    /// <summary>Test modunda tüm testlerin toplam süre sınırı.</summary>
    [Range(1, 60)]
    public int TestsTimeoutSeconds { get; set; } = 10;

    /// <summary>Deneme alanı (script) modunda süre sınırı.</summary>
    [Range(1, 60)]
    public int ScriptTimeoutSeconds { get; set; } = 8;

    /// <summary>JavaScript/TypeScript testlerinde tek bir testin süre sınırı.</summary>
    [Range(100, 30_000)]
    public int PerTestTimeoutMs { get; set; } = 3000;

    [Range(64, 2048)]
    public int MemoryLimitMb { get; set; } = 256;

    [Range(1_000, 10_000_000)]
    public int MaxOutputBytes { get; set; } = 1_000_000;

    [Range(100, 500_000)]
    public int MaxCodeLength { get; set; } = 50_000;

    [Range(1, 500)]
    public int MaxTests { get; set; } = 200;

    public string DotnetPath { get; set; } = "dotnet";

    public string NodePath { get; set; } = "node";

    /// <summary>Geçici çalışma klasörlerinin kökü. Boşsa sistemin geçici klasörü kullanılır.</summary>
    public string? WorkDirectory { get; set; }

    /// <summary>C# kodunda dosya/ağ/yansıma gibi API'lerin kullanımını derleme aşamasında engeller (derinlemesine savunma).</summary>
    public bool EnforceCSharpApiRestrictions { get; set; } = true;

    /// <summary>Node.js süreçlerini izin modeliyle (--permission) başlatır.</summary>
    public bool UseNodePermissionModel { get; set; } = true;

    /// <summary>Çalıştırma başına işletim sistemi düzeyinde yalıtım (yalnızca Linux kapsayıcısında).</summary>
    public IsolationOptions Isolation { get; set; } = new();

    public int EffectiveConcurrency => MaxConcurrency > 0 ? MaxConcurrency : Math.Max(1, Environment.ProcessorCount / 2);
}

/// <summary>
/// Her eşzamanlı çalıştırma yuvası kendi Linux kullanıcısıyla (uid = <see cref="FirstUid"/> + yuva) ve veri
/// belleği sınırıyla (RLIMIT_DATA) çalışır. Kullanıcı kodu dil düzeyindeki yalıtımı aşsa bile Runner'ın
/// ortamını (API anahtarı), başka çalıştırmaların dosyalarını ve süreçlerini göremez; V8 yığınının dışındaki
/// bellek (ArrayBuffer) dahil kapsayıcının belleğini tüketemez.
/// <para>
/// Etkinleştirmek için Runner root olarak, yalnızca SETUID, SETGID, KILL, CHOWN ve DAC_OVERRIDE yetkileriyle
/// çalışmalıdır (bkz. docker-compose.yml). Windows'taki yerel geliştirmede kapalıdır.
/// </para>
/// </summary>
public sealed class IsolationOptions
{
    public bool Enabled { get; set; }

    /// <summary>İlk yuvanın kullanıcı ve grup kimliği; yuvalar ardışık kimlikler alır.</summary>
    [Range(1000, 60000)]
    public int FirstUid { get; set; } = 20000;

    /// <summary>
    /// Bir C# çalıştırmasının en fazla veri belleği (RLIMIT_DATA, MB). RLIMIT_DATA yazılabilir SANAL belleği
    /// sayar ve çalışma zamanının kendi payını da içerir; fiziksel kullanım bunun altında kalır.
    /// </summary>
    [Range(128, 8192)]
    public int ProcessMemoryMb { get; set; } = 512;

    /// <summary>
    /// Bir JavaScript/TypeScript çalıştırmasının en fazla veri belleği (RLIMIT_DATA, MB). V8 boştayken bile
    /// ~600 MB yazılabilir sanal bellek ayırır (fiziksel kullanımı ~40 MB'tır; ölçüm CI'da); bu yüzden sınır
    /// C#'tan yüksektir. Aradaki ~400 MB, V8 yığını (MemoryLimitMb) ve ArrayBuffer'lar için gerçek kullanım payıdır.
    /// </summary>
    [Range(768, 8192)]
    public int NodeProcessMemoryMb { get; set; } = 1024;

    public string SetprivPath { get; set; } = "/usr/bin/setpriv";

    public string ShellPath { get; set; } = "/bin/sh";
}
