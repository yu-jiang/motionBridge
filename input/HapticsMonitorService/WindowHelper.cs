using System.Diagnostics;
using System.Runtime.InteropServices;

namespace HapticsMonitorApp.Services
{
    public static class WindowHelper
    {
        [DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        public static string? GetActiveProcessPath()
        {
            IntPtr hwnd = GetForegroundWindow();
            uint result = GetWindowThreadProcessId(hwnd, out uint pid);
            if (result == 0)
            {
                return null;
            }
            var activeProc = Process.GetProcessById((int)pid);
            if (activeProc == null)
            {
                return null;
            }
            if (activeProc.MainModule == null)
            {
                return null;
            }
            string exePath = activeProc.MainModule.FileName;
            return exePath;
        }

        public static string? GetActiveProcessName()
        {
            IntPtr hwnd = GetForegroundWindow();
            uint result = GetWindowThreadProcessId(hwnd, out uint pid);
            if (result == 0)
            {
                return null;
            }
            var activeProc = Process.GetProcessById((int)pid);
            if (activeProc == null)
            {
                return null;
            }
            if (activeProc.MainModule == null)
            {
                return null;
            }
            string exeName = Path.GetFileName(activeProc.MainModule.FileName);
            return exeName;
        }
    }
}