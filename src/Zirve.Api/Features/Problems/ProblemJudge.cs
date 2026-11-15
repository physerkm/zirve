using System.Text.Json;
using Zirve.Api.Data.Entities;
using Zirve.Api.Infrastructure;
using Zirve.Shared;
using Zirve.Shared.Execution;
using Zirve.Shared.Problems;

namespace Zirve.Api.Features.Problems;

public sealed record JudgedTest(
    int Id,
    TestStatus Status,
    bool Sample,
    JsonElement Args,
    IReadOnlyList<string>? Ops,
    JsonElement Expected,
    JsonElement? Actual,
    string? Stdout,
    string? Error,
    int? ErrorLine,
    double DurationMs);

public sealed record JudgeResult(
    Verdict Verdict,
    string? Message,
    IReadOnlyList<CompileDiagnostic> Diagnostics,
    IReadOnlyList<JudgedTest> Tests,
    int PassedCount,
    int TotalCount,
    double DurationMs);

/// <summary>Bir çözümü problemin testleriyle Runner üzerinde çalıştırır ve hükme bağlar.</summary>
public sealed class ProblemJudge(ICodeRunner runner)
{
    public async Task<JudgeResult> JudgeAsync(Problem problem, string language, string code, bool sampleOnly, CancellationToken cancellationToken)
    {
        var spec = JsonSerializer.Deserialize<ProblemSpec>(problem.SpecJson, ZirveJson.Options)
                   ?? throw new InvalidOperationException($"'{problem.Slug}' probleminin imzası okunamadı.");

        var tests = (JsonSerializer.Deserialize<List<StoredTest>>(problem.TestsJson, ZirveJson.Options) ?? [])
            .Select((test, index) => (Test: test, Id: index))
            .Where(item => !sampleOnly || item.Test.Sample)
            .ToList();

        var execution = await runner.ExecuteAsync(
            new ExecutionRequest
            {
                Language = language,
                Mode = ExecutionMode.Tests,
                Code = code,
                Spec = spec,
                Tests = [.. tests.Select(item => new TestCaseInput
                {
                    Id = item.Id,
                    Args = item.Test.Args,
                    Ops = item.Test.Ops,
                    Expected = item.Test.Expected,
                })],
            },
            cancellationToken);

        var outcomes = execution.Tests.ToDictionary(outcome => outcome.Id);

        var judged = tests
            .Select(item =>
            {
                var outcome = outcomes.GetValueOrDefault(item.Id);
                return new JudgedTest(
                    item.Id,
                    outcome?.Status ?? TestStatus.Skipped,
                    item.Test.Sample,
                    item.Test.Args,
                    item.Test.Ops,
                    item.Test.Expected,
                    outcome?.Actual,
                    outcome?.Stdout,
                    outcome?.Error,
                    outcome?.ErrorLine,
                    outcome?.DurationMs ?? 0);
            })
            .ToList();

        return new JudgeResult(
            Decide(execution, judged),
            execution.Message,
            execution.Diagnostics,
            execution.Status == ExecutionStatus.CompileError ? [] : judged,
            judged.Count(test => test.Status == TestStatus.Passed),
            judged.Count,
            execution.DurationMs);
    }

    private static Verdict Decide(ExecutionResult execution, List<JudgedTest> tests)
    {
        switch (execution.Status)
        {
            case ExecutionStatus.CompileError:
                return Verdict.CompileError;
            case ExecutionStatus.InternalError:
                return Verdict.InternalError;
            case ExecutionStatus.OutputLimit:
                return Verdict.OutputLimitExceeded;
        }

        // Hüküm, ilk başarısız testin türüne göre verilir.
        foreach (var test in tests)
        {
            switch (test.Status)
            {
                case TestStatus.Timeout:
                    return Verdict.TimeLimitExceeded;
                case TestStatus.Error:
                    return Verdict.RuntimeError;
                case TestStatus.Failed:
                    return Verdict.WrongAnswer;
                case TestStatus.Skipped:
                    return execution.Status == ExecutionStatus.Timeout ? Verdict.TimeLimitExceeded : Verdict.RuntimeError;
            }
        }

        return execution.Status switch
        {
            ExecutionStatus.Timeout => Verdict.TimeLimitExceeded,
            ExecutionStatus.RuntimeError => Verdict.RuntimeError,
            _ => Verdict.Accepted,
        };
    }
}
