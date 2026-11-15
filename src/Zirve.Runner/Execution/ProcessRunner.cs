using System.ComponentModel;
using System.Diagnostics;
using System.Text;

namespace Zirve.Runner.Execution;

public sealed record ProcessOutcome(
    int ExitCode,
    string Stdout,
    string Stderr,
    bool TimedOut,
    bool OutputLimitExceeded,
    TimeSpan Duration);

/// <summary>
/// Bir alt süreci süre ve çıktı sınırlarıyla çalıştırır. Sınır aşılırsa süreç ağacı öldürülür.
/// </summary>
public static class ProcessRunner
{
    private static readonly UTF8Encoding Utf8 = new(encoderShouldEmitUTF8Identifier: false);

    public static async Task<ProcessOutcome> RunAsync(
        ProcessStartInfo startInfo,
        string? stdin,
        TimeSpan timeout,
        int maxOutputChars,
        CancellationToken cancellationToken)
    {
        CrashDialogs.Suppress();

        startInfo.UseShellExecute = false;
        startInfo.CreateNoWindow = true;
        startInfo.RedirectStandardInput = true;
        startInfo.RedirectStandardOutput = true;
        startInfo.RedirectStandardError = true;
        startInfo.StandardInputEncoding = Utf8;
        startInfo.StandardOutputEncoding = Utf8;
        startInfo.StandardErrorEncoding = Utf8;

        using var process = new Process { StartInfo = startInfo };
        var stopwatch = Stopwatch.StartNew();

        if (!process.Start())
        {
            throw new InvalidOperationException($"Süreç başlatılamadı: {startInfo.FileName}");
        }

        var stdout = new CappedReader(process.StandardOutput, maxOutputChars, onLimit: () => TryKill(process));
        var stderr = new CappedReader(process.StandardError, Math.Min(maxOutputChars, 64_000), onLimit: null);
        var stdinTask = WriteStdinAsync(process, stdin);

        var timedOut = false;
        using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutSource.CancelAfter(timeout);

        try
        {
            await process.WaitForExitAsync(timeoutSource.Token);
        }
        catch (OperationCanceledException)
        {
            timedOut = !cancellationToken.IsCancellationRequested;
            TryKill(process);

            try
            {
                await process.WaitForExitAsync(CancellationToken.None).WaitAsync(TimeSpan.FromSeconds(5), CancellationToken.None);
            }
            catch (TimeoutException)
            {
                // Süreç ölmeyi reddetti; elimizdeki çıktıyla devam ediyoruz.
            }
        }

        stopwatch.Stop();

        // Okuyucular süreç bitince EOF görür; yine de sonsuza dek beklemeyelim.
        await Task.WhenAny(Task.WhenAll(stdout.Completion, stderr.Completion, stdinTask), Task.Delay(TimeSpan.FromSeconds(2), CancellationToken.None));

        cancellationToken.ThrowIfCancellationRequested();

        var exitCode = process.HasExited ? process.ExitCode : -1;
        return new ProcessOutcome(exitCode, stdout.Snapshot(), stderr.Snapshot(), timedOut, stdout.LimitExceeded, stopwatch.Elapsed);
    }

    private static async Task WriteStdinAsync(Process process, string? stdin)
    {
        try
        {
            if (!string.IsNullOrEmpty(stdin))
            {
                await process.StandardInput.WriteAsync(stdin);
            }

            process.StandardInput.Close();
        }
        catch (IOException)
        {
            // Süreç girdiyi okumadan sonlandı.
        }
        catch (ObjectDisposedException)
        {
        }
    }

    private static void TryKill(Process process)
    {
        try
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
            }
        }
        catch (InvalidOperationException)
        {
        }
        catch (Win32Exception)
        {
        }
    }

    private sealed class CappedReader
    {
        private readonly StringBuilder _buffer = new();
        private readonly int _limit;
        private readonly Action? _onLimit;
        private volatile bool _limitExceeded;

        public CappedReader(StreamReader reader, int limit, Action? onLimit)
        {
            _limit = limit;
            _onLimit = onLimit;
            Completion = Task.Run(() => PumpAsync(reader));
        }

        public Task Completion { get; }

        public bool LimitExceeded => _limitExceeded;

        public string Snapshot()
        {
            lock (_buffer)
            {
                return _buffer.ToString();
            }
        }

        private async Task PumpAsync(StreamReader reader)
        {
            var chunk = new char[8192];

            try
            {
                while (true)
                {
                    var read = await reader.ReadAsync(chunk.AsMemory());
                    if (read == 0)
                    {
                        return;
                    }

                    lock (_buffer)
                    {
                        var room = _limit - _buffer.Length;
                        if (room > 0)
                        {
                            _buffer.Append(chunk, 0, Math.Min(room, read));
                        }

                        if (read <= room)
                        {
                            continue;
                        }
                    }

                    if (!_limitExceeded)
                    {
                        _limitExceeded = true;
                        _onLimit?.Invoke();
                    }
                }
            }
            catch (IOException)
            {
            }
            catch (ObjectDisposedException)
            {
            }
        }
    }
}
