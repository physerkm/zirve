using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zirve.Api.Data;
using Zirve.Api.Data.Entities;
using Zirve.Api.Features.Catalog;
using Zirve.Api.Infrastructure;
using Zirve.Shared;
using Zirve.Shared.Execution;
using Zirve.Shared.Problems;

namespace Zirve.Api.Features.Problems;

public static class ProblemStatuses
{
    public const string Solved = "solved";
    public const string Attempted = "attempted";
}

public sealed record ProblemListItem(
    string Slug,
    int Number,
    string Title,
    Difficulty Difficulty,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> Languages,
    string? Status);

public sealed record SampleTest(int Id, JsonElement Args, IReadOnlyList<string>? Ops, JsonElement Expected);

public sealed record ProblemDetail(
    string Slug,
    int Number,
    string Title,
    Difficulty Difficulty,
    IReadOnlyList<string> Tags,
    string Statement,
    IReadOnlyList<string> Hints,
    IReadOnlyList<string> Languages,
    ProblemSpec Spec,
    IReadOnlyDictionary<string, string> StarterCode,
    IReadOnlyList<SampleTest> SampleTests,
    int TestCount,
    bool HasEditorial,
    string? Status,
    LessonLink? Previous,
    LessonLink? Next);

public sealed record EditorialResponse(string Editorial, IReadOnlyDictionary<string, string> Solutions);

public sealed class CodeRequest
{
    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.LanguageRequired))]
    [StringLength(20)]
    public string Language { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.CodeRequired))]
    [StringLength(50_000, ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.CodeTooLong))]
    public string Code { get; set; } = string.Empty;
}

public sealed record JudgeResponse(
    Verdict Verdict,
    string? Message,
    IReadOnlyList<CompileDiagnostic> Diagnostics,
    IReadOnlyList<JudgedTest> Tests,
    int PassedCount,
    int TotalCount,
    double DurationMs,
    Guid? SubmissionId);

public sealed record SubmissionSummary(
    Guid Id,
    string Language,
    Verdict Verdict,
    int PassedCount,
    int TotalCount,
    double DurationMs,
    DateTimeOffset CreatedAt);

public sealed record SubmissionDetail(
    Guid Id,
    string ProblemSlug,
    string ProblemTitle,
    string Language,
    string Code,
    Verdict Verdict,
    int PassedCount,
    int TotalCount,
    double DurationMs,
    DateTimeOffset CreatedAt);

public static class ProblemEndpoints
{
    public static RouteGroupBuilder MapProblemEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/problems").WithTags("Problemler");

        group.MapGet("/", ListAsync).WithSummary("Bütün problemleri (kullanıcının durumuyla birlikte) listeler.");
        group.MapGet("/{slug}", GetAsync).WithSummary("Problem tanımını, başlangıç kodlarını ve örnek testleri döndürür.");
        group.MapGet("/{slug}/editorial", GetEditorialAsync).WithSummary("Çözüm anlatımını ve referans çözümleri döndürür.");

        group.MapPost("/{slug}/run", RunAsync)
            .RequireAuthorization()
            .RequireRateLimiting(RateLimitPolicies.Execute)
            .WithSummary("Kodu örnek testlerle çalıştırır (kaydedilmez).");

        group.MapPost("/{slug}/submit", SubmitAsync)
            .RequireAuthorization()
            .RequireRateLimiting(RateLimitPolicies.Execute)
            .WithSummary("Kodu bütün testlerle değerlendirir ve gönderimi kaydeder.");

        group.MapGet("/{slug}/submissions", ListSubmissionsAsync)
            .RequireAuthorization()
            .WithSummary("Kullanıcının bu probleme yaptığı son gönderimler.");

        api.MapGet("/submissions/{id:guid}", GetSubmissionAsync)
            .RequireAuthorization()
            .WithTags("Problemler")
            .WithSummary("Bir gönderimin kodunu ve sonucunu döndürür.");

        return api;
    }

    private static async Task<Ok<List<ProblemListItem>>> ListAsync(AppDbContext db, HttpContext http, CancellationToken cancellationToken)
    {
        var en = Localization.IsEnglish;

        var problems = await db.Problems
            .AsNoTracking()
            .OrderBy(problem => problem.Number)
            .Select(problem => new
            {
                problem.Id,
                problem.Slug,
                problem.Number,
                Title = en ? problem.TitleEn : problem.Title,
                problem.Difficulty,
                problem.Tags,
                problem.Languages,
            })
            .ToListAsync(cancellationToken);

        var statuses = await LoadStatusesAsync(db, http.User.GetUserId(), problemId: null, cancellationToken);

        return TypedResults.Ok(problems
            .Select(problem => new ProblemListItem(
                problem.Slug, problem.Number, problem.Title, problem.Difficulty, problem.Tags, problem.Languages,
                statuses.GetValueOrDefault(problem.Id)))
            .ToList());
    }

    private static async Task<Results<Ok<ProblemDetail>, NotFound>> GetAsync(
        string slug, AppDbContext db, HttpContext http, CancellationToken cancellationToken)
    {
        var problem = await db.Problems.AsNoTracking().FirstOrDefaultAsync(p => p.Slug == slug, cancellationToken);
        if (problem is null)
        {
            return TypedResults.NotFound();
        }

        var spec = JsonSerializer.Deserialize<ProblemSpec>(problem.SpecJson, ZirveJson.Options)!;
        var tests = JsonSerializer.Deserialize<List<StoredTest>>(problem.TestsJson, ZirveJson.Options) ?? [];

        var samples = tests
            .Select((test, index) => (test, index))
            .Where(item => item.test.Sample)
            .Select(item => new SampleTest(item.index, item.test.Args, item.test.Ops, item.test.Expected))
            .ToList();

        var en = Localization.IsEnglish;
        var starters = problem.Languages.ToDictionary(
            language => language, language => StarterCodeGenerator.Generate(spec, language, Localization.LanguageCode));
        var statuses = await LoadStatusesAsync(db, http.User.GetUserId(), problem.Id, cancellationToken);

        var previous = await db.Problems
            .AsNoTracking()
            .Where(p => p.Number < problem.Number)
            .OrderByDescending(p => p.Number)
            .Select(p => new LessonLink(p.Slug, en ? p.TitleEn : p.Title))
            .FirstOrDefaultAsync(cancellationToken);

        var next = await db.Problems
            .AsNoTracking()
            .Where(p => p.Number > problem.Number)
            .OrderBy(p => p.Number)
            .Select(p => new LessonLink(p.Slug, en ? p.TitleEn : p.Title))
            .FirstOrDefaultAsync(cancellationToken);

        return TypedResults.Ok(new ProblemDetail(
            problem.Slug, problem.Number, en ? problem.TitleEn : problem.Title, problem.Difficulty, problem.Tags,
            en ? problem.StatementEn : problem.Statement, en ? problem.HintsEn : problem.Hints,
            problem.Languages, spec, starters, samples, tests.Count, !string.IsNullOrEmpty(problem.Editorial),
            statuses.GetValueOrDefault(problem.Id), previous, next));
    }

    private static async Task<Results<Ok<EditorialResponse>, NotFound>> GetEditorialAsync(
        string slug, AppDbContext db, CancellationToken cancellationToken)
    {
        var en = Localization.IsEnglish;

        var problem = await db.Problems
            .AsNoTracking()
            .Where(p => p.Slug == slug)
            .Select(p => new { Editorial = en ? p.EditorialEn : p.Editorial, SolutionsJson = en ? p.SolutionsJsonEn : p.SolutionsJson })
            .FirstOrDefaultAsync(cancellationToken);

        if (problem is null || string.IsNullOrEmpty(problem.Editorial))
        {
            return TypedResults.NotFound();
        }

        var solutions = JsonSerializer.Deserialize<Dictionary<string, string>>(problem.SolutionsJson, ZirveJson.Options) ?? [];
        return TypedResults.Ok(new EditorialResponse(problem.Editorial, solutions));
    }

    private static Task<Results<Ok<JudgeResponse>, NotFound, ValidationProblem>> RunAsync(
        string slug, CodeRequest request, AppDbContext db, ProblemJudge judge, TimeProvider timeProvider, HttpContext http, CancellationToken cancellationToken) =>
        JudgeAsync(slug, request, save: false, db, judge, timeProvider, http, cancellationToken);

    private static Task<Results<Ok<JudgeResponse>, NotFound, ValidationProblem>> SubmitAsync(
        string slug, CodeRequest request, AppDbContext db, ProblemJudge judge, TimeProvider timeProvider, HttpContext http, CancellationToken cancellationToken) =>
        JudgeAsync(slug, request, save: true, db, judge, timeProvider, http, cancellationToken);

    private static async Task<Results<Ok<JudgeResponse>, NotFound, ValidationProblem>> JudgeAsync(
        string slug,
        CodeRequest request,
        bool save,
        AppDbContext db,
        ProblemJudge judge,
        TimeProvider timeProvider,
        HttpContext http,
        CancellationToken cancellationToken)
    {
        var problem = await db.Problems.AsNoTracking().FirstOrDefaultAsync(p => p.Slug == slug, cancellationToken);
        if (problem is null)
        {
            return TypedResults.NotFound();
        }

        if (!problem.Languages.Contains(request.Language))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(CodeRequest.Language)] =
                [
                    Localization.Text(
                        $"Bu problem '{request.Language}' dilini desteklemiyor.",
                        $"This problem doesn't support the '{request.Language}' language."),
                ],
            });
        }

        var result = await judge.JudgeAsync(problem, request.Language, request.Code, sampleOnly: !save, cancellationToken);
        Guid? submissionId = null;

        // Altyapı kaynaklı hatalar kullanıcının gönderim geçmişini kirletmesin.
        if (save && result.Verdict != Verdict.InternalError)
        {
            var submission = new Submission
            {
                UserId = http.User.RequireUserId(),
                ProblemId = problem.Id,
                Language = request.Language,
                Code = request.Code,
                Verdict = result.Verdict,
                PassedCount = result.PassedCount,
                TotalCount = result.TotalCount,
                DurationMs = result.DurationMs,
                CreatedAt = timeProvider.GetUtcNow(),
            };

            db.Submissions.Add(submission);
            await db.SaveChangesAsync(cancellationToken);
            submissionId = submission.Id;
        }

        return TypedResults.Ok(new JudgeResponse(
            result.Verdict, result.Message, result.Diagnostics, result.Tests,
            result.PassedCount, result.TotalCount, result.DurationMs, submissionId));
    }

    private static async Task<Results<Ok<List<SubmissionSummary>>, NotFound>> ListSubmissionsAsync(
        string slug, AppDbContext db, HttpContext http, CancellationToken cancellationToken)
    {
        var userId = http.User.RequireUserId();

        if (!await db.Problems.AnyAsync(problem => problem.Slug == slug, cancellationToken))
        {
            return TypedResults.NotFound();
        }

        var submissions = await db.Submissions
            .AsNoTracking()
            .Where(submission => submission.UserId == userId && submission.Problem.Slug == slug)
            .OrderByDescending(submission => submission.CreatedAt)
            .Take(30)
            .Select(submission => new SubmissionSummary(
                submission.Id, submission.Language, submission.Verdict, submission.PassedCount,
                submission.TotalCount, submission.DurationMs, submission.CreatedAt))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(submissions);
    }

    private static async Task<Results<Ok<SubmissionDetail>, NotFound>> GetSubmissionAsync(
        Guid id, AppDbContext db, HttpContext http, CancellationToken cancellationToken)
    {
        var userId = http.User.RequireUserId();
        var en = Localization.IsEnglish;

        // Başkasının gönderimi "bulunamadı" olarak yanıtlanır; varlığı bile sızdırılmaz.
        var submission = await db.Submissions
            .AsNoTracking()
            .Where(s => s.Id == id && s.UserId == userId)
            .Select(s => new SubmissionDetail(
                s.Id, s.Problem.Slug, en ? s.Problem.TitleEn : s.Problem.Title, s.Language, s.Code, s.Verdict,
                s.PassedCount, s.TotalCount, s.DurationMs, s.CreatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        return submission is null ? TypedResults.NotFound() : TypedResults.Ok(submission);
    }

    private static async Task<Dictionary<int, string>> LoadStatusesAsync(
        AppDbContext db, Guid? userId, int? problemId, CancellationToken cancellationToken)
    {
        if (userId is null)
        {
            return [];
        }

        var rows = await db.Submissions
            .Where(submission => submission.UserId == userId && (problemId == null || submission.ProblemId == problemId))
            .GroupBy(submission => submission.ProblemId)
            .Select(group => new { ProblemId = group.Key, Solved = group.Any(submission => submission.Verdict == Verdict.Accepted) })
            .ToListAsync(cancellationToken);

        return rows.ToDictionary(row => row.ProblemId, row => row.Solved ? ProblemStatuses.Solved : ProblemStatuses.Attempted);
    }
}
