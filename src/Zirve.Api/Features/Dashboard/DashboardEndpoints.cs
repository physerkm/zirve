using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zirve.Api.Data;
using Zirve.Api.Data.Entities;
using Zirve.Api.Infrastructure;

namespace Zirve.Api.Features.Dashboard;

public sealed record ProgressCount(int Completed, int Total);

public sealed record ProblemStats(int Solved, int Total, ProgressCount Easy, ProgressCount Medium, ProgressCount Hard);

public sealed record QuizStats(int Attempts, int? AverageScore, int DistinctQuizzes, int TotalQuizzes);

public sealed record TrackProgress(string Slug, string Title, string Icon, string Accent, int Completed, int Total);

public sealed record RecentSubmission(Guid Id, string ProblemSlug, string ProblemTitle, string Language, Verdict Verdict, DateTimeOffset CreatedAt);

public sealed record ContinueLesson(string TrackSlug, string TrackTitle, string LessonSlug, string LessonTitle);

public sealed record ActivityDay(DateOnly Date, int Count);

public sealed record DashboardResponse(
    ProgressCount Lessons,
    ProblemStats Problems,
    QuizStats Quizzes,
    int StreakDays,
    IReadOnlyList<TrackProgress> Tracks,
    IReadOnlyList<RecentSubmission> RecentSubmissions,
    ContinueLesson? Continue,
    IReadOnlyList<ActivityDay> Activity);

public static class DashboardEndpoints
{
    private const int ActivityDays = 112; // 16 hafta
    private const int StreakLookbackDays = 366;

    public static RouteGroupBuilder MapDashboardEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/me/dashboard", GetAsync)
            .RequireAuthorization()
            .WithTags("Panel")
            .WithSummary("Kullanıcının ilerleme özetini döndürür.");

        return api;
    }

    private static async Task<Ok<DashboardResponse>> GetAsync(
        AppDbContext db, TimeProvider timeProvider, HttpContext http, CancellationToken cancellationToken)
    {
        var userId = http.User.RequireUserId();
        var en = Localization.IsEnglish;
        var now = timeProvider.GetUtcNow();
        var since = now.AddDays(-StreakLookbackDays);

        // ---------------------------------------------------------- dersler
        var tracks = await db.Tracks
            .AsNoTracking()
            .OrderBy(track => track.Order)
            .Select(track => new
            {
                track.Id,
                track.Slug,
                Title = en ? track.TitleEn : track.Title,
                track.Icon,
                track.Accent,
                Total = db.Lessons.Count(lesson => lesson.TrackId == track.Id),
            })
            .ToListAsync(cancellationToken);

        var completedLessons = await db.LessonProgress
            .AsNoTracking()
            .Where(progress => progress.UserId == userId)
            .Select(progress => new { progress.LessonId, progress.Lesson.TrackId, progress.CompletedAt })
            .ToListAsync(cancellationToken);

        var completedByTrack = completedLessons.GroupBy(item => item.TrackId).ToDictionary(group => group.Key, group => group.Count());

        // ---------------------------------------------------------- problemler
        var problems = await db.Problems
            .AsNoTracking()
            .Select(problem => new { problem.Id, problem.Difficulty })
            .ToListAsync(cancellationToken);

        var solvedIds = (await db.Submissions
            .Where(submission => submission.UserId == userId && submission.Verdict == Verdict.Accepted)
            .Select(submission => submission.ProblemId)
            .Distinct()
            .ToListAsync(cancellationToken)).ToHashSet();

        ProgressCount CountFor(Difficulty difficulty) => new(
            problems.Count(problem => problem.Difficulty == difficulty && solvedIds.Contains(problem.Id)),
            problems.Count(problem => problem.Difficulty == difficulty));

        // ---------------------------------------------------------- testler
        var attempts = await db.QuizAttempts
            .AsNoTracking()
            .Where(attempt => attempt.UserId == userId)
            .Select(attempt => new { attempt.QuizId, attempt.CorrectCount, attempt.TotalCount, attempt.CreatedAt })
            .ToListAsync(cancellationToken);

        var scored = attempts.Where(attempt => attempt.TotalCount > 0).ToList();
        var totalQuizzes = await db.Quizzes.CountAsync(cancellationToken);

        // ---------------------------------------------------------- son gönderimler
        var recentSubmissions = await db.Submissions
            .AsNoTracking()
            .Where(submission => submission.UserId == userId)
            .OrderByDescending(submission => submission.CreatedAt)
            .Take(8)
            .Select(submission => new RecentSubmission(
                submission.Id,
                submission.Problem.Slug,
                en ? submission.Problem.TitleEn : submission.Problem.Title,
                submission.Language,
                submission.Verdict,
                submission.CreatedAt))
            .ToListAsync(cancellationToken);

        var submissionTimes = await db.Submissions
            .Where(submission => submission.UserId == userId && submission.CreatedAt >= since)
            .Select(submission => submission.CreatedAt)
            .ToListAsync(cancellationToken);

        // ---------------------------------------------------------- etkinlik ve seri
        var activityByDay = completedLessons.Select(item => item.CompletedAt)
            .Concat(attempts.Select(attempt => attempt.CreatedAt))
            .Concat(submissionTimes)
            .Where(timestamp => timestamp >= since)
            .GroupBy(timestamp => DateOnly.FromDateTime(timestamp.UtcDateTime))
            .ToDictionary(group => group.Key, group => group.Count());

        var today = DateOnly.FromDateTime(now.UtcDateTime);

        var activity = Enumerable.Range(0, ActivityDays)
            .Select(offset => today.AddDays(offset - ActivityDays + 1))
            .Select(day => new ActivityDay(day, activityByDay.GetValueOrDefault(day)))
            .ToList();

        return TypedResults.Ok(new DashboardResponse(
            new ProgressCount(completedLessons.Count, tracks.Sum(track => track.Total)),
            new ProblemStats(solvedIds.Count, problems.Count, CountFor(Difficulty.Easy), CountFor(Difficulty.Medium), CountFor(Difficulty.Hard)),
            new QuizStats(
                attempts.Count,
                scored.Count == 0 ? null : (int)Math.Round(scored.Average(attempt => attempt.CorrectCount * 100.0 / attempt.TotalCount), MidpointRounding.AwayFromZero),
                attempts.Select(attempt => attempt.QuizId).Distinct().Count(),
                totalQuizzes),
            ComputeStreak(activityByDay.Keys, today),
            [.. tracks.Select(track => new TrackProgress(
                track.Slug, track.Title, track.Icon, track.Accent, completedByTrack.GetValueOrDefault(track.Id), track.Total))],
            recentSubmissions,
            await FindContinueLessonAsync(db, completedLessons.OrderByDescending(item => item.CompletedAt).Select(item => (int?)item.TrackId).FirstOrDefault(),
                [.. completedLessons.Select(item => item.LessonId)], cancellationToken),
            activity));
    }

    /// <summary>Bugün ya da dün biten, kesintisiz etkin gün sayısı.</summary>
    internal static int ComputeStreak(IEnumerable<DateOnly> activeDays, DateOnly today)
    {
        var days = activeDays.ToHashSet();
        var cursor = days.Contains(today) ? today : today.AddDays(-1);
        var streak = 0;

        while (days.Contains(cursor))
        {
            streak++;
            cursor = cursor.AddDays(-1);
        }

        return streak;
    }

    /// <summary>En son çalışılan yoldaki ilk tamamlanmamış dersi bulur.</summary>
    private static async Task<ContinueLesson?> FindContinueLessonAsync(
        AppDbContext db, int? trackId, HashSet<int> completedLessonIds, CancellationToken cancellationToken)
    {
        if (trackId is null)
        {
            return null;
        }

        var outline = await db.Lessons
            .AsNoTracking()
            .Where(lesson => lesson.TrackId == trackId)
            .OrderBy(lesson => lesson.Module.Order)
            .ThenBy(lesson => lesson.Order)
            .Select(lesson => new
            {
                lesson.Id,
                lesson.Slug,
                Title = Localization.IsEnglish ? lesson.TitleEn : lesson.Title,
                TrackSlug = lesson.Track.Slug,
                TrackTitle = Localization.IsEnglish ? lesson.Track.TitleEn : lesson.Track.Title,
            })
            .ToListAsync(cancellationToken);

        var next = outline.FirstOrDefault(lesson => !completedLessonIds.Contains(lesson.Id));
        return next is null ? null : new ContinueLesson(next.TrackSlug, next.TrackTitle, next.Slug, next.Title);
    }
}
