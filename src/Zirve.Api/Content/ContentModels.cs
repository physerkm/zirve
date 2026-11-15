using Zirve.Api.Data.Entities;
using Zirve.Shared.Problems;

namespace Zirve.Api.Content;

public sealed class ContentOptions
{
    public const string SectionName = "Content";

    /// <summary>İçerik klasörü. Boşsa uygulama kökünden yukarı doğru "content" klasörü aranır.</summary>
    public string? Path { get; set; }
}

/// <summary>İçerik dosyalarında bir ya da daha fazla hata bulunduğunda fırlatılır; bütün hataları birlikte taşır.</summary>
public sealed class ContentException(IReadOnlyList<string> errors)
    : Exception($"İçerik dosyalarında {errors.Count} hata bulundu:{Environment.NewLine}- {string.Join(Environment.NewLine + "- ", errors)}")
{
    public IReadOnlyList<string> Errors { get; } = errors;
}

public sealed record ContentBundle(
    IReadOnlyList<TrackContent> Tracks,
    IReadOnlyList<QuizContent> Quizzes,
    IReadOnlyList<ProblemContent> Problems,
    string Hash);

public sealed record TrackContent(
    string Slug,
    string Title,
    string Description,
    string Icon,
    string Accent,
    int Order,
    IReadOnlyList<ModuleContent> Modules);

public sealed record ModuleContent(
    string Slug,
    string Title,
    string Description,
    int Order,
    IReadOnlyList<LessonContent> Lessons);

public sealed record LessonContent(
    string Slug,
    string Title,
    string Summary,
    int Minutes,
    ContentLevel Level,
    int Order,
    string Markdown);

public sealed record QuizContent(
    string Slug,
    string TrackSlug,
    string Title,
    string Description,
    ContentLevel Level,
    int? TimeLimitMinutes,
    int Order,
    IReadOnlyList<QuestionContent> Questions);

public sealed record QuestionContent(
    string Text,
    string Explanation,
    Difficulty Difficulty,
    IReadOnlyList<OptionContent> Options)
{
    public bool IsMultiple => Options.Count(option => option.IsCorrect) > 1;
}

public sealed record OptionContent(string Text, bool IsCorrect);

public sealed record ProblemContent(
    string Slug,
    int Number,
    string Title,
    Difficulty Difficulty,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> Languages,
    ProblemSpec Spec,
    string Statement,
    IReadOnlyList<string> Hints,
    string? Editorial,
    IReadOnlyDictionary<string, string> Solutions,
    IReadOnlyList<StoredTest> Tests);
