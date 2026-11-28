using System.Diagnostics;
using System.Globalization;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Zirve.Runner;
using Zirve.Runner.Execution;

namespace Zirve.Tests.Runner;

/// <summary>
/// Çalıştırma başına işletim sistemi yalıtımının (<see cref="Sandbox"/>) gerçekten işlediğini doğrular. Kullanıcı
/// kodunun dil düzeyindeki yalıtımı aştığı varsayılır: çocuk süreç doğrudan kabuk komutları çalıştırır.
/// <para>
/// Yalnızca Linux'ta, root olarak (Runner kapsayıcısıyla aynı yetkilerle) ve <c>ZIRVE_ISOLATION_TESTS=1</c> iken
/// koşar; CI bunları ayrı bir işte bir kapsayıcı içinde çalıştırır. Diğer ortamlarda atlanır.
/// </para>
/// </summary>
public sealed class IsolationTests
{
    private static readonly bool Available =
        OperatingSystem.IsLinux()
        && Environment.IsPrivilegedProcess
        && Environment.GetEnvironmentVariable("ZIRVE_ISOLATION_TESTS") == "1";

    private const string SkipReason = "Yalıtım testleri yalnızca Linux'ta, root olarak ve ZIRVE_ISOLATION_TESTS=1 iken koşar.";

    private static (Sandbox Sandbox, WorkDirectory Work, string Root) Create(int memoryMb = 640)
    {
        var root = Path.Combine(Path.GetTempPath(), "zirve-isolation-" + Guid.NewGuid().ToString("N")[..8]);
        var options = Options.Create(new RunnerOptions
        {
            MaxConcurrency = 2,
            WorkDirectory = root,
            Isolation = new IsolationOptions { Enabled = true, ProcessMemoryMb = memoryMb },
        });

        return (new Sandbox(options, NullLogger<Sandbox>.Instance), new WorkDirectory(options, NullLogger<WorkDirectory>.Instance), root);
    }

    private static Task<ProcessOutcome> RunShellAsync(Sandbox sandbox, SandboxLease lease, string directory, string script)
    {
        var inner = new ProcessStartInfo("/bin/sh") { WorkingDirectory = directory };
        inner.ArgumentList.Add("-c");
        inner.ArgumentList.Add(script);
        inner.Environment.Clear();
        inner.Environment["PATH"] = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin";

        return ProcessRunner.RunAsync(sandbox.Wrap(inner, lease), stdin: null, TimeSpan.FromSeconds(30), 100_000, TestContext.Current.CancellationToken);
    }

    [Fact]
    public async Task Child_runs_as_its_own_user_and_cannot_reach_the_runner()
    {
        Assert.SkipUnless(Available, SkipReason);
        var (sandbox, work, _) = Create();
        var lease = sandbox.Acquire()!;
        var directory = work.Create();
        sandbox.PrepareDirectory(directory, lease);
        var runner = Environment.ProcessId.ToString(CultureInfo.InvariantCulture);

        try
        {
            var outcome = await RunShellAsync(sandbox, lease, directory, $"""
                id -u
                cat /proc/{runner}/environ > /dev/null 2>&1 && echo RUNNER_ENV_READABLE
                kill -0 {runner} 2> /dev/null && echo CAN_SIGNAL_RUNNER
                touch own-file && echo CAN_WRITE_OWN_DIRECTORY
                """);

            var lines = outcome.Stdout.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            Assert.Equal(lease.Uid.ToString(CultureInfo.InvariantCulture), lines[0]);
            Assert.DoesNotContain("RUNNER_ENV_READABLE", outcome.Stdout);
            Assert.DoesNotContain("CAN_SIGNAL_RUNNER", outcome.Stdout);
            Assert.Contains("CAN_WRITE_OWN_DIRECTORY", outcome.Stdout);
        }
        finally
        {
            await sandbox.ReleaseAsync(lease);
        }
    }

    [Fact]
    public async Task Runs_cannot_see_each_others_files()
    {
        Assert.SkipUnless(Available, SkipReason);
        var (sandbox, work, root) = Create();
        var first = sandbox.Acquire()!;
        var second = sandbox.Acquire()!;

        try
        {
            var other = work.Create();
            await File.WriteAllTextAsync(Path.Combine(other, "solution.txt"), "secret", TestContext.Current.CancellationToken);
            sandbox.PrepareDirectory(other, second);

            var own = work.Create();
            sandbox.PrepareDirectory(own, first);

            var outcome = await RunShellAsync(sandbox, first, own, $"""
                cat {other}/solution.txt 2> /dev/null && echo READ_OTHER_RUN
                ls {root} > /dev/null 2>&1 && echo LISTED_ALL_RUNS
                echo done
                """);

            Assert.Contains("done", outcome.Stdout);
            Assert.DoesNotContain("READ_OTHER_RUN", outcome.Stdout);
            Assert.DoesNotContain("LISTED_ALL_RUNS", outcome.Stdout);
        }
        finally
        {
            await sandbox.ReleaseAsync(first);
            await sandbox.ReleaseAsync(second);
        }
    }

    [Fact]
    public async Task Data_memory_is_limited_per_run()
    {
        Assert.SkipUnless(Available, SkipReason);
        var (sandbox, work, _) = Create(memoryMb: 128);
        var lease = sandbox.Acquire()!;
        var directory = work.Create();
        sandbox.PrepareDirectory(directory, lease);

        try
        {
            // "tail -c N" bir borudan okurken son N baytı bellekte tutar: 256 MB, 128 MB sınırına sığmamalı.
            var outcome = await RunShellAsync(sandbox, lease, directory, """
                head -c 300000000 /dev/zero | tail -c 256000000 > /dev/null && echo FITS || echo LIMITED
                """);

            Assert.Contains("LIMITED", outcome.Stdout);
        }
        finally
        {
            await sandbox.ReleaseAsync(lease);
        }
    }

    [Fact]
    public async Task Release_kills_processes_left_behind()
    {
        Assert.SkipUnless(Available, SkipReason);
        var (sandbox, work, _) = Create();
        var lease = sandbox.Acquire()!;
        var directory = work.Create();
        sandbox.PrepareDirectory(directory, lease);

        var outcome = await RunShellAsync(sandbox, lease, directory, "sleep 300 > /dev/null 2>&1 & echo $!");
        var leftover = int.Parse(outcome.Stdout.Trim(), CultureInfo.InvariantCulture);
        Assert.True(IsAlive(leftover), "Arka plandaki süreç başlamış olmalı.");

        await sandbox.ReleaseAsync(lease);

        // Öldürülen süreç, onu toplayacak bir init yoksa kısa süre "zombi" olarak görünebilir.
        await Task.Delay(200, TestContext.Current.CancellationToken);
        Assert.False(IsAlive(leftover), "Yuva geri verildiğinde arkada kalan süreç öldürülmeli.");
    }

    private static bool IsAlive(int pid)
    {
        var status = $"/proc/{pid}/status";
        if (!File.Exists(status))
        {
            return false;
        }

        var state = File.ReadLines(status).FirstOrDefault(line => line.StartsWith("State:", StringComparison.Ordinal)) ?? string.Empty;
        return !state.Contains('Z');
    }
}
