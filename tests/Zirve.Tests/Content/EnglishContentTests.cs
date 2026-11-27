using System.Text.RegularExpressions;
using Zirve.Api.Content;

namespace Zirve.Tests.Content;

/// <summary>
/// content/en/ altındaki İngilizce çevirileri doğrular: her içeriğin çevirisi vardır ve çeviriler Türkçe
/// içerikle yapısal olarak eşleşir. Çeviri dosyaları yalnızca metin taşıdığı için asıl güvence, çevrilmiş
/// referans çözümlerin yorumlar dışında Türkçe çözümlerle birebir aynı kalmasıdır.
/// </summary>
public sealed partial class EnglishContentTests
{
    private static readonly Lazy<ContentBundle> Bundle = new(() =>
        ContentLoader.Load(ContentLoader.ResolveRoot(configuredPath: null, AppContext.BaseDirectory)));

    [Fact]
    public void Every_track_module_and_lesson_has_an_english_translation()
    {
        var missing = Bundle.Value.Tracks
            .SelectMany(track => new[] { (track.Slug, track.English is not null) }
                .Concat(track.Modules.Select(module => ($"{track.Slug}/{module.Slug}", module.English is not null)))
                .Concat(track.Modules.SelectMany(module => module.Lessons
                    .Select(lesson => ($"{track.Slug}/{module.Slug}/{lesson.Slug}", lesson.English is not null)))))
            .Where(item => !item.Item2)
            .Select(item => item.Item1)
            .ToList();

        Assert.True(missing.Count == 0, "İngilizce çevirisi olmayan içerik: " + string.Join(", ", missing));
    }

    [Fact]
    public void Every_quiz_and_question_has_an_english_translation()
    {
        Assert.All(Bundle.Value.Quizzes, quiz =>
        {
            Assert.True(quiz.English is not null, $"{quiz.Slug}: İngilizce çevirisi yok.");
            Assert.All(quiz.Questions, question =>
            {
                Assert.NotNull(question.English);
                Assert.Equal(question.Options.Count, question.English.Options.Count);
            });
        });
    }

    [Fact]
    public void Every_problem_has_an_english_translation_with_the_same_shape()
    {
        Assert.All(Bundle.Value.Problems, problem =>
        {
            Assert.True(problem.English is not null, $"{problem.Slug}: İngilizce çevirisi yok.");
            Assert.Equal(problem.Hints.Count, problem.English.Hints.Count);
            Assert.Equal(problem.Editorial is null, problem.English.Editorial is null);
            Assert.Equal(problem.Solutions.Keys.Order(), problem.English.Solutions.Keys.Order());
        });
    }

    [Fact]
    public void Translated_reference_solutions_differ_from_the_originals_only_in_comments()
    {
        var changed = Bundle.Value.Problems
            .Where(problem => problem.English is not null)
            .SelectMany(problem => problem.Solutions.Select(pair => (problem.Slug, Language: pair.Key, Original: pair.Value,
                Translated: problem.English!.Solutions.GetValueOrDefault(pair.Key) ?? pair.Value)))
            .Where(item => StripComments(item.Original) != StripComments(item.Translated))
            .Select(item => $"{item.Slug} ({item.Language})")
            .ToList();

        Assert.True(changed.Count == 0, "Çeviride kodu değişen çözümler: " + string.Join(", ", changed));
    }

    [Fact]
    public void English_problem_parser_reports_structural_mismatches()
    {
        var problem = Bundle.Value.Problems.First(p => p.Hints.Count > 0 && p.Editorial is not null);

        const string translation = """
            ---
            title: Broken
            ---
            Statement.

            ## Hints

            - Only one hint.
            """;

        var errors = new List<string>();
        ContentLoader.ParseProblemText(translation, problem, "en/problems/x.md", errors);

        if (problem.Hints.Count != 1)
        {
            Assert.Contains(errors, error => error.Contains("Hints", StringComparison.Ordinal));
        }

        Assert.Contains(errors, error => error.Contains("Solution", StringComparison.Ordinal));
    }

    /// <summary>Satır ve blok yorumlarını, sonra boşlukları atar; geriye yalnızca kodun kendisi kalır.</summary>
    private static string StripComments(string code)
    {
        var withoutBlocks = BlockComment().Replace(code, string.Empty);
        var withoutLines = LineComment().Replace(withoutBlocks, string.Empty);
        return Whitespace().Replace(withoutLines, string.Empty);
    }

    [GeneratedRegex(@"/\*.*?\*/", RegexOptions.Singleline)]
    private static partial Regex BlockComment();

    // "//" bir dizgi içinde de geçebilir (ör. adres); iki tarafta da aynı biçimde silindiği için karşılaştırma bozulmaz.
    [GeneratedRegex(@"//[^\n]*")]
    private static partial Regex LineComment();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();
}
