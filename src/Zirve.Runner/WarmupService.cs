using Zirve.Runner.Execution;
using Zirve.Shared.Execution;
using Zirve.Shared.Problems;

namespace Zirve.Runner;

/// <summary>
/// Roslyn'in ilk derlemesi saniyeler sürebilir. İlk kullanıcı bunu beklemesin diye servis açılırken
/// arka planda küçük bir program derlenip çalıştırılır.
/// </summary>
public sealed class WarmupService(ExecutionService executionService, ILogger<WarmupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();

        foreach (var (language, code) in new[]
                 {
                     (Languages.CSharp, "Console.WriteLine(Enumerable.Range(1, 3).Sum());"),
                     (Languages.TypeScript, "const total: number = [1, 2, 3].reduce((a, b) => a + b, 0); console.log(total);"),
                 })
        {
            try
            {
                var result = await executionService.ExecuteAsync(
                    new ExecutionRequest { Language = language, Mode = ExecutionMode.Script, Code = code },
                    stoppingToken);

                if (result.Status == ExecutionStatus.Completed)
                {
                    logger.LogInformation("Isınma tamamlandı: {Language} ({Duration} ms).", language, result.DurationMs);
                }
                else
                {
                    logger.LogWarning(
                        "Isınma başarısız: {Language} -> {Status} {Message} {Stderr}",
                        language, result.Status, result.Message, result.Stderr);
                }
            }
            catch (OperationCanceledException)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Isınma sırasında hata: {Language}.", language);
            }
        }
    }
}
