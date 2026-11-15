namespace Zirve.Api.Data.Entities;

public sealed class Quiz
{
    public int Id { get; set; }

    public int TrackId { get; set; }

    public Track Track { get; set; } = null!;

    public required string Slug { get; set; }

    public required string Title { get; set; }

    public string Description { get; set; } = string.Empty;

    public ContentLevel Level { get; set; }

    public int? TimeLimitMinutes { get; set; }

    public int Order { get; set; }

    /// <summary>Soruların özeti; değişmediyse sorular yeniden yazılmaz.</summary>
    public string ContentHash { get; set; } = string.Empty;

    public List<Question> Questions { get; set; } = [];
}

public sealed class Question
{
    public int Id { get; set; }

    public int QuizId { get; set; }

    public Quiz Quiz { get; set; } = null!;

    public int Order { get; set; }

    /// <summary>Markdown soru metni.</summary>
    public required string Text { get; set; }

    /// <summary>Markdown açıklama; yanıt gönderildikten sonra gösterilir.</summary>
    public string Explanation { get; set; } = string.Empty;

    public Difficulty Difficulty { get; set; }

    /// <summary>Birden fazla doğru şık varsa true.</summary>
    public bool IsMultiple { get; set; }

    public List<QuestionOption> Options { get; set; } = [];
}

public sealed class QuestionOption
{
    public int Id { get; set; }

    public int QuestionId { get; set; }

    public Question Question { get; set; } = null!;

    public int Order { get; set; }

    public required string Text { get; set; }

    public bool IsCorrect { get; set; }
}

public sealed class QuizAttempt
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public AppUser User { get; set; } = null!;

    public int QuizId { get; set; }

    public Quiz Quiz { get; set; } = null!;

    public int CorrectCount { get; set; }

    public int TotalCount { get; set; }

    public int DurationSeconds { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
