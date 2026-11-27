namespace Zirve.Runner.Execution;

/// <summary>
/// Kullanıcıya dönen iletilerin dili. API isteğin dilini <see cref="Zirve.Shared.Execution.ExecutionRequest.Locale"/>
/// ile bildirir; <see cref="ExecutionService"/> bunu çalıştırmanın başında ayarlar ve değer o çalıştırmanın
/// asenkron akışı boyunca geçerli kalır. Alt süreçlere (test koşucuları) <see cref="EnvironmentVariable"/> ile geçirilir.
/// </summary>
public static class RunnerText
{
    public const string EnvironmentVariable = "ZIRVE_LOCALE";

    private static readonly AsyncLocal<bool> English = new();

    public static bool IsEnglish => English.Value;

    /// <summary>Alt süreçlere geçirilecek dil kodu.</summary>
    public static string Locale => English.Value ? "en" : "tr";

    public static void Use(string? locale) => English.Value = locale == "en";

    public static string T(string turkish, string english) => English.Value ? english : turkish;
}
