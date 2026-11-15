using System.Runtime.InteropServices;

namespace Zirve.Runner.Execution;

public static class ExecutableLocator
{
    /// <summary>
    /// Kullanıcı kodunu çalıştıracak <c>dotnet</c> yürütücüsünü bulur. Öncelik: yapılandırılmış mutlak yol,
    /// sonra Runner'ı çalıştıran .NET kurulumu, en son PATH.
    /// </summary>
    public static string ResolveDotnet(string configured)
    {
        if (Path.IsPathRooted(configured) && File.Exists(configured))
        {
            return configured;
        }

        // .../dotnet/shared/Microsoft.NETCore.App/10.0.x/ -> üç seviye yukarısı kurulum köküdür.
        var runtimeDirectory = RuntimeEnvironment.GetRuntimeDirectory();
        var root = Path.GetFullPath(Path.Combine(runtimeDirectory, "..", "..", ".."));
        var candidate = Path.Combine(root, OperatingSystem.IsWindows() ? "dotnet.exe" : "dotnet");

        return File.Exists(candidate) ? candidate : FindOnPath(configured) ?? configured;
    }

    public static string Resolve(string nameOrPath) =>
        Path.IsPathRooted(nameOrPath) ? nameOrPath : FindOnPath(nameOrPath) ?? nameOrPath;

    public static string? FindOnPath(string name)
    {
        var path = Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrEmpty(path))
        {
            return null;
        }

        string[] extensions = OperatingSystem.IsWindows() && !Path.HasExtension(name)
            ? [".exe", ".cmd", ".bat"]
            : [string.Empty];

        foreach (var directory in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            foreach (var extension in extensions)
            {
                try
                {
                    var candidate = Path.Combine(directory, name + extension);
                    if (File.Exists(candidate))
                    {
                        return candidate;
                    }
                }
                catch (ArgumentException)
                {
                    // PATH içinde geçersiz bir girdi; atla.
                }
            }
        }

        return null;
    }
}
