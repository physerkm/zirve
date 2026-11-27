using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Zirve.Runner.Execution;
using Zirve.Shared;
using Zirve.Shared.Execution;

namespace Zirve.Runner.CSharp;

/// <summary>C# kodunu derler ve ayrı bir <c>dotnet</c> sürecinde çalıştırır.</summary>
public sealed class CSharpExecutor
{
    private readonly CSharpCompiler _compiler;
    private readonly RunnerOptions _options;
    private readonly WorkDirectory _workDirectory;
    private readonly string _dotnetPath;
    private readonly string _runtimeConfig;

    public CSharpExecutor(CSharpCompiler compiler, IOptions<RunnerOptions> options, WorkDirectory workDirectory)
    {
        _compiler = compiler;
        _options = options.Value;
        _workDirectory = workDirectory;
        _dotnetPath = ExecutableLocator.ResolveDotnet(_options.DotnetPath);
        _runtimeConfig = BuildRuntimeConfig();
    }

    public async Task<RawExecution> ExecuteAsync(ExecutionRequest request, CancellationToken cancellationToken)
    {
        var compiled = _compiler.Compile(request.Code, request.Mode, _options.EnforceCSharpApiRestrictions);
        if (!compiled.Success)
        {
            return RawExecution.CompileError(compiled.Diagnostics);
        }

        var directory = _workDirectory.Create();

        try
        {
            await File.WriteAllBytesAsync(Path.Combine(directory, "run.dll"), compiled.Assembly!, cancellationToken);
            await File.WriteAllTextAsync(Path.Combine(directory, "run.runtimeconfig.json"), _runtimeConfig, cancellationToken);

            var nonce = Guid.NewGuid().ToString("N");
            var startInfo = CreateStartInfo(directory, nonce);

            if (request.Mode == ExecutionMode.Script)
            {
                var scriptOutcome = await ProcessRunner.RunAsync(
                    startInfo, stdin: null, TimeSpan.FromSeconds(_options.ScriptTimeoutSeconds), _options.MaxOutputBytes, cancellationToken);

                return ScriptResult(scriptOutcome);
            }

            var payload = BuildPayload(request);
            var outcome = await ProcessRunner.RunAsync(
                startInfo, payload, TimeSpan.FromSeconds(_options.TestsTimeoutSeconds), _options.MaxOutputBytes, cancellationToken);

            var parsed = HarnessOutput.Parse(outcome.Stdout, nonce);

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
        finally
        {
            _workDirectory.Delete(directory);
        }
    }

    private RawExecution ScriptResult(ProcessOutcome outcome)
    {
        var status = outcome switch
        {
            { OutputLimitExceeded: true } => ExecutionStatus.OutputLimit,
            { TimedOut: true } => ExecutionStatus.Timeout,
            { ExitCode: not 0 } => ExecutionStatus.RuntimeError,
            _ => ExecutionStatus.Completed,
        };

        return new RawExecution
        {
            Status = status,
            Message = status == ExecutionStatus.RuntimeError ? DescribeCrash(outcome) : null,
            Stdout = outcome.Stdout,
            Stderr = Truncate(outcome.Stderr, 8000),
            DurationMs = outcome.Duration.TotalMilliseconds,
        };
    }

    private ProcessStartInfo CreateStartInfo(string directory, string nonce)
    {
        var startInfo = new ProcessStartInfo(_dotnetPath) { WorkingDirectory = directory };
        startInfo.ArgumentList.Add("exec");
        startInfo.ArgumentList.Add(Path.Combine(directory, "run.dll"));
        startInfo.ArgumentList.Add(nonce);

        // Runner'ın ortam değişkenleri (bağlantı dizeleri, anahtarlar) kullanıcı koduna sızmasın.
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
        environment["DOTNET_NOLOGO"] = "1";
        environment["DOTNET_CLI_TELEMETRY_OPTOUT"] = "1";
        environment["DOTNET_EnableDiagnostics"] = "0";
        environment["DOTNET_TieredPGO"] = "0";
        environment["DOTNET_gcServer"] = "0";
        environment["DOTNET_gcConcurrent"] = "0";
        environment["DOTNET_GCHeapHardLimit"] = (_options.MemoryLimitMb * 1024L * 1024L).ToString("X", CultureInfo.InvariantCulture);

        return startInfo;
    }

    private static string BuildPayload(ExecutionRequest request)
    {
        var spec = request.Spec!;

        return JsonSerializer.Serialize(new
        {
            kind = spec.Kind,
            name = spec.Name,
            tests = request.Tests.Select(test => new { id = test.Id, args = test.Args, ops = test.Ops }),
        }, ZirveJson.Options);
    }

    private static string BuildRuntimeConfig()
    {
        var version = Environment.Version;

        return JsonSerializer.Serialize(new
        {
            runtimeOptions = new
            {
                tfm = $"net{version.Major}.0",
                framework = new { name = "Microsoft.NETCore.App", version = version.ToString(3) },
                configProperties = new Dictionary<string, object>
                {
                    ["System.GC.Server"] = false,
                    ["System.GC.Concurrent"] = false,
                    ["System.Runtime.TieredPGO"] = false,
                },
            },
        });
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

        if (outcome.Stderr.Contains("Stack overflow", StringComparison.OrdinalIgnoreCase))
        {
            return RunnerText.T(
                "Yığın taşması (stack overflow): büyük olasılıkla sonlanmayan bir özyineleme var.",
                "Stack overflow: most likely a recursion that never ends.");
        }

        if (outcome.Stderr.Contains("OutOfMemory", StringComparison.OrdinalIgnoreCase))
        {
            return RunnerText.T("Bellek sınırı aşıldı.", "Memory limit exceeded.");
        }

        var firstLine = outcome.Stderr.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
        return firstLine is null
            ? RunnerText.T(
                $"Program beklenmedik biçimde sonlandı (çıkış kodu {outcome.ExitCode}).",
                $"The program exited unexpectedly (exit code {outcome.ExitCode}).")
            : Truncate(firstLine, 500)!;
    }

    private static string? Truncate(string? text, int max) =>
        string.IsNullOrEmpty(text) ? null : text.Length <= max ? text : text[..max] + "…";
}
