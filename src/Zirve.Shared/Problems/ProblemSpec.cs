namespace Zirve.Shared.Problems;

public static class Languages
{
    public const string CSharp = "csharp";
    public const string JavaScript = "javascript";
    public const string TypeScript = "typescript";

    public static readonly IReadOnlyList<string> All = [CSharp, JavaScript, TypeScript];

    public static bool IsSupported(string? language) => language is not null && All.Contains(language);
}

public static class ProblemKinds
{
    /// <summary>Tek bir fonksiyon yazılır; her test fonksiyonu bir kez çağırır.</summary>
    public const string Function = "function";

    /// <summary>Bir sınıf tasarlanır; her test bir işlem dizisi (kurucu + metot çağrıları) çalıştırır.</summary>
    public const string Class = "class";
}

public static class CompareModes
{
    /// <summary>Birebir eşitlik (ondalıklı sayılarda 1e-6 tolerans).</summary>
    public const string Exact = "exact";

    /// <summary>En dıştaki dizinin eleman sırası önemsiz.</summary>
    public const string Unordered = "unordered";

    /// <summary>Hem dış dizinin hem iç dizilerin eleman sırası önemsiz.</summary>
    public const string UnorderedNested = "unordered-nested";

    public static readonly IReadOnlyList<string> All = [Exact, Unordered, UnorderedNested];
}

public sealed record ParamSpec(string Name, string Type);

public sealed record MethodSpec(string Name, IReadOnlyList<ParamSpec> Params, string Returns);

/// <summary>
/// Bir kodlama probleminin dilden bağımsız imzası. Başlangıç kodları bu imzadan üretilir,
/// test koşucuları argümanları bu imzaya göre dönüştürür.
/// </summary>
public sealed record ProblemSpec
{
    public string Kind { get; init; } = ProblemKinds.Function;

    /// <summary>Fonksiyon adı (camelCase) ya da sınıf adı (PascalCase).</summary>
    public required string Name { get; init; }

    /// <summary>Fonksiyon parametreleri ya da (sınıf problemlerinde) kurucu parametreleri.</summary>
    public IReadOnlyList<ParamSpec> Params { get; init; } = [];

    public string Returns { get; init; } = "void";

    /// <summary>Yalnızca sınıf problemlerinde: çağrılabilecek metotlar.</summary>
    public IReadOnlyList<MethodSpec> Methods { get; init; } = [];

    public string Compare { get; init; } = CompareModes.Exact;
}
