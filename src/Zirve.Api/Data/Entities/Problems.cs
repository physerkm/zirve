using System.Text.Json;
using NpgsqlTypes;

namespace Zirve.Api.Data.Entities;

public sealed class Problem
{
    public int Id { get; set; }

    public required string Slug { get; set; }

    /// <summary>Listedeki sıra numarası.</summary>
    public int Number { get; set; }

    public required string Title { get; set; }

    public Difficulty Difficulty { get; set; }

    /// <summary>Markdown problem tanımı.</summary>
    public required string Statement { get; set; }

    public List<string> Hints { get; set; } = [];

    public List<string> Tags { get; set; } = [];

    public List<string> Languages { get; set; } = [];

    /// <summary><see cref="Zirve.Shared.Problems.ProblemSpec"/> (jsonb).</summary>
    public required string SpecJson { get; set; }

    /// <summary><see cref="StoredTest"/> listesi (jsonb).</summary>
    public required string TestsJson { get; set; }

    /// <summary>Markdown çözüm anlatımı.</summary>
    public string? Editorial { get; set; }

    /// <summary>Dil -> referans çözüm (jsonb).</summary>
    public string SolutionsJson { get; set; } = "{}";

    public NpgsqlTsVector SearchVector { get; set; } = null!;
}

/// <summary>Bir problemin veritabanında saklanan test senaryosu.</summary>
public sealed record StoredTest
{
    public JsonElement Args { get; init; }

    public IReadOnlyList<string>? Ops { get; init; }

    public JsonElement Expected { get; init; }

    /// <summary>Örnek testler problem sayfasında gösterilir ve "Çalıştır" ile koşturulur.</summary>
    public bool Sample { get; init; }
}

public sealed class Submission
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public AppUser User { get; set; } = null!;

    public int ProblemId { get; set; }

    public Problem Problem { get; set; } = null!;

    public required string Language { get; set; }

    public required string Code { get; set; }

    public Verdict Verdict { get; set; }

    public int PassedCount { get; set; }

    public int TotalCount { get; set; }

    public double DurationMs { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
