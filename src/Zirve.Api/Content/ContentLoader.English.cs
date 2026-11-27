namespace Zirve.Api.Content;

/// <summary>
/// <c>content/en/</c> klasöründeki İngilizce çevirileri okur ve Türkçe içerikle eşleştirir.
/// <code>
/// content/en/
///   tracks.yaml                          yolların ve bölümlerin İngilizce başlık/açıklamaları (slug ile eşleşir)
///   lessons/{yol}/{bölüm}/NN-slug.md      title, summary + Markdown
///   quizzes/{yol}/NN-slug.yaml            title, description, questions: [{ q, options, why }]
///   problems/NNN-slug.md                  title + tanım + "## Hints" + "## Solution"
/// </code>
/// Dosya yolları Türkçe dosyalarla birebir aynıdır. Çeviri dosyaları yalnızca metin taşır: sıra, düzey, süre,
/// doğru şıklar, problem imzası ve testler her zaman Türkçe dosyadan gelir. Çevirisi olmayan içerik İngilizce
/// sitede Türkçe gösterilir; karşılığı olmayan ya da yapısı tutmayan bir çeviri dosyası ise hatadır.
/// </summary>
public static partial class ContentLoader
{
    public const string EnglishDirectory = "en";

    private static readonly ProblemHeadings EnglishHeadings = new("Hints", "Solution", Tests: null);

    private static (List<TrackContent> Tracks, List<QuizContent> Quizzes, List<ProblemContent> Problems) ApplyEnglish(
        string root, List<TrackContent> tracks, List<QuizContent> quizzes, List<ProblemContent> problems, List<string> errors)
    {
        var englishRoot = Path.Combine(root, EnglishDirectory);
        if (!Directory.Exists(englishRoot))
        {
            return (tracks, quizzes, problems);
        }

        return (
            ApplyEnglishTracks(root, englishRoot, tracks, errors),
            ApplyEnglishQuizzes(root, englishRoot, quizzes, errors),
            ApplyEnglishProblems(root, englishRoot, problems, errors));
    }

    // ================================================================ yollar, bölümler ve dersler

    private static List<TrackContent> ApplyEnglishTracks(string root, string englishRoot, List<TrackContent> tracks, List<string> errors)
    {
        var texts = new Dictionary<string, TrackTextYaml>(StringComparer.Ordinal);
        var file = Path.Combine(englishRoot, "tracks.yaml");

        if (File.Exists(file))
        {
            // Türkçe tracks.yaml henüz dersi olmayan (yayımlanmayan) yolları ve bölümleri de listeleyebilir;
            // çevirinin slug'ları o dosyaya göre doğrulanır.
            var turkishFile = Path.Combine(root, "tracks.yaml");
            var definitions = ReadYaml<List<TrackYaml>>("tracks.yaml", File.Exists(turkishFile) ? File.ReadAllText(turkishFile) : null, []) ?? [];

            foreach (var text in ReadYaml<List<TrackTextYaml>>($"{EnglishDirectory}/tracks.yaml", File.ReadAllText(file), errors) ?? [])
            {
                var where = $"{EnglishDirectory}/tracks.yaml › {text.Slug}";
                var definition = definitions.FirstOrDefault(d => d.Slug == text.Slug);

                if (definition is null || !texts.TryAdd(text.Slug, text))
                {
                    errors.Add($"{where}: tracks.yaml içinde bu slug'a sahip bir yol yok ya da çeviri yineleniyor.");
                    continue;
                }

                Require(text.Title, where, "title", errors);
                Require(text.Description, where, "description", errors);

                foreach (var module in text.Modules)
                {
                    if (definition.Modules.All(m => m.Slug != module.Slug) || text.Modules.Count(m => m.Slug == module.Slug) > 1)
                    {
                        errors.Add($"{where} › {module.Slug}: yolda bu slug'a sahip bir bölüm yok ya da çeviri yineleniyor.");
                    }

                    Require(module.Title, $"{where} › {module.Slug}", "title", errors);
                }
            }
        }

        var lessonTexts = LoadEnglishLessons(root, englishRoot, tracks, errors);

        return [.. tracks.Select(track =>
        {
            var text = texts.GetValueOrDefault(track.Slug);

            return track with
            {
                English = text is null ? null : new TrackText(text.Title, text.Description),
                Modules = [.. track.Modules.Select(module =>
                {
                    var moduleText = text?.Modules.FirstOrDefault(m => m.Slug == module.Slug);

                    return module with
                    {
                        English = moduleText is null ? null : new TrackText(moduleText.Title, moduleText.Description),
                        Lessons = [.. module.Lessons.Select(lesson =>
                            lesson with { English = lessonTexts.GetValueOrDefault((track.Slug, module.Slug, lesson.Slug)) })],
                    };
                })],
            };
        })];
    }

    private static Dictionary<(string Track, string Module, string Lesson), LessonText> LoadEnglishLessons(
        string root, string englishRoot, List<TrackContent> tracks, List<string> errors)
    {
        var result = new Dictionary<(string, string, string), LessonText>();
        var directory = Path.Combine(englishRoot, "lessons");

        if (!Directory.Exists(directory))
        {
            return result;
        }

        foreach (var file in Directory.EnumerateFiles(directory, "*", SearchOption.AllDirectories).Order(StringComparer.Ordinal))
        {
            var where = Relative(root, file);
            var parts = Path.GetRelativePath(directory, file).Replace('\\', '/').Split('/');
            var match = parts.Length == 3 ? NumberedFileName().Match(parts[2]) : null;

            var lesson = match is { Success: true }
                ? tracks.FirstOrDefault(t => t.Slug == parts[0])?.Modules.FirstOrDefault(m => m.Slug == parts[1])
                    ?.Lessons.FirstOrDefault(l => l.Slug == match.Groups[2].Value && l.Order == int.Parse(match.Groups[1].Value))
                : null;

            if (lesson is null || match!.Groups[3].Value != "md")
            {
                errors.Add($"{where}: Türkçe karşılığı olan bir ders dosyası değil (yol, bölüm ve dosya adı aynı olmalı).");
                continue;
            }

            if (!TrySplitFrontMatter(File.ReadAllText(file), out var frontMatter, out var body))
            {
                errors.Add($"{where}: dosya '---' ile başlayan bir ön bilgi bloğu içermeli.");
                continue;
            }

            var meta = ReadYaml<LessonTextYaml>(where, frontMatter, errors);
            if (meta is null)
            {
                continue;
            }

            Require(meta.Title, where, "title", errors);
            Require(meta.Summary, where, "summary", errors);

            if (string.IsNullOrWhiteSpace(body))
            {
                errors.Add($"{where}: ders içeriği boş.");
            }

            result[(parts[0], parts[1], lesson.Slug)] = new LessonText(meta.Title, meta.Summary, body.Trim());
        }

        return result;
    }

    // ================================================================ testler (quiz)

    private static List<QuizContent> ApplyEnglishQuizzes(string root, string englishRoot, List<QuizContent> quizzes, List<string> errors)
    {
        var directory = Path.Combine(englishRoot, "quizzes");
        var texts = new Dictionary<string, (TrackText Quiz, List<QuestionText> Questions)>(StringComparer.Ordinal);

        if (Directory.Exists(directory))
        {
            foreach (var file in Directory.EnumerateFiles(directory, "*", SearchOption.AllDirectories).Order(StringComparer.Ordinal))
            {
                var where = Relative(root, file);
                var parts = Path.GetRelativePath(directory, file).Replace('\\', '/').Split('/');
                var match = parts.Length == 2 ? NumberedFileName().Match(parts[1]) : null;

                var quiz = match is { Success: true }
                    ? quizzes.FirstOrDefault(q => q.TrackSlug == parts[0] && q.Slug == match.Groups[2].Value && q.Order == int.Parse(match.Groups[1].Value))
                    : null;

                if (quiz is null || match!.Groups[3].Value != "yaml")
                {
                    errors.Add($"{where}: Türkçe karşılığı olan bir test dosyası değil (yol ve dosya adı aynı olmalı).");
                    continue;
                }

                var meta = ReadYaml<QuizTextYaml>(where, File.ReadAllText(file), errors);
                if (meta is null)
                {
                    continue;
                }

                Require(meta.Title, where, "title", errors);

                // Doğru şıklar Türkçe dosyadan sırayla alındığı için yapı birebir aynı olmalı.
                if (meta.Questions.Count != quiz.Questions.Count)
                {
                    errors.Add($"{where}: {quiz.Questions.Count} soru bekleniyor, {meta.Questions.Count} soru var.");
                    continue;
                }

                var before = errors.Count;
                var questions = new List<QuestionText>();

                foreach (var (question, index) in meta.Questions.Select((q, i) => (q, i)))
                {
                    var label = $"{where} › soru {index + 1}";
                    Require(question.Q, label, "q", errors);
                    Require(question.Why, label, "why", errors);

                    if (question.Options.Count != quiz.Questions[index].Options.Count || question.Options.Any(string.IsNullOrWhiteSpace))
                    {
                        errors.Add($"{label}: {quiz.Questions[index].Options.Count} dolu şık bekleniyor, {question.Options.Count(o => !string.IsNullOrWhiteSpace(o))} var.");
                    }

                    questions.Add(new QuestionText(question.Q.Trim(), question.Why.Trim(), [.. question.Options.Select(option => option.Trim())]));
                }

                if (errors.Count == before)
                {
                    texts[quiz.Slug] = (new TrackText(meta.Title, meta.Description), questions);
                }
            }
        }

        return [.. quizzes.Select(quiz => texts.TryGetValue(quiz.Slug, out var text)
            ? quiz with
            {
                English = text.Quiz,
                Questions = [.. quiz.Questions.Select((question, index) => question with { English = text.Questions[index] })],
            }
            : quiz)];
    }

    // ================================================================ problemler

    private static List<ProblemContent> ApplyEnglishProblems(string root, string englishRoot, List<ProblemContent> problems, List<string> errors)
    {
        var directory = Path.Combine(englishRoot, "problems");
        var texts = new Dictionary<string, ProblemText>(StringComparer.Ordinal);

        if (Directory.Exists(directory))
        {
            foreach (var file in Directory.EnumerateFiles(directory, "*", SearchOption.AllDirectories).Order(StringComparer.Ordinal))
            {
                var where = Relative(root, file);
                var match = NumberedFileName().Match(Path.GetFileName(file));

                var problem = match.Success && Path.GetDirectoryName(file) == directory
                    ? problems.FirstOrDefault(p => p.Slug == match.Groups[2].Value && p.Number == int.Parse(match.Groups[1].Value))
                    : null;

                if (problem is null || match.Groups[3].Value != "md")
                {
                    errors.Add($"{where}: Türkçe karşılığı olan bir problem dosyası değil (dosya adı aynı olmalı).");
                    continue;
                }

                var before = errors.Count;
                var text = ParseProblemText(File.ReadAllText(file), problem, where, errors);

                if (text is not null && errors.Count == before)
                {
                    texts[problem.Slug] = text;
                }
            }
        }

        return [.. problems.Select(problem => problem with { English = texts.GetValueOrDefault(problem.Slug) })];
    }

    internal static ProblemText? ParseProblemText(string text, ProblemContent problem, string where, List<string> errors)
    {
        if (!TrySplitFrontMatter(text, out var frontMatter, out var body))
        {
            errors.Add($"{where}: dosya '---' ile başlayan bir ön bilgi bloğu içermeli.");
            return null;
        }

        var meta = ReadYaml<ProblemTextYaml>(where, frontMatter, errors);
        if (meta is null)
        {
            return null;
        }

        Require(meta.Title, where, "title", errors);

        var sections = SplitSections(body, EnglishHeadings);
        var statement = sections["statement"].Trim();

        if (statement.Length == 0)
        {
            errors.Add($"{where}: problem tanımı boş.");
        }

        var hints = ParseHints(sections.GetValueOrDefault("hints", string.Empty));
        if (hints.Count != problem.Hints.Count)
        {
            errors.Add($"{where}: '## {EnglishHeadings.Hints}' bölümünde {problem.Hints.Count} ipucu bekleniyor, {hints.Count} var.");
        }

        var editorial = sections.GetValueOrDefault("editorial")?.Trim();
        if (string.IsNullOrEmpty(editorial) != (problem.Editorial is null))
        {
            errors.Add($"{where}: '## {EnglishHeadings.Editorial}' bölümü Türkçe dosyadaki gibi {(problem.Editorial is null ? "olmamalı" : "olmalı")}.");
        }

        // Çeviride kod blokları yalnızca yorumları değişmiş referans çözümlerdir; aynı diller için bulunmalıdır.
        var solutions = ExtractSolutions(editorial ?? string.Empty);
        if (!solutions.Keys.Order().SequenceEqual(problem.Solutions.Keys.Order()))
        {
            errors.Add($"{where}: çözüm kod blokları ({string.Join(", ", solutions.Keys.Order())}) Türkçe dosyadakilerle "
                       + $"({string.Join(", ", problem.Solutions.Keys.Order())}) aynı dilleri kapsamalı.");
        }

        return new ProblemText(meta.Title, statement, hints, string.IsNullOrEmpty(editorial) ? null : editorial, solutions);
    }

    // ================================================================ YAML modelleri

    private sealed class TrackTextYaml
    {
        public string Slug { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public List<ModuleYaml> Modules { get; set; } = [];
    }

    private sealed class LessonTextYaml
    {
        public string Title { get; set; } = string.Empty;

        public string Summary { get; set; } = string.Empty;
    }

    private sealed class QuizTextYaml
    {
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public List<QuestionTextYaml> Questions { get; set; } = [];
    }

    private sealed class QuestionTextYaml
    {
        public string Q { get; set; } = string.Empty;

        public List<string> Options { get; set; } = [];

        public string Why { get; set; } = string.Empty;
    }

    private sealed class ProblemTextYaml
    {
        public string Title { get; set; } = string.Empty;
    }
}
