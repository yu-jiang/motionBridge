["Input Sources -> MotionBridge -> MotionPlayer -> Output Devices"](./image/diagram.png)

MotionBridge and MotionPlayer are the two core components in this architecture.
MotionBridge translates input signals to local motions, and MotionPlayer trnasforms motions to force signals.

There is also a live mode which MotionBridge directly sends forces to MotionPlayer.

MotionEditor is a branch of MotionBridge allowing you to edit, compose and manage local motions.
