using System.Text.Json;
using Zirve.Shared;
using Zirve.Shared.Execution;

namespace Zirve.Runner.Execution;

/// <summary>Bir dil yürütücüsünün, beklenen değerlerle karşılaştırma yapılmadan önceki ham sonucu.</summary>
public sealed record RawExecution
{
    public ExecutionStatus Status { get; init; } = ExecutionStatus.Completed;

    public string? Message { get; init; }

    public IReadOnlyList<CompileDiagnostic> Diagnostics { get; init; } = [];

    public IReadOnlyList<RawTestResult> Tests { get; init; } = [];

    public string? Stdout { get; init; }

    public string? Stderr { get; init; }

    public double DurationMs { get; init; }

    public static RawExecution CompileError(IReadOnlyList<CompileDiagnostic> diagnostics, string? message = null) =>
        new() { Status = ExecutionStatus.CompileError, Diagnostics = diagnostics, Message = message };
}

public sealed record RawTestResult
{
    public int Id { get; init; }

    /// <summary>Çözümün döndürdüğü değer; hata ya da zaman aşımında tanımsızdır (<see cref="JsonValueKind.Undefined"/>).</summary>
    public JsonElement Actual { get; init; }

    public string? Error { get; init; }

    public int? ErrorLine { get; init; }

    public string? Stdout { get; init; }

    public double DurationMs { get; init; }

    public bool TimedOut { get; init; }
}

/// <summary>Test koşucularının standart çıktıya yazdığı, nonce ile işaretlenmiş satırların modeli.</summary>
internal sealed class HarnessLine
{
    public int? Id { get; set; }

    public JsonElement Actual { get; set; }

    public string? Error { get; set; }

    public int? Line { get; set; }

    public string? Stdout { get; set; }

    public double? Ms { get; set; }

    public bool? TimedOut { get; set; }

    public bool? Done { get; set; }

    public HarnessCompileError? CompileError { get; set; }
}

internal sealed class HarnessCompileError
{
    public string Message { get; set; } = string.Empty;

    public int Line { get; set; }

    public int Column { get; set; }
}

internal sealed record HarnessOutput(IReadOnlyList<RawTestResult> Tests, bool Done, HarnessCompileError? CompileError, string StrayOutput)
{
    /// <summary>Koşucu çıktısını ayrıştırır: nonce ile başlayan satırlar sonuçtur, gerisi kullanıcı çıktısıdır.</summary>
    public static HarnessOutput Parse(string stdout, string nonce)
    {
        var tests = new List<RawTestResult>();
        var stray = new System.Text.StringBuilder();
        var done = false;
        HarnessCompileError? compileError = null;

        foreach (var rawLine in stdout.Split('\n'))
        {
            var line = rawLine.TrimEnd('\r');

            if (!line.StartsWith(nonce, StringComparison.Ordinal))
            {
                if (line.Length > 0)
                {
                    stray.AppendLine(line);
                }

                continue;
            }

            HarnessLine? parsed;
            try
            {
                parsed = JsonSerializer.Deserialize<HarnessLine>(line.AsSpan(nonce.Length), ZirveJson.Options);
            }
            catch (JsonException)
            {
                continue; // Yarım yazılmış satır (süreç öldürülmüş olabilir).
            }

            if (parsed is null)
            {
                continue;
            }

            if (parsed.CompileError is not null)
            {
                compileError = parsed.CompileError;
            }

            if (parsed.Done == true)
            {
                done = true;
            }

            if (parsed.Id is { } id)
            {
                tests.Add(new RawTestResult
                {
                    Id = id,
                    Actual = parsed.Actual.ValueKind == JsonValueKind.Undefined ? default : parsed.Actual.Clone(),
                    Error = parsed.Error,
                    ErrorLine = parsed.Line is > 0 ? parsed.Line : null,
                    Stdout = string.IsNullOrEmpty(parsed.Stdout) ? null : parsed.Stdout,
                    DurationMs = parsed.Ms ?? 0,
                    TimedOut = parsed.TimedOut == true,
                });
            }
        }

        return new HarnessOutput(tests, done, compileError, stray.ToString());
    }
}
