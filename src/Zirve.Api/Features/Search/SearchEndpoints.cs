using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zirve.Api.Data;
using Zirve.Api.Data.Entities;

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
            query = query[..MaxQueryLength];
        }

        // Tam metin araması kelime köklerini eşleştirir; başlıkta kısmi eşleşme ("asyn" -> "async") için ILIKE eklenir.
        var pattern = $"%{EscapeLike(query)}%";
        const string Config = AppDbContext.SearchConfig;

        var lessons = await db.Lessons
            .AsNoTracking()
            .Where(lesson => lesson.SearchVector.Matches(EF.Functions.WebSearchToTsQuery(Config, query))
                             || EF.Functions.ILike(lesson.Title, pattern, "\\"))
            .OrderByDescending(lesson => EF.Functions.ILike(lesson.Title, pattern, "\\"))
            .ThenByDescending(lesson => lesson.SearchVector.Rank(EF.Functions.WebSearchToTsQuery(Config, query)))
            .Take(MaxResults)
            .Select(lesson => new LessonHit(lesson.Track.Slug, lesson.Track.Title, lesson.Slug, lesson.Title, lesson.Summary))
            .ToListAsync(cancellationToken);

        var problems = await db.Problems
            .AsNoTracking()
            .Where(problem => problem.SearchVector.Matches(EF.Functions.WebSearchToTsQuery(Config, query))
                              || EF.Functions.ILike(problem.Title, pattern, "\\"))
            .OrderByDescending(problem => EF.Functions.ILike(problem.Title, pattern, "\\"))
            .ThenByDescending(problem => problem.SearchVector.Rank(EF.Functions.WebSearchToTsQuery(Config, query)))
            .Take(MaxResults)
            .Select(problem => new ProblemHit(problem.Slug, problem.Number, problem.Title, problem.Difficulty))
            .ToListAsync(cancellationToken);

        var quizzes = await db.Quizzes
            .AsNoTracking()
            .Where(quiz => EF.Functions.ILike(quiz.Title, pattern, "\\") || EF.Functions.ILike(quiz.Description, pattern, "\\"))
            .OrderBy(quiz => quiz.Track.Order)
            .ThenBy(quiz => quiz.Order)
            .Take(MaxResults)
            .Select(quiz => new QuizHit(quiz.Slug, quiz.Title, quiz.Track.Title))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(new SearchResponse(lessons, problems, quizzes));
    }

    private static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("%", "\\%", StringComparison.Ordinal)
            .Replace("_", "\\_", StringComparison.Ordinal);
}
