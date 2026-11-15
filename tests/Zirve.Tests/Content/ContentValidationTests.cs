using System.Text.Json;
using Zirve.Api.Content;
using Zirve.Shared.Execution;
using Zirve.Shared.Problems;
using Zirve.Tests.Runner;

namespace Zirve.Tests.Content;

/// <summary>
/// Depodaki gerçek içeriği doğrular. En önemli güvence: her problemin referans çözümü, gerçek koşucuda
/// problemin BÜTÜN testlerini geçmek zorundadır. Böylece hatalı test verisi ya da bozuk çözüm yayına çıkamaz.
/// </summary>
public sealed class ContentValidationTests(RunnerFixture runner) : IClassFixture<RunnerFixture>
{
    private static readonly Lazy<ContentBundle> Bundle = new(() =>
        ContentLoader.Load(ContentLoader.ResolveRoot(configuredPath: null, AppContext.BaseDirectory)));

    public static TheoryData<string, string> ProblemSolutions()
    {
        var data = new TheoryData<string, string>();

        foreach (var problem in Bundle.Value.Problems)
        {
            foreach (var language in problem.Solutions.Keys.Order())
            {
                data.Add(problem.Slug, language);
            }
        }

        return data;
    }

    [Fact]
    public void Content_loads_without_errors_and_is_not_empty()
    {
        var bundle = Bundle.Value;

        Assert.NotEmpty(bundle.Tracks);
        Assert.NotEmpty(bundle.Quizzes);
        Assert.NotEmpty(bundle.Problems);
        Assert.Equal(64, bundle.Hash.Length);
    }

    [Fact]
    public void Published_tracks_and_modules_always_have_lessons()
    {
        // Dersi henüz yazılmamış bölümler ve yollar yükleyici tarafından yayımlanmaz.
        Assert.All(Bundle.Value.Tracks, track =>
        {
            Assert.NotEmpty(track.Modules);
            Assert.All(track.Modules, module => Assert.NotEmpty(module.Lessons));
        });
    }

    [Fact]
    public void Every_quiz_belongs_to_a_published_track()
    {
        var tracks = Bundle.Value.Tracks.Select(track => track.Slug).ToHashSet();

        Assert.All(Bundle.Value.Quizzes, quiz => Assert.Contains(quiz.TrackSlug, tracks));
    }

    [Fact]
    public void Starter_code_is_generated_for_every_problem_and_language()
    {
        foreach (var problem in Bundle.Value.Problems)
        {
            foreach (var language in problem.Languages)
            {
                var starter = StarterCodeGenerator.Generate(problem.Spec, language);
                Assert.Contains(problem.Spec.Kind == ProblemKinds.Class ? problem.Spec.Name : problem.Spec.Name[1..], starter);
            }
        }
    }

    [Theory]
    [MemberData(nameof(ProblemSolutions))]
    public async Task Reference_solution_passes_every_test(string slug, string language)
    {
        var problem = Bundle.Value.Problems.Single(p => p.Slug == slug);

        var result = await runner.Service.ExecuteAsync(
            new ExecutionRequest
            {
                Language = language,
                Mode = ExecutionMode.Tests,
                Code = problem.Solutions[language],
                Spec = problem.Spec,
                Tests = [.. problem.Tests.Select((test, index) => new TestCaseInput
                {
                    Id = index,
                    Args = test.Args,
                    Ops = test.Ops,
                    Expected = test.Expected,
                })],
            },
            TestContext.Current.CancellationToken);

        var failures = result.Tests
            .Where(test => test.Status != TestStatus.Passed)
            .Select(test => $"test {test.Id + 1}: {test.Status} | girdi={problem.Tests[test.Id].Args.GetRawText()} "
                            + $"| beklenen={problem.Tests[test.Id].Expected.GetRawText()} "
                            + $"| gerçek={(test.Actual is { } actual ? actual.GetRawText() : "-")} | hata={test.Error}")
            .ToList();

        Assert.True(
            result.Status == ExecutionStatus.Completed && failures.Count == 0,
            $"{slug} ({language}) -> {result.Status} {result.Message}\n"
            + string.Join("\n", result.Diagnostics.Select(d => $"satır {d.Line}: {d.Message}"))
            + string.Join("\n", failures));

        Assert.Equal(problem.Tests.Count, result.Tests.Count);
    }

    [Fact]
    public void Quiz_questions_have_a_correct_option_and_an_explanation()
    {
        foreach (var quiz in Bundle.Value.Quizzes)
        {
            foreach (var question in quiz.Questions)
            {
                Assert.Contains(question.Options, option => option.IsCorrect);
                Assert.Contains(question.Options, option => !option.IsCorrect);
                Assert.False(string.IsNullOrWhiteSpace(question.Explanation), $"{quiz.Slug}: açıklaması olmayan soru var.");
            }
        }
    }

    [Fact]
    public void Problem_parser_reports_all_problems_in_a_broken_file()
    {
        const string broken = """
            ---
            title: Bozuk
            difficulty: imkansiz
            tags: [dizi]
            function: solve
            params:
              - { name: nums, type: "int[]" }
            returns: "matris"
            ---
            Tanım.

            ## Testler

            ```json
            [ { "args": [[1], 2], "expected": 1 } ]
            ```
            """;

        var errors = new List<string>();
        var problem = ContentLoader.ParseProblem(broken, "bozuk", 1, "bozuk.md", errors);

        Assert.Null(problem);
        Assert.Contains(errors, error => error.Contains("difficulty", StringComparison.Ordinal));
        Assert.Contains(errors, error => error.Contains("matris", StringComparison.Ordinal));
        Assert.Contains(errors, error => error.Contains("solution", StringComparison.Ordinal));
    }

    [Fact]
    public void Stored_tests_round_trip_through_json()
    {
        var problem = Bundle.Value.Problems[0];
        var json = JsonSerializer.Serialize(problem.Tests, Zirve.Shared.ZirveJson.Options);
        var restored = JsonSerializer.Deserialize<List<Zirve.Api.Data.Entities.StoredTest>>(json, Zirve.Shared.ZirveJson.Options)!;

        Assert.Equal(problem.Tests.Count, restored.Count);
        Assert.True(Zirve.Runner.Execution.ResultComparer.AreEqual(problem.Tests[0].Args, restored[0].Args, CompareModes.Exact));
        Assert.Equal(problem.Tests[0].Sample, restored[0].Sample);
    }
}
