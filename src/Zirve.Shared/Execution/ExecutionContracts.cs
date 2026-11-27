using System.Text.Json;
using Zirve.Shared.Problems;

namespace Zirve.Shared.Execution;

public enum ExecutionMode
{
    /// <summary>Kod, problem imzasına göre test senaryolarıyla çalıştırılır.</summary>
    Tests,

    /// <summary>Kod olduğu gibi çalıştırılır ve standart çıktısı döndürülür (deneme alanı).</summary>
    Script,
}

public enum ExecutionStatus
{
    Completed,
    CompileError,
    RuntimeError,
    Timeout,
    OutputLimit,
    InternalError,
}

public enum TestStatus
{
    Passed,
    Failed,
    Error,
    Timeout,
    Skipped,
}

public sealed record TestCaseInput
{
    public int Id { get; init; }

    /// <summary>Fonksiyon problemlerinde argüman dizisi; sınıf problemlerinde her işlem için argüman dizilerinin dizisi.</summary>
    public JsonElement Args { get; init; }

    /// <summary>Yalnızca sınıf problemlerinde: ilk eleman sınıf adı, sonrakiler metot adları.</summary>
    public IReadOnlyList<string>? Ops { get; init; }

    public JsonElement Expected { get; init; }
}

public sealed record ExecutionRequest
{
    public required string Language { get; init; }

    public ExecutionMode Mode { get; init; } = ExecutionMode.Tests;

    public required string Code { get; init; }

    public ProblemSpec? Spec { get; init; }

    public IReadOnlyList<TestCaseInput> Tests { get; init; } = [];

    /// <summary>Kullanıcıya dönen iletilerin dili: "tr" (varsayılan) ya da "en".</summary>
    public string Locale { get; init; } = "tr";
}

public sealed record CompileDiagnostic(int Line, int Column, string Message);

public sealed record TestOutcome
{
    public int Id { get; init; }

    public TestStatus Status { get; init; }

    public JsonElement? Actual { get; init; }

    public string? Stdout { get; init; }

    public string? Error { get; init; }

    public int? ErrorLine { get; init; }

    public double DurationMs { get; init; }
}

public sealed record ExecutionResult
{
    public ExecutionStatus Status { get; init; }

    public string? Message { get; init; }

    public IReadOnlyList<CompileDiagnostic> Diagnostics { get; init; } = [];

    public IReadOnlyList<TestOutcome> Tests { get; init; } = [];

    public string? Stdout { get; init; }

    public string? Stderr { get; init; }

    public double DurationMs { get; init; }
}
