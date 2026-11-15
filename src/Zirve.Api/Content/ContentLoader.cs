using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using YamlDotNet.Core;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;
using Zirve.Api.Data.Entities;
using Zirve.Shared;
using Zirve.Shared.Problems;

namespace Zirve.Api.Content;

/// <summary>
/// <c>content/</c> klasörünü okur ve doğrular.
/// <code>
/// content/
///   tracks.yaml                         yollar ve bölümler (sıra = dosyadaki sıra)
///   lessons/{yol}/{bölüm}/NN-slug.md     ön bilgi (YAML) + Markdown
///   quizzes/{yol}/NN-slug.yaml           test soruları
///   problems/NNN-slug.md                 ön bilgi + tanım + İpuçları + Çözüm + Testler
/// </code>
/// Hatalar tek tek fırlatılmaz; hepsi toplanıp <see cref="ContentException"/> ile birlikte bildirilir.
/// </summary>
public static partial class ContentLoader
{
    private const string HintsHeading = "İpuçları";
    private const string EditorialHeading = "Çözüm";
    private const string TestsHeading = "Testler";

    private static readonly IDeserializer Yaml = new DeserializerBuilder()
        .WithNamingConvention(CamelCaseNamingConvention.Instance)
        .Build();

    [GeneratedRegex(@"^(\d+)-([a-z0-9]+(?:-[a-z0-9]+)*)\.(md|yaml)$")]
    private static partial Regex NumberedFileName();

    [GeneratedRegex(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex SlugPattern();

    [GeneratedRegex(@"^[A-Za-z_][A-Za-z0-9_]*$")]
    private static partial Regex IdentifierPattern();

    public static ContentBundle Load(string root)
    {
        if (!Directory.Exists(root))
        {
            throw new ContentException([$"İçerik klasörü bulunamadı: {root}"]);
        }

        var errors = new List<string>();
        var tracks = LoadTracks(root, errors);
        var quizzes = LoadQuizzes(root, tracks, errors);
        var problems = LoadProblems(root, errors);

        if (errors.Count > 0)
        {
            throw new ContentException(errors);
        }

        return new ContentBundle(tracks, quizzes, problems, ComputeHash(root));
    }

    /// <summary>Uygulama kökünden yukarı çıkarak <c>content/tracks.yaml</c> içeren klasörü bulur.</summary>
    public static string ResolveRoot(string? configuredPath, string contentRootPath)
    {
        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            return Path.GetFullPath(configuredPath, contentRootPath);
        }

        for (var directory = new DirectoryInfo(contentRootPath); directory is not null; directory = directory.Parent)
        {
            var candidate = Path.Combine(directory.FullName, "content");
            if (File.Exists(Path.Combine(candidate, "tracks.yaml")))
            {
                return candidate;
            }
        }

        return Path.Combine(contentRootPath, "content");
    }

    // ================================================================ yollar ve dersler

    private static List<TrackContent> LoadTracks(string root, List<string> errors)
    {
        var file = Path.Combine(root, "tracks.yaml");
        var definitions = ReadYaml<List<TrackYaml>>(file, File.Exists(file) ? File.ReadAllText(file) : null, errors) ?? [];
        var tracks = new List<TrackContent>();
        var seenTracks = new HashSet<string>(StringComparer.Ordinal);

        foreach (var (definition, trackIndex) in definitions.Select((d, i) => (d, i)))
        {
            var where = $"tracks.yaml › {definition.Slug}";

            if (!IsSlug(definition.Slug) || !seenTracks.Add(definition.Slug))
            {
                errors.Add($"{where}: yol slug'ı geçersiz ya da yineleniyor.");
                continue;
            }

            Require(definition.Title, where, "title", errors);
            Require(definition.Description, where, "description", errors);

            var modules = new List<ModuleContent>();
            var seenModules = new HashSet<string>(StringComparer.Ordinal);
            var seenLessons = new HashSet<string>(StringComparer.Ordinal);

            foreach (var (module, moduleIndex) in definition.Modules.Select((m, i) => (m, i)))
            {
                if (!IsSlug(module.Slug) || !seenModules.Add(module.Slug))
                {
                    errors.Add($"{where} › {module.Slug}: bölüm slug'ı geçersiz ya da yineleniyor.");
                    continue;
                }

                Require(module.Title, $"{where} › {module.Slug}", "title", errors);

                var lessons = LoadLessons(root, definition.Slug, module.Slug, seenLessons, errors);

                // tracks.yaml planlanan bölümleri de listeleyebilir; dersi henüz yazılmamış bölümler yayımlanmaz.
                if (lessons.Count > 0)
                {
                    modules.Add(new ModuleContent(module.Slug, module.Title, module.Description, moduleIndex + 1, lessons));
                }
            }

            ReportUnknownDirectories(Path.Combine(root, "lessons", definition.Slug), seenModules, $"lessons/{definition.Slug}", errors);

            if (modules.Count > 0)
            {
                tracks.Add(new TrackContent(
                    definition.Slug, definition.Title, definition.Description, definition.Icon, definition.Accent, trackIndex + 1, modules));
            }
        }

        ReportUnknownDirectories(Path.Combine(root, "lessons"), seenTracks, "lessons", errors);
        return tracks;
    }

    private static List<LessonContent> LoadLessons(string root, string track, string module, HashSet<string> seenInTrack, List<string> errors)
    {
        var directory = Path.Combine(root, "lessons", track, module);
        var lessons = new List<LessonContent>();

        if (!Directory.Exists(directory))
        {
            return lessons;
        }

        foreach (var file in Directory.EnumerateFiles(directory).OrderBy(Path.GetFileName, StringComparer.Ordinal))
        {
            var where = Relative(root, file);
            var match = NumberedFileName().Match(Path.GetFileName(file));

            if (!match.Success || match.Groups[3].Value != "md")
            {
                errors.Add($"{where}: dosya adı 'NN-slug.md' biçiminde olmalı.");
                continue;
            }

            var slug = match.Groups[2].Value;
            if (!seenInTrack.Add(slug))
            {
                errors.Add($"{where}: '{slug}' ders slug'ı bu yol içinde yineleniyor.");
                continue;
            }

            if (!TrySplitFrontMatter(File.ReadAllText(file), out var frontMatter, out var body))
            {
                errors.Add($"{where}: dosya '---' ile başlayan bir ön bilgi bloğu içermeli.");
                continue;
            }

            var meta = ReadYaml<LessonYaml>(where, frontMatter, errors);
            if (meta is null)
            {
                continue;
            }

            Require(meta.Title, where, "title", errors);
            Require(meta.Summary, where, "summary", errors);

            if (!Enum.TryParse<ContentLevel>(meta.Level, ignoreCase: true, out var level))
            {
                errors.Add($"{where}: level 'beginner', 'intermediate' ya da 'advanced' olmalı.");
            }

            if (meta.Minutes is < 1 or > 180)
            {
                errors.Add($"{where}: minutes 1 ile 180 arasında olmalı.");
            }

            if (string.IsNullOrWhiteSpace(body))
            {
                errors.Add($"{where}: ders içeriği boş.");
            }

            lessons.Add(new LessonContent(slug, meta.Title, meta.Summary, meta.Minutes, level, int.Parse(match.Groups[1].Value), body.Trim()));
        }

        return [.. lessons.OrderBy(lesson => lesson.Order)];
    }

    // ================================================================ testler (quiz)

    private static List<QuizContent> LoadQuizzes(string root, List<TrackContent> tracks, List<string> errors)
    {
        var quizzes = new List<QuizContent>();
        var directory = Path.Combine(root, "quizzes");

        if (!Directory.Exists(directory))
        {
            return quizzes;
        }

        // Yalnızca yayımlanan (en az bir dersi olan) yolların testleri yüklenir; diğer klasörler hata sayılmaz.
        var trackSlugs = tracks.Select(track => track.Slug).ToHashSet(StringComparer.Ordinal);
        var seen = new HashSet<string>(StringComparer.Ordinal);

        foreach (var trackSlug in trackSlugs)
        {
            var trackDirectory = Path.Combine(directory, trackSlug);
            if (!Directory.Exists(trackDirectory))
            {
                continue;
            }

            foreach (var file in Directory.EnumerateFiles(trackDirectory).OrderBy(Path.GetFileName, StringComparer.Ordinal))
            {
                var where = Relative(root, file);
                var match = NumberedFileName().Match(Path.GetFileName(file));

                if (!match.Success || match.Groups[3].Value != "yaml")
                {
                    errors.Add($"{where}: dosya adı 'NN-slug.yaml' biçiminde olmalı.");
                    continue;
                }

                var slug = match.Groups[2].Value;
                if (!seen.Add(slug))
                {
                    errors.Add($"{where}: '{slug}' test slug'ı yineleniyor (test slug'ları tüm yollarda benzersiz olmalı).");
                    continue;
                }

                var meta = ReadYaml<QuizYaml>(where, File.ReadAllText(file), errors);
                if (meta is null)
                {
                    continue;
                }

                Require(meta.Title, where, "title", errors);

                if (!Enum.TryParse<ContentLevel>(meta.Level, ignoreCase: true, out var level))
                {
                    errors.Add($"{where}: level 'beginner', 'intermediate' ya da 'advanced' olmalı.");
                }

                if (meta.Questions.Count == 0)
                {
                    errors.Add($"{where}: en az bir soru olmalı.");
                }

                var questions = meta.Questions
                    .Select((question, index) => ParseQuestion(question, $"{where} › soru {index + 1}", errors))
                    .OfType<QuestionContent>()
                    .ToList();

                quizzes.Add(new QuizContent(
                    slug, trackSlug, meta.Title, meta.Description, level, meta.TimeLimitMinutes, int.Parse(match.Groups[1].Value), questions));
            }
        }

        return quizzes;
    }

    private static QuestionContent? ParseQuestion(QuestionYaml question, string where, List<string> errors)
    {
        var before = errors.Count;

        Require(question.Q, where, "q", errors);
        Require(question.Why, where, "why", errors);

        if (question.Options.Count is < 2 or > 6)
        {
            errors.Add($"{where}: 2 ile 6 arasında şık olmalı.");
        }

        if (question.Options.Any(string.IsNullOrWhiteSpace))
        {
            errors.Add($"{where}: boş şık var.");
        }

        if (!Enum.TryParse<Difficulty>(question.Difficulty, ignoreCase: true, out var difficulty))
        {
            errors.Add($"{where}: difficulty 'easy', 'medium' ya da 'hard' olmalı.");
        }

        // answer: 2  ya da  answer: [1, 3]  (1 tabanlı şık numaraları)
        var answers = new HashSet<int>();
        IEnumerable<object?> rawAnswers = question.Answer switch
        {
            null => [],
            string text => [text],
            System.Collections.IEnumerable sequence => sequence.Cast<object?>(),
            var other => [other],
        };

        foreach (var raw in rawAnswers)
        {
            if (int.TryParse(Convert.ToString(raw, System.Globalization.CultureInfo.InvariantCulture), out var number)
                && number >= 1 && number <= question.Options.Count)
            {
                answers.Add(number);
            }
            else
            {
                errors.Add($"{where}: answer değeri '{raw}' geçerli bir şık numarası değil.");
            }
        }

        if (answers.Count == 0)
        {
            errors.Add($"{where}: en az bir doğru şık (answer) belirtilmeli.");
        }
        else if (answers.Count == question.Options.Count)
        {
            errors.Add($"{where}: bütün şıklar doğru olamaz.");
        }

        if (errors.Count > before)
        {
            return null;
        }

        var options = question.Options
            .Select((text, index) => new OptionContent(text.Trim(), answers.Contains(index + 1)))
            .ToList();

        return new QuestionContent(question.Q.Trim(), question.Why.Trim(), difficulty, options);
    }

    // ================================================================ problemler

    private static List<ProblemContent> LoadProblems(string root, List<string> errors)
    {
        var problems = new List<ProblemContent>();
        var directory = Path.Combine(root, "problems");

        if (!Directory.Exists(directory))
        {
            return problems;
        }

        var seenSlugs = new HashSet<string>(StringComparer.Ordinal);
        var seenNumbers = new HashSet<int>();

        foreach (var file in Directory.EnumerateFiles(directory).OrderBy(Path.GetFileName, StringComparer.Ordinal))
        {
            var where = Relative(root, file);
            var match = NumberedFileName().Match(Path.GetFileName(file));

            if (!match.Success || match.Groups[3].Value != "md")
            {
                errors.Add($"{where}: dosya adı 'NNN-slug.md' biçiminde olmalı.");
                continue;
            }

            var number = int.Parse(match.Groups[1].Value);
            var slug = match.Groups[2].Value;

            if (!seenSlugs.Add(slug) || !seenNumbers.Add(number))
            {
                errors.Add($"{where}: problem numarası ya da slug'ı yineleniyor.");
                continue;
            }

            var before = errors.Count;
            var problem = ParseProblem(File.ReadAllText(file), slug, number, where, errors);

            if (problem is not null && errors.Count == before)
            {
                problems.Add(problem);
            }
        }

        return [.. problems.OrderBy(problem => problem.Number)];
    }

    internal static ProblemContent? ParseProblem(string text, string slug, int number, string where, List<string> errors)
    {
        if (!TrySplitFrontMatter(text, out var frontMatter, out var body))
        {
            errors.Add($"{where}: dosya '---' ile başlayan bir ön bilgi bloğu içermeli.");
            return null;
        }

        var meta = ReadYaml<ProblemYaml>(where, frontMatter, errors);
        if (meta is null)
        {
            return null;
        }

        Require(meta.Title, where, "title", errors);

        if (!Enum.TryParse<Difficulty>(meta.Difficulty, ignoreCase: true, out var difficulty))
        {
            errors.Add($"{where}: difficulty 'easy', 'medium' ya da 'hard' olmalı.");
        }

        if (meta.Tags.Count == 0 || meta.Tags.Any(tag => !IsSlug(tag)))
        {
            errors.Add($"{where}: en az bir etiket olmalı ve etiketler slug biçiminde yazılmalı.");
        }

        var languages = meta.Languages is { Count: > 0 } ? meta.Languages : [.. Languages.All];
        if (languages.Any(language => !Languages.IsSupported(language)))
        {
            errors.Add($"{where}: languages yalnızca {string.Join(", ", Languages.All)} içerebilir.");
        }

        var spec = BuildSpec(meta, where, errors);
        var sections = SplitSections(body);

        var statement = sections["statement"].Trim();
        if (statement.Length == 0)
        {
            errors.Add($"{where}: problem tanımı boş.");
        }

        var hints = ParseHints(sections.GetValueOrDefault("hints", string.Empty));
        var editorial = sections.GetValueOrDefault("editorial")?.Trim();
        var solutions = ExtractSolutions(editorial ?? string.Empty);

        foreach (var required in new[] { Languages.CSharp, Languages.TypeScript }.Where(languages.Contains))
        {
            if (!solutions.ContainsKey(required))
            {
                errors.Add($"{where}: '## {EditorialHeading}' bölümünde ```{required} solution kod bloğu eksik.");
            }
        }

        var tests = ParseTests(sections.GetValueOrDefault("tests", string.Empty), where, errors);
        if (spec is not null)
        {
            ValidateTests(tests, spec, where, errors);
        }

        if (spec is null)
        {
            return null;
        }

        return new ProblemContent(
            slug, number, meta.Title, difficulty, meta.Tags, languages, spec, statement, hints,
            string.IsNullOrEmpty(editorial) ? null : editorial, solutions, tests);
    }

    private static ProblemSpec? BuildSpec(ProblemYaml meta, string where, List<string> errors)
    {
        var before = errors.Count;
        var kind = string.IsNullOrEmpty(meta.Kind) ? ProblemKinds.Function : meta.Kind;
        var compare = string.IsNullOrEmpty(meta.Compare) ? CompareModes.Exact : meta.Compare;

        if (!CompareModes.All.Contains(compare))
        {
            errors.Add($"{where}: compare {string.Join(", ", CompareModes.All)} değerlerinden biri olmalı.");
        }

        List<ParamSpec> ToParams(List<ParamYaml> parameters, string owner)
        {
            foreach (var parameter in parameters)
            {
                if (!IdentifierPattern().IsMatch(parameter.Name))
                {
                    errors.Add($"{where}: {owner} parametre adı '{parameter.Name}' geçersiz.");
                }

                CheckType(parameter.Type, allowVoid: false, $"{owner} › {parameter.Name}");
            }

            return [.. parameters.Select(parameter => new ParamSpec(parameter.Name, parameter.Type))];
        }

        void CheckType(string type, bool allowVoid, string owner)
        {
            if (!TypeRef.TryParse(type, out var parsed) || (!allowVoid && parsed!.Name == "void"))
            {
                errors.Add($"{where}: {owner} için tip '{type}' geçersiz.");
            }
        }

        ProblemSpec spec;

        if (kind == ProblemKinds.Function)
        {
            if (!IdentifierPattern().IsMatch(meta.Function))
            {
                errors.Add($"{where}: function adı eksik ya da geçersiz.");
            }

            CheckType(meta.Returns, allowVoid: false, "returns");
            spec = new ProblemSpec
            {
                Kind = kind,
                Name = meta.Function,
                Params = ToParams(meta.Params, "params"),
                Returns = meta.Returns,
                Compare = compare,
            };
        }
        else if (kind == ProblemKinds.Class)
        {
            if (!IdentifierPattern().IsMatch(meta.Class))
            {
                errors.Add($"{where}: class adı eksik ya da geçersiz.");
            }

            if (meta.Methods.Count == 0)
            {
                errors.Add($"{where}: sınıf problemlerinde en az bir metot tanımlanmalı.");
            }

            var methods = new List<MethodSpec>();
            foreach (var method in meta.Methods)
            {
                if (!IdentifierPattern().IsMatch(method.Name))
                {
                    errors.Add($"{where}: metot adı '{method.Name}' geçersiz.");
                }

                CheckType(method.Returns, allowVoid: true, $"methods › {method.Name} › returns");
                methods.Add(new MethodSpec(method.Name, ToParams(method.Params, $"methods › {method.Name}"), method.Returns));
            }

            spec = new ProblemSpec
            {
                Kind = kind,
                Name = meta.Class,
                Params = ToParams(meta.Constructor, "constructor"),
                Methods = methods,
                Compare = compare,
            };
        }
        else
        {
            errors.Add($"{where}: kind 'function' ya da 'class' olmalı.");
            return null;
        }

        return errors.Count == before ? spec : null;
    }

    /// <summary>Gövdeyi, kod blokları dışındaki ayrılmış "## Başlık" satırlarından bölümlere ayırır.</summary>
    private static Dictionary<string, string> SplitSections(string body)
    {
        var sections = new Dictionary<string, StringBuilder>(StringComparer.Ordinal) { ["statement"] = new() };
        var current = "statement";
        var inFence = false;

        foreach (var line in body.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n'))
        {
            if (line.TrimStart().StartsWith("```", StringComparison.Ordinal))
            {
                inFence = !inFence;
            }

            if (!inFence && line.StartsWith("## ", StringComparison.Ordinal))
            {
                var key = line[3..].Trim() switch
                {
                    HintsHeading => "hints",
                    EditorialHeading => "editorial",
                    TestsHeading => "tests",
                    _ => null,
                };

                if (key is not null)
                {
                    current = key;
                    sections[current] = new StringBuilder();
                    continue;
                }
            }

            sections[current].Append(line).Append('\n');
        }

        return sections.ToDictionary(pair => pair.Key, pair => pair.Value.ToString(), StringComparer.Ordinal);
    }

    private static List<string> ParseHints(string section)
    {
        var hints = new List<string>();

        foreach (var line in section.Split('\n').Select(line => line.TrimEnd()))
        {
            if (line.StartsWith("- ", StringComparison.Ordinal))
            {
                hints.Add(line[2..].Trim());
            }
            else if (line.Trim().Length > 0 && hints.Count > 0)
            {
                hints[^1] += " " + line.Trim();
            }
        }

        return hints;
    }

    /// <summary>"```dil solution" ile işaretlenmiş kod bloklarını referans çözüm olarak çıkarır.</summary>
    private static Dictionary<string, string> ExtractSolutions(string editorial)
    {
        var solutions = new Dictionary<string, string>(StringComparer.Ordinal);
        string? language = null;
        var code = new StringBuilder();

        foreach (var line in editorial.Split('\n'))
        {
            var trimmed = line.Trim();

            if (language is null)
            {
                if (trimmed.StartsWith("```", StringComparison.Ordinal) && trimmed.EndsWith(" solution", StringComparison.Ordinal))
                {
                    language = trimmed[3..^" solution".Length].Trim();
                    code.Clear();
                }

                continue;
            }

            if (trimmed == "```")
            {
                solutions[language] = code.ToString().TrimEnd() + "\n";
                language = null;
                continue;
            }

            code.Append(line).Append('\n');
        }

        return solutions;
    }

    private static List<StoredTest> ParseTests(string section, string where, List<string> errors)
    {
        var start = section.IndexOf("```json", StringComparison.Ordinal);
        var end = start < 0 ? -1 : section.IndexOf("```", start + 7, StringComparison.Ordinal);

        if (start < 0 || end < 0)
        {
            errors.Add($"{where}: '## {TestsHeading}' bölümünde ```json kod bloğu bulunamadı.");
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<StoredTest>>(section[(start + 7)..end], ZirveJson.Options) ?? [];
        }
        catch (JsonException ex)
        {
            errors.Add($"{where}: test JSON'u ayrıştırılamadı: {ex.Message}");
            return [];
        }
    }

    private static void ValidateTests(List<StoredTest> tests, ProblemSpec spec, string where, List<string> errors)
    {
        if (tests.Count == 0)
        {
            errors.Add($"{where}: en az bir test olmalı.");
            return;
        }

        if (!tests.Any(test => test.Sample))
        {
            errors.Add($"{where}: en az bir test \"sample\": true ile işaretlenmeli.");
        }

        foreach (var (test, index) in tests.Select((t, i) => (t, i + 1)))
        {
            var label = $"{where} › test {index}";

            if (test.Args.ValueKind != JsonValueKind.Array)
            {
                errors.Add($"{label}: args bir dizi olmalı.");
                continue;
            }

            if (test.Expected.ValueKind == JsonValueKind.Undefined)
            {
                errors.Add($"{label}: expected eksik.");
                continue;
            }

            if (spec.Kind == ProblemKinds.Function)
            {
                if (test.Args.GetArrayLength() != spec.Params.Count)
                {
                    errors.Add($"{label}: {spec.Params.Count} argüman bekleniyor, {test.Args.GetArrayLength()} verilmiş.");
                }

                continue;
            }

            var operations = test.Ops ?? [];
            if (operations.Count == 0 || operations[0] != spec.Name)
            {
                errors.Add($"{label}: ops ilk eleman olarak '{spec.Name}' ile başlamalı.");
                continue;
            }

            if (operations.Count != test.Args.GetArrayLength()
                || test.Expected.ValueKind != JsonValueKind.Array
                || test.Expected.GetArrayLength() != operations.Count)
            {
                errors.Add($"{label}: ops, args ve expected aynı uzunlukta diziler olmalı.");
                continue;
            }

            var arguments = test.Args.EnumerateArray().ToArray();
            for (var i = 0; i < operations.Count; i++)
            {
                var expectedCount = i == 0
                    ? spec.Params.Count
                    : spec.Methods.FirstOrDefault(method => method.Name == operations[i])?.Params.Count;

                if (expectedCount is null)
                {
                    errors.Add($"{label}: '{operations[i]}' tanımlı bir metot değil.");
                }
                else if (arguments[i].ValueKind != JsonValueKind.Array || arguments[i].GetArrayLength() != expectedCount)
                {
                    errors.Add($"{label}: '{operations[i]}' için {expectedCount} argüman bekleniyor.");
                }
            }
        }
    }

    // ================================================================ yardımcılar

    private static bool TrySplitFrontMatter(string text, out string frontMatter, out string body)
    {
        frontMatter = body = string.Empty;
        var normalized = text.Replace("\r\n", "\n", StringComparison.Ordinal).TrimStart('﻿');

        if (!normalized.StartsWith("---\n", StringComparison.Ordinal))
        {
            return false;
        }

        var end = normalized.IndexOf("\n---", 4, StringComparison.Ordinal);
        if (end < 0)
        {
            return false;
        }

        frontMatter = normalized[4..end];
        var bodyStart = normalized.IndexOf('\n', end + 4);
        body = bodyStart < 0 ? string.Empty : normalized[(bodyStart + 1)..];
        return true;
    }

    private static T? ReadYaml<T>(string where, string? yaml, List<string> errors)
        where T : class
    {
        if (yaml is null)
        {
            errors.Add($"{where}: dosya bulunamadı.");
            return null;
        }

        try
        {
            var value = Yaml.Deserialize<T>(yaml);
            if (value is null)
            {
                errors.Add($"{where}: YAML içeriği boş.");
            }

            return value;
        }
        catch (YamlException ex)
        {
            errors.Add($"{where}: YAML hatası (satır {ex.Start.Line}): {ex.InnerException?.Message ?? ex.Message}");
            return null;
        }
    }

    private static void Require(string? value, string where, string field, List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors.Add($"{where}: '{field}' alanı zorunlu.");
        }
    }

    private static bool IsSlug(string? value) => !string.IsNullOrEmpty(value) && SlugPattern().IsMatch(value);

    private static string Relative(string root, string file) => Path.GetRelativePath(root, file).Replace('\\', '/');

    private static void ReportUnknownDirectories(string directory, HashSet<string> known, string label, List<string> errors)
    {
        if (!Directory.Exists(directory))
        {
            return;
        }

        foreach (var name in Directory.EnumerateDirectories(directory).Select(Path.GetFileName))
        {
            if (name is not null && !known.Contains(name))
            {
                errors.Add($"{label}/{name}: tracks.yaml içinde karşılığı olmayan klasör.");
            }
        }
    }

    private static string ComputeHash(string root)
    {
        using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);

        foreach (var file in Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories).OrderBy(path => path, StringComparer.Ordinal))
        {
            hash.AppendData(Encoding.UTF8.GetBytes(Relative(root, file)));
            hash.AppendData(File.ReadAllBytes(file));
        }

        return Convert.ToHexStringLower(hash.GetHashAndReset());
    }

    // ================================================================ YAML modelleri

    private sealed class TrackYaml
    {
        public string Slug { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Icon { get; set; } = string.Empty;

        public string Accent { get; set; } = string.Empty;

        public List<ModuleYaml> Modules { get; set; } = [];
    }

    private sealed class ModuleYaml
    {
        public string Slug { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }

    private sealed class LessonYaml
    {
        public string Title { get; set; } = string.Empty;

        public string Summary { get; set; } = string.Empty;

        public int Minutes { get; set; }

        public string Level { get; set; } = string.Empty;
    }

    private sealed class QuizYaml
    {
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Level { get; set; } = string.Empty;

        public int? TimeLimitMinutes { get; set; }

        public List<QuestionYaml> Questions { get; set; } = [];
    }

    private sealed class QuestionYaml
    {
        public string Q { get; set; } = string.Empty;

        public List<string> Options { get; set; } = [];

        public object? Answer { get; set; }

        public string Why { get; set; } = string.Empty;

        public string Difficulty { get; set; } = string.Empty;
    }

    private sealed class ProblemYaml
    {
        public string Title { get; set; } = string.Empty;

        public string Difficulty { get; set; } = string.Empty;

        public List<string> Tags { get; set; } = [];

        public string Kind { get; set; } = string.Empty;

        public string Function { get; set; } = string.Empty;

        public string Class { get; set; } = string.Empty;

        public List<ParamYaml> Params { get; set; } = [];

        public List<ParamYaml> Constructor { get; set; } = [];

        public string Returns { get; set; } = string.Empty;

        public List<MethodYaml> Methods { get; set; } = [];

        public string Compare { get; set; } = string.Empty;

        public List<string>? Languages { get; set; }
    }

    private sealed class ParamYaml
    {
        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;
    }

    private sealed class MethodYaml
    {
        public string Name { get; set; } = string.Empty;

        public List<ParamYaml> Params { get; set; } = [];

        public string Returns { get; set; } = "void";
    }
}
