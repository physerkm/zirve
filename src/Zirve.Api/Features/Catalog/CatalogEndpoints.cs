using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zirve.Api.Data;
using Zirve.Api.Data.Entities;
using Zirve.Api.Infrastructure;

namespace Zirve.Api.Features.Catalog;

public sealed record TrackSummary(
    string Slug,
    string Title,
    string Description,
    string Icon,
    string Accent,
    int LessonCount,
    int TotalMinutes,
    int QuizCount,
    int CompletedLessons);

public sealed record TrackDetail(
    string Slug,
    string Title,
    string Description,
    string Icon,
    string Accent,
    IReadOnlyList<ModuleDetail> Modules,
    IReadOnlyList<TrackQuiz> Quizzes);

public sealed record ModuleDetail(string Slug, string Title, string Description, IReadOnlyList<LessonSummary> Lessons);

public sealed record LessonSummary(string Slug, string Title, string Summary, int Minutes, ContentLevel Level, bool Completed);

public sealed record TrackQuiz(
    string Slug,
    string Title,
    string Description,
    ContentLevel Level,
    int QuestionCount,
    int? TimeLimitMinutes,
    int? BestScore);

public sealed record LessonLink(string Slug, string Title);

public sealed record LessonDetail(
    string Slug,
    string Title,
    string Summary,
    int Minutes,
    ContentLevel Level,
    string Content,
    LessonLink Track,
    LessonLink Module,
    LessonLink? Previous,
    LessonLink? Next,
    int Position,
    int Total,
    bool Completed);

public sealed record LessonProgressRequest(bool Completed);

public static class CatalogEndpoints
{
    public static RouteGroupBuilder MapCatalogEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/tracks").WithTags("Öğrenme yolları");

        group.MapGet("/", ListTracksAsync).WithSummary("Bütün öğrenme yollarını listeler.");
        group.MapGet("/{trackSlug}", GetTrackAsync).WithSummary("Bir yolun bölümlerini, derslerini ve testlerini döndürür.");
        group.MapGet("/{trackSlug}/lessons/{lessonSlug}", GetLessonAsync).WithSummary("Bir dersin içeriğini döndürür.");
        group.MapPut("/{trackSlug}/lessons/{lessonSlug}/progress", SetLessonProgressAsync)
            .RequireAuthorization()
            .WithSummary("Dersi tamamlandı olarak işaretler ya da işareti kaldırır.");

        return api;
    }

    private static async Task<Ok<List<TrackSummary>>> ListTracksAsync(AppDbContext db, HttpContext http, CancellationToken cancellationToken)
    {
        var userId = http.User.GetUserId();
        var en = Localization.IsEnglish;

        var tracks = await db.Tracks
            .AsNoTracking()
            .OrderBy(track => track.Order)
            .Select(track => new
            {
                track.Id,
                track.Slug,
                Title = en ? track.TitleEn : track.Title,
                Description = en ? track.DescriptionEn : track.Description,
                track.Icon,
                track.Accent,
                LessonCount = db.Lessons.Count(lesson => lesson.TrackId == track.Id),
                TotalMinutes = db.Lessons.Where(lesson => lesson.TrackId == track.Id).Sum(lesson => lesson.Minutes),
                QuizCount = track.Quizzes.Count,
            })
            .ToListAsync(cancellationToken);

        var completed = userId is null
            ? []
            : await db.LessonProgress
                .Where(progress => progress.UserId == userId)
                .GroupBy(progress => progress.Lesson.TrackId)
                .Select(group => new { TrackId = group.Key, Count = group.Count() })
                .ToDictionaryAsync(item => item.TrackId, item => item.Count, cancellationToken);

        return TypedResults.Ok(tracks
            .Select(track => new TrackSummary(
                track.Slug, track.Title, track.Description, track.Icon, track.Accent,
                track.LessonCount, track.TotalMinutes, track.QuizCount, completed.GetValueOrDefault(track.Id)))
            .ToList());
    }

    private static async Task<Results<Ok<TrackDetail>, NotFound>> GetTrackAsync(
        string trackSlug, AppDbContext db, HttpContext http, CancellationToken cancellationToken)
    {
        var en = Localization.IsEnglish;

        var track = await db.Tracks
            .AsNoTracking()
            .Where(t => t.Slug == trackSlug)
            .Select(t => new { t.Id, t.Slug, Title = en ? t.TitleEn : t.Title, Description = en ? t.DescriptionEn : t.Description, t.Icon, t.Accent })
            .FirstOrDefaultAsync(cancellationToken);

        if (track is null)
        {
            return TypedResults.NotFound();
        }

        var userId = http.User.GetUserId();

        var modules = await db.Modules
            .AsNoTracking()
            .Where(module => module.TrackId == track.Id)
            .OrderBy(module => module.Order)
            .Select(module => new { module.Id, module.Slug, Title = en ? module.TitleEn : module.Title, Description = en ? module.DescriptionEn : module.Description })
            .ToListAsync(cancellationToken);

        // Ders içeriği (büyük Markdown metni) bilerek seçilmiyor.
        var lessons = await db.Lessons
            .AsNoTracking()
            .Where(lesson => lesson.TrackId == track.Id)
            .OrderBy(lesson => lesson.Order)
            .Select(lesson => new
            {
                lesson.Id,
                lesson.ModuleId,
                lesson.Slug,
                Title = en ? lesson.TitleEn : lesson.Title,
                Summary = en ? lesson.SummaryEn : lesson.Summary,
                lesson.Minutes,
                lesson.Level,
            })
            .ToListAsync(cancellationToken);

        var quizzes = await db.Quizzes
            .AsNoTracking()
            .Where(quiz => quiz.TrackId == track.Id)
            .OrderBy(quiz => quiz.Order)
            .Select(quiz => new
            {
                quiz.Id,
                quiz.Slug,
                Title = en ? quiz.TitleEn : quiz.Title,
                Description = en ? quiz.DescriptionEn : quiz.Description,
                quiz.Level,
                quiz.TimeLimitMinutes,
                QuestionCount = quiz.Questions.Count,
            })
            .ToListAsync(cancellationToken);

        var completedLessons = new HashSet<int>();
        var bestScores = new Dictionary<int, int>();

        if (userId is not null)
        {
            completedLessons = [.. await db.LessonProgress
                .Where(progress => progress.UserId == userId && progress.Lesson.TrackId == track.Id)
                .Select(progress => progress.LessonId)
                .ToListAsync(cancellationToken)];

            bestScores = await db.QuizAttempts
                .Where(attempt => attempt.UserId == userId && attempt.Quiz.TrackId == track.Id && attempt.TotalCount > 0)
                .GroupBy(attempt => attempt.QuizId)
                .Select(group => new { QuizId = group.Key, Best = group.Max(attempt => (attempt.CorrectCount * 200 + attempt.TotalCount) / (2 * attempt.TotalCount)) })
                .ToDictionaryAsync(item => item.QuizId, item => item.Best, cancellationToken);
        }

        var lessonsByModule = lessons.ToLookup(lesson => lesson.ModuleId);

        return TypedResults.Ok(new TrackDetail(
            track.Slug, track.Title, track.Description, track.Icon, track.Accent,
            [.. modules.Select(module => new ModuleDetail(
                module.Slug, module.Title, module.Description,
                [.. lessonsByModule[module.Id].Select(lesson => new LessonSummary(
                    lesson.Slug, lesson.Title, lesson.Summary, lesson.Minutes, lesson.Level, completedLessons.Contains(lesson.Id)))]))],
            [.. quizzes.Select(quiz => new TrackQuiz(
                quiz.Slug, quiz.Title, quiz.Description, quiz.Level, quiz.QuestionCount, quiz.TimeLimitMinutes,
                bestScores.TryGetValue(quiz.Id, out var best) ? best : null))]));
    }

    private static async Task<Results<Ok<LessonDetail>, NotFound>> GetLessonAsync(
        string trackSlug, string lessonSlug, AppDbContext db, HttpContext http, CancellationToken cancellationToken)
    {
        var en = Localization.IsEnglish;

        // Yolun okuma sırası: önce bölüm sırası, sonra ders sırası.
        var outline = await db.Lessons
            .AsNoTracking()
            .Where(lesson => lesson.Track.Slug == trackSlug)
            .OrderBy(lesson => lesson.Module.Order)
            .ThenBy(lesson => lesson.Order)
            .Select(lesson => new { lesson.Id, lesson.Slug, Title = en ? lesson.TitleEn : lesson.Title })
            .ToListAsync(cancellationToken);

        var index = outline.FindIndex(lesson => lesson.Slug == lessonSlug);
        if (index < 0)
        {
            return TypedResults.NotFound();
        }

        var lessonId = outline[index].Id;

        var lesson = await db.Lessons
            .AsNoTracking()
            .Where(l => l.Id == lessonId)
            .Select(l => new
            {
                l.Slug,
                Title = en ? l.TitleEn : l.Title,
                Summary = en ? l.SummaryEn : l.Summary,
                l.Minutes,
                l.Level,
                Content = en ? l.ContentEn : l.Content,
                Track = new LessonLink(l.Track.Slug, en ? l.Track.TitleEn : l.Track.Title),
                Module = new LessonLink(l.Module.Slug, en ? l.Module.TitleEn : l.Module.Title),
            })
            .FirstAsync(cancellationToken);

        var userId = http.User.GetUserId();
        var completed = userId is not null
            && await db.LessonProgress.AnyAsync(progress => progress.UserId == userId && progress.LessonId == lessonId, cancellationToken);

        return TypedResults.Ok(new LessonDetail(
            lesson.Slug, lesson.Title, lesson.Summary, lesson.Minutes, lesson.Level, lesson.Content,
            lesson.Track, lesson.Module,
            index > 0 ? new LessonLink(outline[index - 1].Slug, outline[index - 1].Title) : null,
            index < outline.Count - 1 ? new LessonLink(outline[index + 1].Slug, outline[index + 1].Title) : null,
            index + 1, outline.Count, completed));
    }

    private static async Task<Results<NoContent, NotFound>> SetLessonProgressAsync(
        string trackSlug,
        string lessonSlug,
        LessonProgressRequest request,
        AppDbContext db,
        TimeProvider timeProvider,
        HttpContext http,
        CancellationToken cancellationToken)
    {
        var userId = http.User.RequireUserId();

        var lessonId = await db.Lessons
            .Where(lesson => lesson.Track.Slug == trackSlug && lesson.Slug == lessonSlug)
            .Select(lesson => (int?)lesson.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (lessonId is null)
        {
            return TypedResults.NotFound();
        }

        var existing = await db.LessonProgress.FindAsync([userId, lessonId.Value], cancellationToken);

        if (request.Completed && existing is null)
        {
            db.LessonProgress.Add(new LessonProgress { UserId = userId, LessonId = lessonId.Value, CompletedAt = timeProvider.GetUtcNow() });

            try
            {
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                // Aynı anda gelen iki istek: kayıt zaten oluşmuş, sonuç aynı.
            }
        }
        else if (!request.Completed && existing is not null)
        {
            db.LessonProgress.Remove(existing);
            await db.SaveChangesAsync(cancellationToken);
        }

        return TypedResults.NoContent();
    }
}
