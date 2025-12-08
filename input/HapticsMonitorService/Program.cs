using HapticsMonitorApp.Services;
using Nefarius.ViGEm.Client;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
class HapticsMonitorService
{
    static async Task Main(string[] args)
    {
        bool silent = false;
        foreach (var a in args)
            if (a.ToLower().Equals("silent") || a.ToLower().Equals("-s"))
                silent = true;

        // 1. Connect to WebSocket server
        ClientWebSocket ws = new();
        var uri = new Uri($"ws://localhost:6789/input?client=haptics");
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        Console.WriteLine($"Connecting to WebSocket server at {uri}...");
        await ws.ConnectAsync(uri, cts.Token);

        // 2. Create a virtual Xbox 360 controller and Connect
        var viGem = new ViGEmClient();
        var controller = viGem.CreateXbox360Controller();
        controller.Connect();
        Console.WriteLine("Virtual controller connected.");

        // 3. Listen for vibration events
        controller.FeedbackReceived += async (sender, e) =>
        {
            // LargeMotor and SmallMotor correspond to the two different rumbles on the Xbox controller
            if (e.LargeMotor > 0 || e.SmallMotor > 0)
            {
                string? activeProgram = WindowHelper.GetActiveProcessName();
                HapticFeedbackInfo data = new(activeProgram, e.LargeMotor, e.SmallMotor);
                string json = JsonSerializer.Serialize(data);
                byte[] buffer = Encoding.UTF8.GetBytes(json);
                await ws.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
                if (!silent)
                {
                    Console.WriteLine($"Sent Haptic Feedback: Program={data.program}, LargeMotor={data.largeMotor}, SmallMotor={data.smallMotor}");
                }
            }
        };

        // Keep the application running
        await Task.Delay(Timeout.Infinite);
    }
}