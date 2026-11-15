using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zirve.Api.Data;
using Zirve.Api.Data.Entities;
using Zirve.Api.Features.Catalog;
using Zirve.Api.Infrastructure;

namespace Zirve.Api.Features.Quizzes;

public sealed record QuizSummary(
    string Slug,
    string Title,
    string Description,
    ContentLevel Level,
    int QuestionCount,
    int? TimeLimitMinutes,
    LessonLink Track,
    int? BestScore,
    int Attempts);

public sealed record QuizDetail(
    string Slug,
    string Title,
    string Description,
    ContentLevel Level,
    int? TimeLimitMinutes,
    LessonLink Track,
    IReadOnlyList<QuizQuestion> Questions);

/// <summary>Doğru şık bilgisi bilerek yoktur; yanıtlar sunucuda değerlendirilir.</summary>
public sealed record QuizQuestion(int Id, string Text, bool IsMultiple, Difficulty Difficulty, IReadOnlyList<QuizOption> Options);

public sealed record QuizOption(int Id, string Text);

public sealed class QuizAttemptRequest
{
    /// <summary>Soru kimliği -> seçilen şık kimlikleri.</summary>
    [Required]
    public Dictionary<int, List<int>> Answers { get; set; } = [];

    [Range(0, 24 * 60 * 60, ErrorMessage = "Süre geçersiz.")]
    public int DurationSeconds { get; set; }
}

public sealed record QuizAttemptResult(
    int CorrectCount,
    int TotalCount,
    int ScorePercent,
    bool Saved,
    IReadOnlyList<QuestionResult> Questions);

public sealed record QuestionResult(
    int Id,
    bool Correct,
    IReadOnlyList<int> CorrectOptionIds,
    IReadOnlyList<int> SelectedOptionIds,
    string Explanation);

public static class QuizEndpoints
{
    public static RouteGroupBuilder MapQuizEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/quizzes").WithTags("Testler");

        group.MapGet("/", ListAsync).WithSummary("Bütün testleri listeler.");
        group.MapGet("/{slug}", GetAsync).WithSummary("Bir testin sorularını (yanıtlar olmadan) döndürür.");
        group.MapPost("/{slug}/attempts", SubmitAsync).WithSummary("Yanıtları değerlendirir; oturum açıksa sonucu kaydeder.");

        return api;
    }

    private static async Task<Ok<List<QuizSummary>>> ListAsync(AppDbContext db, HttpContext http, CancellationToken cancellationToken)
    {
        var quizzes = await db.Quizzes
            .AsNoTracking()
            .OrderBy(quiz => quiz.Track.Order)
            .ThenBy(quiz => quiz.Order)
            .Select(quiz => new
            {
                quiz.Id,
                quiz.Slug,
                quiz.Title,
                quiz.Description,
                quiz.Level,
                quiz.TimeLimitMinutes,
                QuestionCount = quiz.Questions.Count,
                TrackSlug = quiz.Track.Slug,
                TrackTitle = quiz.Track.Title,
            })
            .ToListAsync(cancellationToken);

        var userId = http.User.GetUserId();
        var stats = userId is null
            ? []
            : await db.QuizAttempts
                .Where(attempt => attempt.UserId == userId && attempt.TotalCount > 0)
                .GroupBy(attempt => attempt.QuizId)
                .Select(group => new
                {
                    QuizId = group.Key,
                    Attempts = group.Count(),
                    Best = group.Max(attempt => attempt.CorrectCount * 100 / attempt.TotalCount),
                })
                .ToDictionaryAsync(item => item.QuizId, cancellationToken);

        return TypedResults.Ok(quizzes
            .Select(quiz =>
            {
                var stat = stats.GetValueOrDefault(quiz.Id);
                return new QuizSummary(
                    quiz.Slug, quiz.Title, quiz.Description, quiz.Level, quiz.QuestionCount, quiz.TimeLimitMinutes,
                    new LessonLink(quiz.TrackSlug, quiz.TrackTitle), stat?.Best, stat?.Attempts ?? 0);
            })
            .ToList());
    }

    private static async Task<Results<Ok<QuizDetail>, NotFound>> GetAsync(string slug, AppDbContext db, CancellationToken cancellationToken)
    {
        var quiz = await db.Quizzes
            .AsNoTracking()
            .AsSplitQuery()
            .Where(q => q.Slug == slug)
            .Select(q => new QuizDetail(
                q.Slug,
                q.Title,
                q.Description,
                q.Level,
                q.TimeLimitMinutes,
                new LessonLink(q.Track.Slug, q.Track.Title),
                q.Questions
                    .OrderBy(question => question.Order)
                    .Select(question => new QuizQuestion(
                        question.Id,
                        question.Text,
                        question.IsMultiple,
                        question.Difficulty,
                        question.Options.OrderBy(option => option.Order).Select(option => new QuizOption(option.Id, option.Text)).ToList()))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        return quiz is null ? TypedResults.NotFound() : TypedResults.Ok(quiz);
    }

    private static async Task<Results<Ok<QuizAttemptResult>, NotFound>> SubmitAsync(
        string slug,
        QuizAttemptRequest request,
        AppDbContext db,
        TimeProvider timeProvider,
        HttpContext http,
        CancellationToken cancellationToken)
    {
        var quiz = await db.Quizzes
            .AsNoTracking()
            .AsSplitQuery()
            .Include(q => q.Questions.OrderBy(question => question.Order))
            .ThenInclude(question => question.Options.OrderBy(option => option.Order))
            .FirstOrDefaultAsync(q => q.Slug == slug, cancellationToken);

        if (quiz is null)
        {
            return TypedResults.NotFound();
        }

        var results = quiz.Questions.Select(question => Grade(question, request.Answers.GetValueOrDefault(question.Id))).ToList();
        var correctCount = results.Count(result => result.Correct);
        var saved = false;

        if (http.User.GetUserId() is { } userId)
        {
            db.QuizAttempts.Add(new QuizAttempt
            {
                UserId = userId,
                QuizId = quiz.Id,
                CorrectCount = correctCount,
                TotalCount = results.Count,
                DurationSeconds = request.DurationSeconds,
                CreatedAt = timeProvider.GetUtcNow(),
            });

            await db.SaveChangesAsync(cancellationToken);
            saved = true;
        }

        var score = results.Count == 0 ? 0 : (int)Math.Round(correctCount * 100.0 / results.Count);
        return TypedResults.Ok(new QuizAttemptResult(correctCount, results.Count, score, saved, results));
    }

    /// <summary>Bir soru ancak seçilen şıklar doğru şıklarla birebir aynıysa doğru sayılır.</summary>
    internal static QuestionResult Grade(Question question, List<int>? selected)
    {
        var validIds = question.Options.Select(option => option.Id).ToHashSet();
        var correctIds = question.Options.Where(option => option.IsCorrect).Select(option => option.Id).ToList();
        var selectedIds = (selected ?? []).Where(validIds.Contains).Distinct().Order().ToList();
        var isCorrect = selectedIds.Count == correctIds.Count && selectedIds.All(correctIds.Contains);

        return new QuestionResult(question.Id, isCorrect, correctIds, selectedIds, question.Explanation);
    }
}
