using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Zirve.Api.Data;
using Zirve.Api.Data.Entities;
using Zirve.Shared;

namespace Zirve.Api.Content;

/// <summary>
/// Dosyalardaki içeriği veritabanına eşitler. Kayıtlar slug üzerinden eşleştirilir; böylece içerik
/// güncellense bile kimlikler (ve onlara bağlı kullanıcı ilerlemesi) korunur. Dosyalardan silinen
/// içerik veritabanından da silinir. İngilizce alanlar çeviriden yazılır; çevirisi olmayan içerikte
/// Türkçe metin kullanılır, böylece sorgular her zaman dolu bir alan okur.
/// </summary>
public sealed class ContentSynchronizer(AppDbContext db, TimeProvider timeProvider, ILogger<ContentSynchronizer> logger)
{
    private const string StateKey = "content";

    public async Task<bool> SyncAsync(ContentBundle bundle, CancellationToken cancellationToken)
    {
        var state = await db.ContentStates.FindAsync([StateKey], cancellationToken);
        if (state?.Hash == bundle.Hash)
        {
            logger.LogInformation("İçerik güncel; eşitleme atlandı.");
            return false;
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        var tracks = await SyncTracksAsync(bundle, cancellationToken);
        await SyncQuizzesAsync(bundle, tracks, cancellationToken);
        await SyncProblemsAsync(bundle, cancellationToken);

        if (state is null)
        {
            db.ContentStates.Add(new ContentState { Key = StateKey, Hash = bundle.Hash, SyncedAt = timeProvider.GetUtcNow() });
        }
        else
        {
            state.Hash = bundle.Hash;
            state.SyncedAt = timeProvider.GetUtcNow();
        }

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        logger.LogInformation(
            "İçerik eşitlendi: {Tracks} yol, {Lessons} ders, {Quizzes} test, {Questions} soru, {Problems} problem.",
            bundle.Tracks.Count,
            bundle.Tracks.Sum(track => track.Modules.Sum(module => module.Lessons.Count)),
            bundle.Quizzes.Count,
            bundle.Quizzes.Sum(quiz => quiz.Questions.Count),
            bundle.Problems.Count);

        return true;
    }

    private async Task<Dictionary<string, Track>> SyncTracksAsync(ContentBundle bundle, CancellationToken cancellationToken)
    {
        var existing = await db.Tracks
            .Include(track => track.Modules)
            .ThenInclude(module => module.Lessons)
            .AsSplitQuery()
            .ToDictionaryAsync(track => track.Slug, StringComparer.Ordinal, cancellationToken);

        foreach (var removed in existing.Values.Where(track => bundle.Tracks.All(content => content.Slug != track.Slug)).ToList())
        {
            db.Tracks.Remove(removed);
            existing.Remove(removed.Slug);
        }

        foreach (var content in bundle.Tracks)
        {
            if (!existing.TryGetValue(content.Slug, out var track))
            {
                track = new Track { Slug = content.Slug, Title = content.Title };
                db.Tracks.Add(track);
                existing[content.Slug] = track;
            }

            track.Title = content.Title;
            track.Description = content.Description;
            track.TitleEn = content.English?.Title ?? content.Title;
            track.DescriptionEn = content.English?.Description ?? content.Description;
            track.Icon = content.Icon;
            track.Accent = content.Accent;
            track.Order = content.Order;

            // Dersler yol içinde slug ile eşleşir; bir ders başka bölüme taşınsa da kimliği değişmez.
            var lessonsBySlug = track.Modules.SelectMany(module => module.Lessons).ToDictionary(lesson => lesson.Slug, StringComparer.Ordinal);
            var keptLessons = new HashSet<string>(StringComparer.Ordinal);

            foreach (var moduleContent in content.Modules)
            {
                var module = track.Modules.FirstOrDefault(m => m.Slug == moduleContent.Slug);
                if (module is null)
                {
                    module = new Module { Slug = moduleContent.Slug, Title = moduleContent.Title };
                    track.Modules.Add(module);
                }

                module.Title = moduleContent.Title;
                module.Description = moduleContent.Description;
                module.TitleEn = moduleContent.English?.Title ?? moduleContent.Title;
                module.DescriptionEn = moduleContent.English?.Description ?? moduleContent.Description;
                module.Order = moduleContent.Order;

                foreach (var lessonContent in moduleContent.Lessons)
                {
                    keptLessons.Add(lessonContent.Slug);

                    if (!lessonsBySlug.TryGetValue(lessonContent.Slug, out var lesson))
                    {
                        lesson = new Lesson { Slug = lessonContent.Slug, Title = lessonContent.Title, Content = lessonContent.Markdown };
                        db.Lessons.Add(lesson);
                    }

                    lesson.Module = module;
                    lesson.Track = track;
                    lesson.Title = lessonContent.Title;
                    lesson.Summary = lessonContent.Summary;
                    lesson.Content = lessonContent.Markdown;
                    lesson.TitleEn = lessonContent.English?.Title ?? lessonContent.Title;
                    lesson.SummaryEn = lessonContent.English?.Summary ?? lessonContent.Summary;
                    lesson.ContentEn = lessonContent.English?.Markdown ?? lessonContent.Markdown;
                    lesson.Minutes = lessonContent.Minutes;
                    lesson.Level = lessonContent.Level;
                    lesson.Order = lessonContent.Order;
                }
            }

            foreach (var removedLesson in lessonsBySlug.Values.Where(lesson => !keptLessons.Contains(lesson.Slug)))
            {
                db.Lessons.Remove(removedLesson);
            }

            // Dersler yeni bölümlerine bağlandıktan SONRA artık kullanılmayan bölümleri sil;
            // böylece başka bölüme taşınan dersler basamaklı silmeye yakalanmaz.
            db.ChangeTracker.DetectChanges();

            foreach (var removedModule in track.Modules.Where(module => content.Modules.All(m => m.Slug != module.Slug)).ToList())
            {
                db.Modules.Remove(removedModule);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return existing;
    }

    private async Task SyncQuizzesAsync(ContentBundle bundle, Dictionary<string, Track> tracks, CancellationToken cancellationToken)
    {
        var existing = await db.Quizzes.ToDictionaryAsync(quiz => quiz.Slug, StringComparer.Ordinal, cancellationToken);

        foreach (var removed in existing.Values.Where(quiz => bundle.Quizzes.All(content => content.Slug != quiz.Slug)).ToList())
        {
            db.Quizzes.Remove(removed);
        }

        foreach (var content in bundle.Quizzes)
        {
            if (!existing.TryGetValue(content.Slug, out var quiz))
            {
                quiz = new Quiz { Slug = content.Slug, Title = content.Title };
                db.Quizzes.Add(quiz);
            }

            quiz.Track = tracks[content.TrackSlug];
            quiz.Title = content.Title;
            quiz.Description = content.Description;
            quiz.TitleEn = content.English?.Title ?? content.Title;
            quiz.DescriptionEn = content.English?.Description ?? content.Description;
            quiz.Level = content.Level;
            quiz.TimeLimitMinutes = content.TimeLimitMinutes;
            quiz.Order = content.Order;

            var hash = Hash(JsonSerializer.Serialize(content.Questions, ZirveJson.Options));
            if (quiz.ContentHash == hash)
            {
                continue;
            }

            // Sorular değişti: eskilerini sil, yenilerini yaz.
            if (quiz.Id != 0)
            {
                await db.Questions.Where(question => question.QuizId == quiz.Id).ExecuteDeleteAsync(cancellationToken);
            }

            quiz.ContentHash = hash;
            quiz.Questions =
            [
                .. content.Questions.Select((question, index) => new Question
                {
                    Order = index + 1,
                    Text = question.Text,
                    Explanation = question.Explanation,
                    TextEn = question.English?.Text ?? question.Text,
                    ExplanationEn = question.English?.Explanation ?? question.Explanation,
                    Difficulty = question.Difficulty,
                    IsMultiple = question.IsMultiple,
                    Options = [.. question.Options.Select((option, optionIndex) => new QuestionOption
                    {
                        Order = optionIndex + 1,
                        Text = option.Text,
                        TextEn = question.English?.Options[optionIndex] ?? option.Text,
                        IsCorrect = option.IsCorrect,
                    })],
                }),
            ];
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task SyncProblemsAsync(ContentBundle bundle, CancellationToken cancellationToken)
    {
        var existing = await db.Problems.ToDictionaryAsync(problem => problem.Slug, StringComparer.Ordinal, cancellationToken);

        foreach (var removed in existing.Values.Where(problem => bundle.Problems.All(content => content.Slug != problem.Slug)).ToList())
        {
            db.Problems.Remove(removed);
        }

        foreach (var content in bundle.Problems)
        {
            var specJson = JsonSerializer.Serialize(content.Spec, ZirveJson.Options);
            var testsJson = JsonSerializer.Serialize(content.Tests, ZirveJson.Options);

            if (!existing.TryGetValue(content.Slug, out var problem))
            {
                problem = new Problem
                {
                    Slug = content.Slug,
                    Title = content.Title,
                    Statement = content.Statement,
                    SpecJson = specJson,
                    TestsJson = testsJson,
                };
                db.Problems.Add(problem);
            }

            problem.Number = content.Number;
            problem.Title = content.Title;
            problem.Difficulty = content.Difficulty;
            problem.Statement = content.Statement;
            problem.Hints = [.. content.Hints];
            problem.Tags = [.. content.Tags];
            problem.Languages = [.. content.Languages];
            problem.SpecJson = specJson;
            problem.TestsJson = testsJson;
            problem.Editorial = content.Editorial;
            problem.SolutionsJson = JsonSerializer.Serialize(content.Solutions, ZirveJson.Options);

            var english = content.English;
            problem.TitleEn = english?.Title ?? content.Title;
            problem.StatementEn = english?.Statement ?? content.Statement;
            problem.HintsEn = [.. english?.Hints ?? content.Hints];
            problem.EditorialEn = english is null ? content.Editorial : english.Editorial;
            problem.SolutionsJsonEn = JsonSerializer.Serialize(
                content.Solutions.ToDictionary(pair => pair.Key, pair => english?.Solutions.GetValueOrDefault(pair.Key) ?? pair.Value),
                ZirveJson.Options);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static string Hash(string text) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(text)));
}
