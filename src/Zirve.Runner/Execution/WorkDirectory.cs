using Microsoft.Extensions.Options;

namespace Zirve.Runner.Execution;

/// <summary>Her çalıştırma için tek kullanımlık geçici klasör üretir ve temizler.</summary>
public sealed class WorkDirectory
{
    private readonly string _root;
    private readonly ILogger<WorkDirectory> _logger;

    public WorkDirectory(IOptions<RunnerOptions> options, ILogger<WorkDirectory> logger)
    {
        _logger = logger;
        _root = string.IsNullOrWhiteSpace(options.Value.WorkDirectory)
            ? Path.Combine(Path.GetTempPath(), "zirve-runner")
            : options.Value.WorkDirectory;

        Directory.CreateDirectory(_root);

        // Yalıtımda kök yalnızca geçilebilir (0711): her çalıştırmanın klasörü kendi kullanıcısına aittir ve
        // başka bir çalıştırma diğer klasörleri listeleyemez.
        if (options.Value.Isolation.Enabled && OperatingSystem.IsLinux())
        {
            File.SetUnixFileMode(
                _root,
                UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute | UnixFileMode.GroupExecute | UnixFileMode.OtherExecute);
        }

        PurgeLeftovers();
    }

    public string Create()
    {
        var directory = Path.Combine(_root, Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        return directory;
    }

    /// <summary>
    /// Klasörü arka planda siler. Windows'ta yeni öldürülmüş bir süreç dosyaları kısa süre kilitli
    /// tutabildiği için birkaç kez dener.
    /// </summary>
    public void Delete(string directory)
    {
        _ = Task.Run(async () =>
        {
            for (var attempt = 1; attempt <= 5; attempt++)
            {
                try
                {
                    if (Directory.Exists(directory))
                    {
                        Directory.Delete(directory, recursive: true);
                    }

                    return;
                }
                catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(200 * attempt));
                }
            }

            _logger.LogWarning("Geçici klasör silinemedi: {Directory}", directory);
        });
    }

    private void PurgeLeftovers()
    {
        try
        {
            foreach (var directory in Directory.EnumerateDirectories(_root))
            {
                if (Directory.GetCreationTimeUtc(directory) < DateTime.UtcNow.AddMinutes(-10))
                {
                    Directory.Delete(directory, recursive: true);
                }
            }
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            _logger.LogDebug(ex, "Eski geçici klasörler temizlenemedi.");
        }
    }
}
