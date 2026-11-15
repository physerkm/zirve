using System.Net;
using System.Text.Json;

namespace Zirve.Tests.Api;

public sealed class ApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string ProblemSlug = "iki-sayinin-toplami";

    // ------------------------------------------------------------ kimlik ve CSRF

    [Fact]
    public async Task Session_starts_anonymous_and_issues_a_csrf_token()
    {
        var api = await factory.CreateSessionAsync();
        var session = await api.RefreshAsync();

        Assert.False(session.TryGetProperty("user", out _));
        Assert.NotEmpty(session.GetProperty("csrfToken").GetString()!);
    }

    [Fact]
    public async Task Unsafe_requests_without_a_csrf_token_are_rejected()
    {
        var api = await factory.CreateSessionAsync();

        using var response = await api.SendAsync(HttpMethod.Post, "/api/auth/logout", withCsrf: false);
        var problem = await ApiSession.ReadAsync(response);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("csrf_invalid", problem.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Register_login_and_logout_round_trip()
    {
        var api = await factory.CreateSessionAsync();
        var email = $"flow-{Guid.NewGuid():N}@example.com";

        var registered = await api.RegisterAsync(email, "Ada Lovelace");
        Assert.Equal("Ada Lovelace", registered.GetProperty("user").GetProperty("displayName").GetString());

        var loggedOut = await api.PostAsync("/api/auth/logout");
        Assert.False(loggedOut.TryGetProperty("user", out _));
        await api.RefreshAsync();

        using var wrong = await api.SendAsync(HttpMethod.Post, "/api/auth/login", new { email, password = "yanlış parola" });
        Assert.Equal(HttpStatusCode.Unauthorized, wrong.StatusCode);

        using var unknown = await api.SendAsync(HttpMethod.Post, "/api/auth/login", new { email = "yok@example.com", password = "yanlış parola" });
        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);

        var loggedIn = await api.PostAsync("/api/auth/login", new { email, password = "doğru at pil zımba" });
        Assert.Equal(email, loggedIn.GetProperty("user").GetProperty("email").GetString());
    }

    [Fact]
    public async Task Register_rejects_invalid_input_and_duplicate_email()
    {
        var api = await factory.CreateSessionAsync();

        using var invalid = await api.SendAsync(HttpMethod.Post, "/api/auth/register", new { email = "geçersiz", password = "kısa", displayName = "A" });
        var problem = await ApiSession.ReadAsync(invalid);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        Assert.Equal(3, problem.GetProperty("errors").EnumerateObject().Count());

        var email = $"dup-{Guid.NewGuid():N}@example.com";
        await api.RegisterAsync(email);

        var other = await factory.CreateSessionAsync();
        using var duplicate = await other.SendAsync(HttpMethod.Post, "/api/auth/register", new { email, password = "doğru at pil zımba", displayName = "İkinci" });
        var duplicateProblem = await ApiSession.ReadAsync(duplicate);

        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);
        Assert.True(duplicateProblem.GetProperty("errors").TryGetProperty("Email", out _));
    }

    // ------------------------------------------------------------ katalog ve ilerleme

    [Fact]
    public async Task Catalog_exposes_tracks_modules_and_lesson_content()
    {
        var api = await factory.CreateSessionAsync();

        var tracks = await api.GetAsync("/api/tracks");
        var first = tracks.EnumerateArray().First();
        var trackSlug = first.GetProperty("slug").GetString();
        Assert.True(first.GetProperty("lessonCount").GetInt32() > 0);

        var track = await api.GetAsync($"/api/tracks/{trackSlug}");
        var lesson = track.GetProperty("modules").EnumerateArray().First().GetProperty("lessons").EnumerateArray().First();
        Assert.False(lesson.TryGetProperty("content", out _));

        var detail = await api.GetAsync($"/api/tracks/{trackSlug}/lessons/{lesson.GetProperty("slug").GetString()}");
        Assert.True(detail.GetProperty("content").GetString()!.Length > 200);
        Assert.Equal(1, detail.GetProperty("position").GetInt32());

        using var missing = await api.GetRawAsync("/api/tracks/olmayan-yol");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Fact]
    public async Task Lesson_progress_requires_authentication_and_can_be_toggled()
    {
        var api = await factory.CreateSessionAsync();
        var tracks = await api.GetAsync("/api/tracks");
        var trackSlug = tracks.EnumerateArray().First().GetProperty("slug").GetString();
        var track = await api.GetAsync($"/api/tracks/{trackSlug}");
        var lessonSlug = track.GetProperty("modules")[0].GetProperty("lessons")[0].GetProperty("slug").GetString();
        var path = $"/api/tracks/{trackSlug}/lessons/{lessonSlug}";

        using var anonymous = await api.SendAsync(HttpMethod.Put, $"{path}/progress", new { completed = true });
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);

        await api.RegisterAsync();

        using var completed = await api.SendAsync(HttpMethod.Put, $"{path}/progress", new { completed = true });
        using var repeated = await api.SendAsync(HttpMethod.Put, $"{path}/progress", new { completed = true });
        Assert.Equal(HttpStatusCode.NoContent, completed.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, repeated.StatusCode);
        Assert.True((await api.GetAsync(path)).GetProperty("completed").GetBoolean());

        var dashboard = await api.GetAsync("/api/me/dashboard");
        Assert.Equal(1, dashboard.GetProperty("lessons").GetProperty("completed").GetInt32());
        Assert.Equal(1, dashboard.GetProperty("streakDays").GetInt32());

        using var undone = await api.SendAsync(HttpMethod.Put, $"{path}/progress", new { completed = false });
        Assert.Equal(HttpStatusCode.NoContent, undone.StatusCode);
        Assert.False((await api.GetAsync(path)).GetProperty("completed").GetBoolean());
    }

    // ------------------------------------------------------------ testler (quiz)

    [Fact]
    public async Task Quiz_never_leaks_answers_and_is_graded_on_the_server()
    {
        var api = await factory.CreateSessionAsync();
        var slug = (await api.GetAsync("/api/quizzes")).EnumerateArray().First().GetProperty("slug").GetString();

        var quiz = await api.GetAsync($"/api/quizzes/{slug}");
        var raw = quiz.GetRawText();
        Assert.DoesNotContain("isCorrect", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("explanation", raw, StringComparison.OrdinalIgnoreCase);

        // Boş yanıtla gönder: sunucu doğru şıkları ve açıklamaları döndürür.
        var blank = await api.PostAsync($"/api/quizzes/{slug}/attempts", new { answers = new Dictionary<string, int[]>(), durationSeconds = 5 });
        Assert.Equal(0, blank.GetProperty("correctCount").GetInt32());
        Assert.False(blank.GetProperty("saved").GetBoolean());

        // Dönen doğru şıklarla yeniden gönder: tam puan.
        var answers = blank.GetProperty("questions").EnumerateArray().ToDictionary(
            question => question.GetProperty("id").GetInt32().ToString(System.Globalization.CultureInfo.InvariantCulture),
            question => question.GetProperty("correctOptionIds").EnumerateArray().Select(id => id.GetInt32()).ToArray());

        await api.RegisterAsync();
        var perfect = await api.PostAsync($"/api/quizzes/{slug}/attempts", new { answers, durationSeconds = 30 });

        Assert.Equal(100, perfect.GetProperty("scorePercent").GetInt32());
        Assert.True(perfect.GetProperty("saved").GetBoolean());

        var listed = (await api.GetAsync("/api/quizzes")).EnumerateArray().First(q => q.GetProperty("slug").GetString() == slug);
        Assert.Equal(100, listed.GetProperty("bestScore").GetInt32());
    }

    // ------------------------------------------------------------ problemler

    [Fact]
    public async Task Problem_detail_contains_starters_and_only_sample_tests()
    {
        var api = await factory.CreateSessionAsync();
        var problem = await api.GetAsync($"/api/problems/{ProblemSlug}");

        Assert.Contains("TwoSum", problem.GetProperty("starterCode").GetProperty("csharp").GetString());
        Assert.Contains("function twoSum", problem.GetProperty("starterCode").GetProperty("typescript").GetString());
        Assert.True(problem.GetProperty("sampleTests").GetArrayLength() < problem.GetProperty("testCount").GetInt32());
        Assert.False(problem.TryGetProperty("status", out _));
    }

    [Fact]
    public async Task Running_code_requires_authentication()
    {
        var api = await factory.CreateSessionAsync();

        using var response = await api.SendAsync(HttpMethod.Post, $"/api/problems/{ProblemSlug}/run", new { language = "csharp", code = "x" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Submitting_the_reference_solution_is_accepted_and_recorded()
    {
        var api = await factory.CreateSessionAsync();
        await api.RegisterAsync();

        var editorial = await api.GetAsync($"/api/problems/{ProblemSlug}/editorial");
        var solution = editorial.GetProperty("solutions").GetProperty("csharp").GetString();

        var run = await api.PostAsync($"/api/problems/{ProblemSlug}/run", new { language = "csharp", code = solution });
        Assert.Equal("accepted", run.GetProperty("verdict").GetString());
        Assert.False(run.TryGetProperty("submissionId", out _));

        var submit = await api.PostAsync($"/api/problems/{ProblemSlug}/submit", new { language = "csharp", code = solution });
        Assert.Equal("accepted", submit.GetProperty("verdict").GetString());
        Assert.Equal(submit.GetProperty("totalCount").GetInt32(), submit.GetProperty("passedCount").GetInt32());

        var wrong = await api.PostAsync(
            $"/api/problems/{ProblemSlug}/submit",
            new { language = "javascript", code = "function twoSum(nums, target) { return [0, 1]; }" });
        Assert.Equal("wrongAnswer", wrong.GetProperty("verdict").GetString());

        var broken = await api.PostAsync($"/api/problems/{ProblemSlug}/submit", new { language = "typescript", code = "function twoSum(: {" });
        Assert.Equal("compileError", broken.GetProperty("verdict").GetString());

        var submissions = await api.GetAsync($"/api/problems/{ProblemSlug}/submissions");
        Assert.Equal(3, submissions.GetArrayLength());

        var problem = await api.GetAsync($"/api/problems/{ProblemSlug}");
        Assert.Equal("solved", problem.GetProperty("status").GetString());

        var dashboard = await api.GetAsync("/api/me/dashboard");
        Assert.Equal(1, dashboard.GetProperty("problems").GetProperty("solved").GetInt32());
    }

    [Fact]
    public async Task Submissions_are_private_to_their_owner()
    {
        var owner = await factory.CreateSessionAsync();
        await owner.RegisterAsync();
        var submitted = await owner.PostAsync(
            $"/api/problems/{ProblemSlug}/submit",
            new { language = "javascript", code = "function twoSum(nums, target) { return []; }" });
        var id = submitted.GetProperty("submissionId").GetString();

        Assert.Equal(JsonValueKind.String, (await owner.GetAsync($"/api/submissions/{id}")).GetProperty("code").ValueKind);

        var stranger = await factory.CreateSessionAsync();
        await stranger.RegisterAsync();
        using var response = await stranger.GetRawAsync($"/api/submissions/{id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(0, (await stranger.GetAsync($"/api/problems/{ProblemSlug}/submissions")).GetArrayLength());
    }

    [Fact]
    public async Task Unsupported_language_is_a_validation_error()
    {
        var api = await factory.CreateSessionAsync();
        await api.RegisterAsync();

        using var response = await api.SendAsync(HttpMethod.Post, $"/api/problems/{ProblemSlug}/submit", new { language = "python", code = "print(1)" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ------------------------------------------------------------ deneme alanı ve arama

    [Fact]
    public async Task Playground_runs_code_and_returns_output()
    {
        var api = await factory.CreateSessionAsync();
        await api.RegisterAsync();

        var result = await api.PostAsync(
            "/api/playground/run",
            new { language = "csharp", code = "Console.WriteLine($\"toplam: {Enumerable.Range(1, 4).Sum()} ğüşiöç\");" });

        Assert.Equal("completed", result.GetProperty("status").GetString());
        Assert.Contains("toplam: 10 ğüşiöç", result.GetProperty("stdout").GetString());
    }

    [Fact]
    public async Task Search_finds_content_and_ignores_too_short_queries()
    {
        var api = await factory.CreateSessionAsync();

        var hits = await api.GetAsync("/api/search?q=toplam");
        Assert.Contains(hits.GetProperty("problems").EnumerateArray(), hit => hit.GetProperty("slug").GetString() == ProblemSlug);

        var empty = await api.GetAsync("/api/search?q=a");
        Assert.Equal(0, empty.GetProperty("lessons").GetArrayLength());

        // LIKE joker karakterleri ve tsquery sözdizimi hataya yol açmamalı.
        var hostile = await api.GetAsync("/api/search?q=" + Uri.EscapeDataString("%_'\"\\ & | ! ( :*"));
        Assert.Equal(JsonValueKind.Array, hostile.GetProperty("lessons").ValueKind);
    }

    [Fact]
    public async Task Health_endpoints_respond()
    {
        var api = await factory.CreateSessionAsync();

        using var live = await api.GetRawAsync("/health/live");
        using var ready = await api.GetRawAsync("/health/ready");

        Assert.Equal(HttpStatusCode.OK, live.StatusCode);
        Assert.Equal(HttpStatusCode.OK, ready.StatusCode);
    }
}
