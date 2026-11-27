using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Zirve.Runner;
using Zirve.Runner.CSharp;
using Zirve.Runner.Execution;
using Zirve.Runner.Node;
using Zirve.Shared.Execution;
using Zirve.Shared.Problems;

namespace Zirve.Tests.Runner;

/// <summary>Gerçek derleyici ve gerçek alt süreçlerle çalışan, testler arasında paylaşılan Runner.</summary>
public sealed class RunnerFixture
{
    public RunnerFixture()
    {
        var options = Options.Create(new RunnerOptions
        {
            TestsTimeoutSeconds = 4,
            ScriptTimeoutSeconds = 3,
            PerTestTimeoutMs = 1000,
            MaxConcurrency = 4,
        });

        var workDirectory = new WorkDirectory(options, NullLogger<WorkDirectory>.Instance);
        var compiler = new CSharpCompiler();

        Service = new ExecutionService(
            new CSharpExecutor(compiler, options, workDirectory),
            new NodeExecutor(options, workDirectory),
            options,
            NullLogger<ExecutionService>.Instance);
    }

    public ExecutionService Service { get; }

    public Task<ExecutionResult> RunTestsAsync(string language, string code, ProblemSpec spec, params (string Args, string Expected)[] tests) =>
        RunTestsInAsync("tr", language, code, spec, tests);

    /// <summary>İletilerin dili verilerek (ör. "en") test modunda çalıştırır.</summary>
    public Task<ExecutionResult> RunTestsInAsync(string locale, string language, string code, ProblemSpec spec, params (string Args, string Expected)[] tests) =>
        Service.ExecuteAsync(
            new ExecutionRequest
            {
                Language = language,
                Mode = ExecutionMode.Tests,
                Code = code,
                Spec = spec,
                Tests = [.. tests.Select((test, index) => new TestCaseInput { Id = index, Args = Json(test.Args), Expected = Json(test.Expected) })],
                Locale = locale,
            },
            TestContext.Current.CancellationToken);

    public Task<ExecutionResult> RunClassTestsAsync(string language, string code, ProblemSpec spec, params (string Ops, string Args, string Expected)[] tests) =>
        Service.ExecuteAsync(
            new ExecutionRequest
            {
                Language = language,
                Mode = ExecutionMode.Tests,
                Code = code,
                Spec = spec,
                Tests =
                [
                    .. tests.Select((test, index) => new TestCaseInput
                    {
                        Id = index,
                        Ops = JsonSerializer.Deserialize<List<string>>(test.Ops),
                        Args = Json(test.Args),
                        Expected = Json(test.Expected),
                    }),
                ],
            },
            TestContext.Current.CancellationToken);

    public Task<ExecutionResult> RunScriptAsync(string language, string code, string locale = "tr") =>
        Service.ExecuteAsync(
            new ExecutionRequest { Language = language, Mode = ExecutionMode.Script, Code = code, Locale = locale },
            TestContext.Current.CancellationToken);

    public static JsonElement Json(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }
}
