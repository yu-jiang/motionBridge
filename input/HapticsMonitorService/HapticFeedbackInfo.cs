using System;

public class HapticFeedbackInfo(string? program, byte largeMotor, byte smallMotor)
{
    public string? program { get; set; } = program;
    public byte largeMotor { get; set; } = largeMotor;
    public byte smallMotor { get; set; } = smallMotor;
}
