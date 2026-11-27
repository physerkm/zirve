using System.Text.Json;
using Microsoft.Extensions.Options;
using Zirve.Runner.CSharp;
using Zirve.Runner.Node;
using Zirve.Shared.Execution;
using Zirve.Shared.Problems;

namespace Zirve.Runner.Execution;

public sealed class RunnerBusyException() : Exception(RunnerText.T("Kod çalıştırma servisi şu anda dolu.", "The code runner is busy right now."));

public sealed class InvalidExecutionRequestException(string message) : Exception(message);

/// <summary>
/// İstekleri doğrular, eşzamanlılığı sınırlar, ilgili dil yürütücüsünü çağırır ve ham sonuçları
/// beklenen değerlerle karşılaştırarak nihai sonucu üretir.
/// </summary>
public sealed class ExecutionService
{
    private readonly CSharpExecutor _csharp;
    private readonly NodeExecutor _node;
    private readonly RunnerOptions _options;
    private readonly ILogger<ExecutionService> _logger;
    private readonly SemaphoreSlim _slots;

    public ExecutionService(CSharpExecutor csharp, NodeExecutor node, IOptions<RunnerOptions> options, ILogger<ExecutionService> logger)
    {
        _csharp = csharp;
        _node = node;
        _options = options.Value;
        _logger = logger;
        _slots = new SemaphoreSlim(_options.EffectiveConcurrency, _options.EffectiveConcurrency);
    }

    public async Task<ExecutionResult> ExecuteAsync(ExecutionRequest request, CancellationToken cancellationToken)
    {
        RunnerText.Use(request.Locale);
        Validate(request);

        if (!await _slots.WaitAsync(TimeSpan.FromSeconds(_options.QueueTimeoutSeconds), cancellationToken))
        {
            throw new RunnerBusyException();
        }

        try
        {
            var raw = request.Language == Languages.CSharp
                ? await _csharp.ExecuteAsync(request, cancellationToken)
                : await _node.ExecuteAsync(request, cancellationToken);

            return BuildResult(request, raw);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Kod çalıştırma başarısız oldu ({Language}, {Mode}).", request.Language, request.Mode);

            return new ExecutionResult
            {
                Status = ExecutionStatus.InternalError,
                Message = RunnerText.T(
                    "Kod çalıştırılırken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
                    "An unexpected error occurred while running the code. Please try again."),
            };
        }
        finally
        {
            _slots.Release();
        }
    }

    private void Validate(ExecutionRequest request)
    {
        if (!Languages.IsSupported(request.Language))
        {
            throw new InvalidExecutionRequestException($"Desteklenmeyen dil: '{request.Language}'.");
        }

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            throw new InvalidExecutionRequestException(RunnerText.T("Kod boş olamaz.", "Code can't be empty."));
        }

        if (request.Code.Length > _options.MaxCodeLength)
        {
            throw new InvalidExecutionRequestException($"Kod en fazla {_options.MaxCodeLength} karakter olabilir.");
        }

        if (request.Mode != ExecutionMode.Tests)
        {
            return;
        }

        if (request.Spec is null)
        {
            throw new InvalidExecutionRequestException(RunnerText.T(
                "Test modunda problem imzası (spec) zorunludur.", "A problem signature (spec) is required in test mode."));
        }

        if (request.Tests.Count == 0 || request.Tests.Count > _options.MaxTests)
        {
            throw new InvalidExecutionRequestException(RunnerText.T(
                $"Test sayısı 1 ile {_options.MaxTests} arasında olmalı.", $"The number of tests must be between 1 and {_options.MaxTests}."));
        }

        foreach (var test in request.Tests)
        {
            if (test.Args.ValueKind != JsonValueKind.Array)
            {
                throw new InvalidExecutionRequestException(RunnerText.T($"Test {test.Id}: 'args' bir dizi olmalı.", $"Test {test.Id}: 'args' must be an array."));
            }

            if (request.Spec.Kind == ProblemKinds.Class
                && (test.Ops is null || test.Ops.Count == 0 || test.Ops.Count != test.Args.GetArrayLength()))
            {
                throw new InvalidExecutionRequestException(RunnerText.T(
                    $"Test {test.Id}: 'ops' ve 'args' aynı uzunlukta olmalı.", $"Test {test.Id}: 'ops' and 'args' must have the same length."));
            }
        }
    }

    private static ExecutionResult BuildResult(ExecutionRequest request, RawExecution raw)
    {
        if (request.Mode == ExecutionMode.Script || raw.Status == ExecutionStatus.CompileError)
        {
            return new ExecutionResult
            {
                Status = raw.Status,
                Message = raw.Message,
                Diagnostics = raw.Diagnostics,
                Stdout = raw.Stdout,
                Stderr = raw.Stderr,
                DurationMs = Math.Round(raw.DurationMs, 1),
            };
        }

        var compare = request.Spec!.Compare;
        var results = new Dictionary<int, RawTestResult>();
        foreach (var result in raw.Tests)
        {
            results[result.Id] = result;
        }

        var outcomes = new List<TestOutcome>(request.Tests.Count);
        var blamed = false;

        foreach (var test in request.Tests)
        {
            if (results.TryGetValue(test.Id, out var result))
            {
                var status = result switch
                {
                    { TimedOut: true } => TestStatus.Timeout,
                    { Error: not null } => TestStatus.Error,
                    _ => ResultComparer.AreEqual(test.Expected, result.Actual, compare) ? TestStatus.Passed : TestStatus.Failed,
                };

                outcomes.Add(new TestOutcome
                {
                    Id = test.Id,
                    Status = status,
                    Actual = result.Actual.ValueKind == JsonValueKind.Undefined ? null : result.Actual,
                    Stdout = result.Stdout,
                    Error = result.Error,
                    ErrorLine = result.ErrorLine,
                    DurationMs = result.DurationMs,
                });

                continue;
            }

            // Süreç bu teste gelmeden (ya da bu testin ortasında) sonlandı: ilk eksik test sorumludur.
            if (!blamed && raw.Status is ExecutionStatus.Timeout or ExecutionStatus.RuntimeError or ExecutionStatus.OutputLimit)
            {
                blamed = true;
                outcomes.Add(new TestOutcome
                {
                    Id = test.Id,
                    Status = raw.Status == ExecutionStatus.Timeout ? TestStatus.Timeout : TestStatus.Error,
                    Error = raw.Message,
                });

                continue;
            }

            outcomes.Add(new TestOutcome { Id = test.Id, Status = TestStatus.Skipped });
        }

        return new ExecutionResult
        {
            Status = raw.Status,
            Message = raw.Message,
            Tests = outcomes,
            Stderr = raw.Stderr,
            DurationMs = Math.Round(raw.DurationMs, 1),
        };
    }
}
