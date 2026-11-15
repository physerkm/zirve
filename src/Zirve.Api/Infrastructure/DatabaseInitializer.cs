using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;
using Zirve.Api.Content;
using Zirve.Api.Data;

namespace Zirve.Api.Infrastructure;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    /// <summary>
    /// Açılışta bekleyen EF Core migration'larını uygular. Geliştirmede ve tek örnekli kurulumlarda pratiktir;
    /// çok örnekli üretim ortamlarında migration'ları dağıtım adımında (migration bundle) çalıştırıp bunu kapatın.
    /// </summary>
    public bool ApplyMigrationsOnStartup { get; set; }

    /// <summary>Açılışta içerik dosyalarını veritabanına eşitler.</summary>
    public bool SyncContentOnStartup { get; set; } = true;
}

/// <summary>Uygulama istek almaya başlamadan önce şemayı ve içeriği hazırlar.</summary>
public sealed class DatabaseInitializer(
    AppDbContext db,
    ContentSynchronizer synchronizer,
    IOptions<DatabaseOptions> databaseOptions,
    IOptions<ContentOptions> contentOptions,
    IHostEnvironment environment,
    ILogger<DatabaseInitializer> logger)
{
    private const int MaxAttempts = 10;

    public async Task InitializeAsync(CancellationToken cancellationToken)
    {
        var options = databaseOptions.Value;

        if (options.ApplyMigrationsOnStartup)
        {
            await WithRetryAsync(() => db.Database.MigrateAsync(cancellationToken), cancellationToken);
        }

        if (!options.SyncContentOnStartup)
        {
            return;
        }

        var root = ContentLoader.ResolveRoot(contentOptions.Value.Path, environment.ContentRootPath);
        logger.LogInformation("İçerik klasörü: {Root}", root);

        // İçerik hataları açılışı durdurur: bozuk içerikle çalışmaktansa hiç başlamamak daha güvenlidir.
        var bundle = ContentLoader.Load(root);
        await WithRetryAsync(() => synchronizer.SyncAsync(bundle, cancellationToken), cancellationToken);
    }

    /// <summary>Kapsayıcı ortamlarında veritabanı API'den birkaç saniye sonra hazır olabilir.</summary>
    private async Task WithRetryAsync(Func<Task> action, CancellationToken cancellationToken)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                await action();
                return;
            }
            catch (Exception ex) when (attempt < MaxAttempts && IsTransient(ex))
            {
                logger.LogWarning("Veritabanına ulaşılamadı (deneme {Attempt}/{Max}): {Message}", attempt, MaxAttempts, ex.Message);
                await Task.Delay(TimeSpan.FromSeconds(Math.Min(attempt * 2, 10)), cancellationToken);
            }
        }
    }

    private static bool IsTransient(Exception exception) =>
        exception is NpgsqlException { IsTransient: true }
            or System.Net.Sockets.SocketException
            or TimeoutException
        || (exception.InnerException is not null && IsTransient(exception.InnerException));
}
