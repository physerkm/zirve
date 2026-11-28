using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Zirve.Runner.Execution;
using Zirve.Shared;
using Zirve.Shared.Execution;

namespace Zirve.Runner.Node;

/// <summary>JavaScript ve TypeScript kodunu ayrı bir Node.js sürecinde çalıştırır.</summary>
public sealed class NodeExecutor
{
    private readonly RunnerOptions _options;
    private readonly WorkDirectory _workDirectory;
    private readonly string _nodePath;
    private readonly string _harnessPath;

    public NodeExecutor(IOptions<RunnerOptions> options, WorkDirectory workDirectory)
    {
        _options = options.Value;
        _workDirectory = workDirectory;
        _nodePath = ExecutableLocator.Resolve(_options.NodePath);
        _harnessPath = Path.Combine(AppContext.BaseDirectory, "Node", "harness.mjs");

        if (!File.Exists(_harnessPath))
        {
            throw new InvalidOperationException($"Node koşucusu bulunamadı: {_harnessPath}");
        }
    }

    public async Task<RawExecution> ExecuteAsync(ExecutionRequest request, CancellationToken cancellationToken)
    {
        var nonce = Guid.NewGuid().ToString("N");
        var isScript = request.Mode == ExecutionMode.Script;

        var payload = JsonSerializer.Serialize(new
        {
            nonce,
            mode = isScript ? "script" : "tests",
            language = request.Language,
            code = request.Code,
            spec = request.Spec,
            tests = request.Tests.Select(test => new { id = test.Id, args = test.Args, ops = test.Ops }),
            perTestTimeoutMs = _options.PerTestTimeoutMs,
            scriptTimeoutMs = _options.ScriptTimeoutSeconds * 1000,
        }, ZirveJson.Options);

        var directory = _workDirectory.Create();

        try
        {
            var startInfo = CreateStartInfo(directory);

            // Script modunda önce koşucunun kendi (daha açıklayıcı) zaman aşımı devreye girsin.
            var timeout = isScript
                ? TimeSpan.FromSeconds(_options.ScriptTimeoutSeconds + 2)
                : TimeSpan.FromSeconds(_options.TestsTimeoutSeconds);

            var outcome = await ProcessRunner.RunAsync(startInfo, payload, timeout, _options.MaxOutputBytes, cancellationToken);

            return isScript ? ScriptResult(outcome) : TestsResult(outcome, nonce);
        }
        finally
        {
            _workDirectory.Delete(directory);
        }
    }

    private static RawExecution TestsResult(ProcessOutcome outcome, string nonce)
    {
        var parsed = HarnessOutput.Parse(outcome.Stdout, nonce);

        if (parsed.CompileError is { } compileError)
        {
            return RawExecution.CompileError([new CompileDiagnostic(compileError.Line, compileError.Column, compileError.Message)]);
        }

        return new RawExecution
        {
            Status = outcome switch
            {
                { OutputLimitExceeded: true } => ExecutionStatus.OutputLimit,
                { TimedOut: true } => ExecutionStatus.Timeout,
                _ when !parsed.Done => ExecutionStatus.RuntimeError,
                _ => ExecutionStatus.Completed,
            },
            Message = parsed.Done ? null : DescribeCrash(outcome),
            Tests = parsed.Tests,
            Stderr = parsed.Done ? null : Truncate(outcome.Stderr, 2000),
            DurationMs = outcome.Duration.TotalMilliseconds,
        };
    }

    private static RawExecution ScriptResult(ProcessOutcome outcome)
    {
        var status = outcome switch
        {
            { OutputLimitExceeded: true } => ExecutionStatus.OutputLimit,
            { TimedOut: true } => ExecutionStatus.Timeout,
            { ExitCode: not 0 } when outcome.Stderr.Contains("Süre sınırı aşıldı", StringComparison.Ordinal)
                                     || outcome.Stderr.Contains("Time limit exceeded", StringComparison.Ordinal) => ExecutionStatus.Timeout,
            { ExitCode: not 0 } => ExecutionStatus.RuntimeError,
            _ => ExecutionStatus.Completed,
        };

        return new RawExecution
        {
            Status = status,
            Message = status == ExecutionStatus.Completed ? null : DescribeCrash(outcome),
            Stdout = outcome.Stdout,
            Stderr = Truncate(outcome.Stderr, 8000),
            DurationMs = outcome.Duration.TotalMilliseconds,
        };
    }

    private ProcessStartInfo CreateStartInfo(string directory)
    {
        var startInfo = new ProcessStartInfo(_nodePath) { WorkingDirectory = directory };

        if (_options.UseNodePermissionModel)
        {
            // Dosya sistemi, alt süreç, worker ve yerel eklenti erişimi kapalı; yalnızca koşucunun
            // kendi klasörü (harness.mjs + node_modules/amaro) okunabilir.
            startInfo.ArgumentList.Add("--permission");
            startInfo.ArgumentList.Add($"--allow-fs-read={Path.Combine(Path.GetDirectoryName(_harnessPath)!, "*")}");
        }

        startInfo.ArgumentList.Add($"--max-old-space-size={_options.MemoryLimitMb.ToString(CultureInfo.InvariantCulture)}");
        startInfo.ArgumentList.Add("--disable-warning=ExperimentalWarning");
        startInfo.ArgumentList.Add(_harnessPath);

        var environment = startInfo.Environment;
        var systemRoot = environment.TryGetValue("SystemRoot", out var value) ? value : null;
        environment.Clear();

        if (!string.IsNullOrEmpty(systemRoot))
        {
            environment["SystemRoot"] = systemRoot;
        }

        environment[RunnerText.EnvironmentVariable] = RunnerText.Locale;
        environment["TEMP"] = directory;
        environment["TMP"] = directory;
        environment["TMPDIR"] = directory;
        environment["HOME"] = directory;
        environment["NODE_NO_WARNINGS"] = "1";
        environment["NO_COLOR"] = "1";

        return startInfo;
    }

    private static string DescribeCrash(ProcessOutcome outcome)
    {
        if (outcome.OutputLimitExceeded)
        {
            return RunnerText.T("Çıktı sınırı aşıldı.", "Output limit exceeded.");
        }

        if (outcome.TimedOut)
        {
            return RunnerText.T("Süre sınırı aşıldı.", "Time limit exceeded.");
        }

        if (outcome.Stderr.Contains("heap out of memory", StringComparison.OrdinalIgnoreCase)
            || outcome.Stderr.Contains("heap limit", StringComparison.OrdinalIgnoreCase))
        {
            return RunnerText.T("Bellek sınırı aşıldı.", "Memory limit exceeded.");
        }

        // Node yakalanmamış bir hatada en sona sürüm satırını ("Node.js v24…") ve yığın izini yazar;
        // kullanıcıya gösterilecek olan bunlardan önceki son satırdır.
        var lastLine = outcome.Stderr
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .LastOrDefault(line => !line.StartsWith("Node.js v", StringComparison.Ordinal) && !line.StartsWith("at ", StringComparison.Ordinal));
        return lastLine is null
            ? RunnerText.T(
                $"Program beklenmedik biçimde sonlandı (çıkış kodu {outcome.ExitCode}).",
                $"The program exited unexpectedly (exit code {outcome.ExitCode}).")
            : Truncate(lastLine, 500)!;
    }

    private static string? Truncate(string? text, int max) =>
        string.IsNullOrEmpty(text) ? null : text.Length <= max ? text : text[..max] + "…";
}
