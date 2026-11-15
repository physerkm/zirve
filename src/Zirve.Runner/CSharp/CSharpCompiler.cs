using System.Collections.Immutable;
using System.Globalization;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Emit;
using Microsoft.CodeAnalysis.Text;
using Zirve.Shared.Execution;

namespace Zirve.Runner.CSharp;

public sealed record CSharpCompileResult(byte[]? Assembly, IReadOnlyList<CompileDiagnostic> Diagnostics)
{
    public bool Success => Assembly is not null;
}

/// <summary>
/// Kullanıcının C# kodunu Roslyn ile bellekte derler. Test modunda kod, gömülü test koşucusuyla
/// birlikte tek bir çalıştırılabilir derlemeye dönüştürülür.
/// </summary>
public sealed class CSharpCompiler
{
    public const string UserFileName = "Solution.cs";
    private const int MaxDiagnostics = 20;

    /// <summary>
    /// Kullanıcı kodunun başvurabileceği derlemeler. Burada olmayan bir derlemedeki tipler
    /// (ör. System.Net.Http, System.Diagnostics.Process) hiç derlenemez.
    /// </summary>
    private static readonly string[] AllowedAssemblies =
    [
        "System.Private.CoreLib",
        "System.Runtime",
        "System.Console",
        "System.Collections",
        "System.Collections.Concurrent",
        "System.Collections.Immutable",
        "System.Collections.NonGeneric",
        "System.Linq",
        "System.Linq.Expressions",
        "System.Memory",
        "System.Numerics.Vectors",
        "System.ObjectModel",
        "System.Runtime.Extensions",
        "System.Runtime.Numerics",
        "System.Text.Json",
        "System.Text.Encodings.Web",
        "System.Text.RegularExpressions",
        "System.Threading",
        "System.Threading.Channels",
        "System.Threading.Tasks",
        "System.Threading.Tasks.Parallel",
        "System.Threading.Thread",
        "Microsoft.CSharp",
    ];

    private const string GlobalUsings = """
        global using System;
        global using System.Collections.Generic;
        global using System.Linq;
        global using System.Text;
        global using System.Threading.Tasks;
        """;

    // Deneme alanında Türkçe karakterler bozulmasın diye çıktı akışları UTF-8'e sabitlenir.
    private const string ScriptInitializer = """
        internal static class ZirveScriptInitializer
        {
            [System.Runtime.CompilerServices.ModuleInitializer]
            internal static void Initialize()
            {
                var utf8 = new System.Text.UTF8Encoding(false);
                System.Console.SetOut(new System.IO.StreamWriter(System.Console.OpenStandardOutput(), utf8) { AutoFlush = true });
                System.Console.SetError(new System.IO.StreamWriter(System.Console.OpenStandardError(), utf8) { AutoFlush = true });
            }
        }
        """;

    private static readonly CSharpParseOptions ParseOptions =
        CSharpParseOptions.Default.WithLanguageVersion(LanguageVersion.Latest);

    private readonly ImmutableArray<MetadataReference> _references;
    private readonly SyntaxTree _globalUsingsTree;
    private readonly SyntaxTree _harnessTree;
    private readonly SyntaxTree _scriptInitializerTree;

    public CSharpCompiler()
    {
        _references = LoadReferences();
        _globalUsingsTree = Parse(GlobalUsings, "GlobalUsings.cs");
        _harnessTree = Parse(LoadHarnessSource(), "Harness.cs");
        _scriptInitializerTree = Parse(ScriptInitializer, "ScriptInitializer.cs");
    }

    public CSharpCompileResult Compile(string code, ExecutionMode mode, bool enforceRestrictions)
    {
        var userTree = Parse(code, UserFileName);

        SyntaxTree[] trees = mode == ExecutionMode.Tests
            ? [userTree, _globalUsingsTree, _harnessTree]
            : [userTree, _globalUsingsTree, _scriptInitializerTree];

        var options = new CSharpCompilationOptions(
            OutputKind.ConsoleApplication,
            mainTypeName: mode == ExecutionMode.Tests ? "ZirveHarness.Program" : null,
            optimizationLevel: OptimizationLevel.Release,
            allowUnsafe: false,
            nullableContextOptions: NullableContextOptions.Disable,
            concurrentBuild: false,
            deterministic: true);

        var compilation = CSharpCompilation.Create("run", trees, _references, options);

        using var assembly = new MemoryStream();
        var emitResult = compilation.Emit(assembly, options: new EmitOptions(debugInformationFormat: DebugInformationFormat.Embedded));

        var diagnostics = emitResult.Diagnostics
            .Where(d => d.Severity == DiagnosticSeverity.Error)
            .OrderBy(d => d.Location.SourceTree == userTree ? 0 : 1)
            .ThenBy(d => d.Location.SourceSpan.Start)
            .Take(MaxDiagnostics)
            .Select(d => ToDiagnostic(d, userTree))
            .ToList();

        if (!emitResult.Success)
        {
            return new CSharpCompileResult(null, diagnostics);
        }

        if (enforceRestrictions)
        {
            var violations = ApiRestrictionAnalyzer.Analyze(compilation, userTree);
            if (violations.Count > 0)
            {
                return new CSharpCompileResult(null, violations);
            }
        }

        return new CSharpCompileResult(assembly.ToArray(), []);
    }

    private static CompileDiagnostic ToDiagnostic(Diagnostic diagnostic, SyntaxTree userTree)
    {
        var message = $"{diagnostic.Id}: {diagnostic.GetMessage(CultureInfo.InvariantCulture)}";

        if (diagnostic.Location.SourceTree != userTree)
        {
            return new CompileDiagnostic(0, 0, message);
        }

        var position = diagnostic.Location.GetLineSpan().StartLinePosition;
        return new CompileDiagnostic(position.Line + 1, position.Character + 1, message);
    }

    private static SyntaxTree Parse(string source, string path) =>
        CSharpSyntaxTree.ParseText(SourceText.From(source, Encoding.UTF8), ParseOptions, path);

    private static ImmutableArray<MetadataReference> LoadReferences()
    {
        if (AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES") is not string trusted || trusted.Length == 0)
        {
            throw new InvalidOperationException("Çalışma zamanı derlemeleri bulunamadı (TRUSTED_PLATFORM_ASSEMBLIES boş).");
        }

        var allowed = new HashSet<string>(AllowedAssemblies, StringComparer.OrdinalIgnoreCase);

        var references = trusted
            .Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries)
            .Where(path => allowed.Contains(Path.GetFileNameWithoutExtension(path)))
            .Select(path => (MetadataReference)MetadataReference.CreateFromFile(path))
            .ToImmutableArray();

        if (references.Length == 0)
        {
            throw new InvalidOperationException("C# derlemesi için başvuru derlemeleri yüklenemedi.");
        }

        return references;
    }

    private static string LoadHarnessSource()
    {
        using var stream = typeof(CSharpCompiler).Assembly.GetManifestResourceStream("Zirve.Runner.TestHarness.cs")
                           ?? throw new InvalidOperationException("Gömülü test koşucusu kaynağı bulunamadı.");
        using var reader = new StreamReader(stream, Encoding.UTF8);
        return reader.ReadToEnd();
    }
}
