using System.Runtime.InteropServices;

namespace Zirve.Runner.Execution;

/// <summary>
/// Windows'ta çöken bir alt süreç (ör. stack overflow) Windows Hata Bildirimi'ni tetikler; bu hem
/// saniyelerce gecikmeye hem de sunucuda görünmeyen iletişim kutularına yol açabilir. Hata modu alt
/// süreçlere miras kaldığı için Runner açılışta bunu kapatır. Diğer işletim sistemlerinde etkisizdir.
/// </summary>
internal static class CrashDialogs
{
    private const uint FailCriticalErrors = 0x0001;
    private const uint NoGpFaultErrorBox = 0x0002;
    private const uint NoOpenFileErrorBox = 0x8000;

    private static int _applied;

    public static void Suppress()
    {
        if (!OperatingSystem.IsWindows() || Interlocked.Exchange(ref _applied, 1) == 1)
        {
            return;
        }

        var current = SetErrorMode(0);
        SetErrorMode(current | FailCriticalErrors | NoGpFaultErrorBox | NoOpenFileErrorBox);
    }

    [DllImport("kernel32.dll")]
    [DefaultDllImportSearchPaths(DllImportSearchPath.System32)]
    private static extern uint SetErrorMode(uint mode);
}
