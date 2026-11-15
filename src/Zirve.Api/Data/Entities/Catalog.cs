using NpgsqlTypes;

namespace Zirve.Api.Data.Entities;

/// <summary>Bir öğrenme yolu (ör. C#, Algoritmalar, Sistem Tasarımı).</summary>
public sealed class Track
{
    public int Id { get; set; }

    public required string Slug { get; set; }

    public required string Title { get; set; }

    public string Description { get; set; } = string.Empty;

    public string Icon { get; set; } = string.Empty;

    public string Accent { get; set; } = string.Empty;

    public int Order { get; set; }

    public List<Module> Modules { get; set; } = [];

    public List<Quiz> Quizzes { get; set; } = [];
}

public sealed class Module
{
    public int Id { get; set; }

    public int TrackId { get; set; }

    public Track Track { get; set; } = null!;

    public required string Slug { get; set; }

    public required string Title { get; set; }

    public string Description { get; set; } = string.Empty;

    public int Order { get; set; }

    public List<Lesson> Lessons { get; set; } = [];
}

public sealed class Lesson
{
    public int Id { get; set; }

    public int ModuleId { get; set; }

    public Module Module { get; set; } = null!;

    /// <summary>Sorguları sadeleştirmek ve slug'ı yol içinde benzersiz kılmak için tutulur.</summary>
    public int TrackId { get; set; }

    public Track Track { get; set; } = null!;

    public required string Slug { get; set; }

    public required string Title { get; set; }

    public string Summary { get; set; } = string.Empty;

    /// <summary>Markdown içerik.</summary>
    public required string Content { get; set; }

    public int Minutes { get; set; }

    public ContentLevel Level { get; set; }

    public int Order { get; set; }

    /// <summary>PostgreSQL tarafından üretilen tam metin arama vektörü.</summary>
    public NpgsqlTsVector SearchVector { get; set; } = null!;
}

/// <summary>İçerik dosyalarının en son eşitlenen özetini tutar; değişiklik yoksa eşitleme atlanır.</summary>
public sealed class ContentState
{
    public required string Key { get; set; }

    public required string Hash { get; set; }

    public DateTimeOffset SyncedAt { get; set; }
}
