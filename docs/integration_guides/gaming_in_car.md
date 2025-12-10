This feature is only available for Windows computers and it does not work with the gamepad output. Here is the instruction to record and map game haptic feedback to motions

1. Run the haptics monitor program by using
   `npm run haptics`
2. Run the MotionPlayer program.
3. Open a game that supports haptic feedback.

MotionBridge will automatically record new haptic signals from games. If a haptic signal exists in the mapping, the mapped motion will be played. You can also edit the haptic signal records and their motion mappings in the webpage.

Under the hood, it's using a virtual game controller to hijack haptic signals. A firing haptic signal indicates that a game event occurs and we should play a motion to match it.

However, the automatic registry can go wrong. We determine the owner of haptic signal by capturing the program in the active window. This method is flawed. If this happens, you can remove the record in the webpage.

Why haptic signals? It would be more accurate if we can use a game's api to detect game events, but there are too many games and different apis. This is our generic solution.

### Haptic Signal Format

```
127:250
```

Two numbers (000-250) connected by ":". The two numbers respectively correspond to the large and small rumble in a game controller.
