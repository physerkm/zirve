using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zirve.Api.Data;
using Zirve.Api.Data.Entities;
using Zirve.Api.Infrastructure;

namespace Zirve.Api.Features.Search;

public sealed record LessonHit(string TrackSlug, string TrackTitle, string Slug, string Title, string Summary);

public sealed record ProblemHit(string Slug, int Number, string Title, Difficulty Difficulty);

public sealed record QuizHit(string Slug, string Title, string TrackTitle);

public sealed record SearchResponse(IReadOnlyList<LessonHit> Lessons, IReadOnlyList<ProblemHit> Problems, IReadOnlyList<QuizHit> Quizzes);

public static class SearchEndpoints
{
    private const int MaxResults = 8;
    private const int MaxQueryLength = 100;

    public static RouteGroupBuilder MapSearchEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/search", SearchAsync)
            .WithTags("Arama")
            .WithSummary("Derslerde, problemlerde ve testlerde arama yapar.");

        return api;
    }

    private static async Task<Ok<SearchResponse>> SearchAsync(string? q, AppDbContext db, CancellationToken cancellationToken)
    {
        var query = (q ?? string.Empty).Trim();
        if (query.Length < 2)
        {
            return TypedResults.Ok(new SearchResponse([], [], []));
        }

        if (query.Length > MaxQueryLength)
        {
            query = query[..(char.IsHighSurrogate(query[MaxQueryLength - 1]) ? MaxQueryLength - 1 : MaxQueryLength)];
        }

        // Tam metin araması kelime köklerini eşleştirir; başlıkta kısmi eşleşme ("asyn" -> "async") için ILIKE eklenir.
        var pattern = $"%{EscapeLike(query)}%";

        // İngilizce sitede İngilizce metinler ve İngilizce kök bulma kullanılır. Diller ayrı sorgularla yazıldı:
        // arama vektörü sorgu içinde bir koşula bağlanırsa PostgreSQL GIN dizinini kullanamaz.
        return TypedResults.Ok(Localization.IsEnglish
            ? new SearchResponse(
                await SearchLessonsEnglishAsync(db, query, pattern, cancellationToken),
                await SearchProblemsEnglishAsync(db, query, pattern, cancellationToken),
                await SearchQuizzesAsync(db, pattern, english: true, cancellationToken))
            : new SearchResponse(
                await SearchLessonsAsync(db, query, pattern, cancellationToken),
                await SearchProblemsAsync(db, query, pattern, cancellationToken),
                await SearchQuizzesAsync(db, pattern, english: false, cancellationToken)));
    }

    private const string Config = AppDbContext.SearchConfig;
    private const string ConfigEn = AppDbContext.SearchConfigEn;

    private static Task<List<LessonHit>> SearchLessonsAsync(AppDbContext db, string query, string pattern, CancellationToken cancellationToken) =>
        db.Lessons
            .AsNoTracking()
            .Where(lesson => lesson.SearchVector.Matches(EF.Functions.WebSearchToTsQuery(Config, query))
                             || EF.Functions.ILike(lesson.Title, pattern, "\\"))
            .OrderByDescending(lesson => EF.Functions.ILike(lesson.Title, pattern, "\\"))
            .ThenByDescending(lesson => lesson.SearchVector.Rank(EF.Functions.WebSearchToTsQuery(Config, query)))
            .Take(MaxResults)
            .Select(lesson => new LessonHit(lesson.Track.Slug, lesson.Track.Title, lesson.Slug, lesson.Title, lesson.Summary))
            .ToListAsync(cancellationToken);

    private static Task<List<LessonHit>> SearchLessonsEnglishAsync(AppDbContext db, string query, string pattern, CancellationToken cancellationToken) =>
        db.Lessons
            .AsNoTracking()
            .Where(lesson => lesson.SearchVectorEn.Matches(EF.Functions.WebSearchToTsQuery(ConfigEn, query))
                             || EF.Functions.ILike(lesson.TitleEn, pattern, "\\"))
            .OrderByDescending(lesson => EF.Functions.ILike(lesson.TitleEn, pattern, "\\"))
            .ThenByDescending(lesson => lesson.SearchVectorEn.Rank(EF.Functions.WebSearchToTsQuery(ConfigEn, query)))
            .Take(MaxResults)
            .Select(lesson => new LessonHit(lesson.Track.Slug, lesson.Track.TitleEn, lesson.Slug, lesson.TitleEn, lesson.SummaryEn))
            .ToListAsync(cancellationToken);

    private static Task<List<ProblemHit>> SearchProblemsAsync(AppDbContext db, string query, string pattern, CancellationToken cancellationToken) =>
        db.Problems
            .AsNoTracking()
            .Where(problem => problem.SearchVector.Matches(EF.Functions.WebSearchToTsQuery(Config, query))
                              || EF.Functions.ILike(problem.Title, pattern, "\\"))
            .OrderByDescending(problem => EF.Functions.ILike(problem.Title, pattern, "\\"))
            .ThenByDescending(problem => problem.SearchVector.Rank(EF.Functions.WebSearchToTsQuery(Config, query)))
            .Take(MaxResults)
            .Select(problem => new ProblemHit(problem.Slug, problem.Number, problem.Title, problem.Difficulty))
            .ToListAsync(cancellationToken);

    private static Task<List<ProblemHit>> SearchProblemsEnglishAsync(AppDbContext db, string query, string pattern, CancellationToken cancellationToken) =>
        db.Problems
            .AsNoTracking()
            .Where(problem => problem.SearchVectorEn.Matches(EF.Functions.WebSearchToTsQuery(ConfigEn, query))
                              || EF.Functions.ILike(problem.TitleEn, pattern, "\\"))
            .OrderByDescending(problem => EF.Functions.ILike(problem.TitleEn, pattern, "\\"))
            .ThenByDescending(problem => problem.SearchVectorEn.Rank(EF.Functions.WebSearchToTsQuery(ConfigEn, query)))
            .Take(MaxResults)
            .Select(problem => new ProblemHit(problem.Slug, problem.Number, problem.TitleEn, problem.Difficulty))
            .ToListAsync(cancellationToken);

    // Testlerde tam metin dizini yok; dil yalnızca hangi sütunun okunduğunu değiştirir.
    private static Task<List<QuizHit>> SearchQuizzesAsync(AppDbContext db, string pattern, bool english, CancellationToken cancellationToken) =>
        db.Quizzes
            .AsNoTracking()
            .Where(quiz => english
                ? EF.Functions.ILike(quiz.TitleEn, pattern, "\\") || EF.Functions.ILike(quiz.DescriptionEn, pattern, "\\")
                : EF.Functions.ILike(quiz.Title, pattern, "\\") || EF.Functions.ILike(quiz.Description, pattern, "\\"))
            .OrderBy(quiz => quiz.Track.Order)
            .ThenBy(quiz => quiz.Order)
            .Take(MaxResults)
            .Select(quiz => new QuizHit(quiz.Slug, english ? quiz.TitleEn : quiz.Title, english ? quiz.Track.TitleEn : quiz.Track.Title))
            .ToListAsync(cancellationToken);

    private static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("%", "\\%", StringComparison.Ordinal)
            .Replace("_", "\\_", StringComparison.Ordinal);
}
