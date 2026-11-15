using System.ComponentModel.DataAnnotations;

namespace Zirve.Runner;

public sealed class RunnerOptions
{
    public const string SectionName = "Runner";

    /// <summary>Ayarlıysa, istekler <c>X-Runner-Key</c> başlığında bu anahtarı taşımak zorundadır.</summary>
    public string? ApiKey { get; set; }

    /// <summary>Aynı anda çalışabilecek en fazla kod sayısı. 0 ise işlemci sayısına göre belirlenir.</summary>
    [Range(0, 64)]
    public int MaxConcurrency { get; set; }

    /// <summary>Boş yuva beklerken en fazla bekleme süresi.</summary>
    [Range(1, 120)]
    public int QueueTimeoutSeconds { get; set; } = 15;

    /// <summary>Test modunda tüm testlerin toplam süre sınırı.</summary>
    [Range(1, 60)]
    public int TestsTimeoutSeconds { get; set; } = 10;

    /// <summary>Deneme alanı (script) modunda süre sınırı.</summary>
    [Range(1, 60)]
    public int ScriptTimeoutSeconds { get; set; } = 8;

    /// <summary>JavaScript/TypeScript testlerinde tek bir testin süre sınırı.</summary>
    [Range(100, 30_000)]
    public int PerTestTimeoutMs { get; set; } = 3000;

    [Range(64, 2048)]
    public int MemoryLimitMb { get; set; } = 256;

    [Range(1_000, 10_000_000)]
    public int MaxOutputBytes { get; set; } = 1_000_000;

    [Range(100, 500_000)]
    public int MaxCodeLength { get; set; } = 50_000;

    [Range(1, 500)]
    public int MaxTests { get; set; } = 200;

    public string DotnetPath { get; set; } = "dotnet";

    public string NodePath { get; set; } = "node";

    /// <summary>Geçici çalışma klasörlerinin kökü. Boşsa sistemin geçici klasörü kullanılır.</summary>
    public string? WorkDirectory { get; set; }

    /// <summary>C# kodunda dosya/ağ/yansıma gibi API'lerin kullanımını derleme aşamasında engeller (derinlemesine savunma).</summary>
    public bool EnforceCSharpApiRestrictions { get; set; } = true;

    /// <summary>Node.js süreçlerini izin modeliyle (--permission) başlatır.</summary>
    public bool UseNodePermissionModel { get; set; } = true;

    public int EffectiveConcurrency => MaxConcurrency > 0 ? MaxConcurrency : Math.Max(1, Environment.ProcessorCount / 2);
}
