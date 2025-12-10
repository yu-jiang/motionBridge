To add a new target,the first step is to map MotionPlayer output to your device.

MotionPlayer output looks like this:

`[f1, f2, f3, f4]`

`f1..4` are normalized values representing forces. You need to adapt these to your device's input channels.

Next, you want to write a python driver in the `output/` folder that sends signals to your device. The driver needs a `send` function. You can refer to other drivers in the output folder.

After that, add the driver in the `set_target` section of `motion_player_main.py` and add your driver's name in the `TARGET_LIST` setting in `motion_player_utils.py`.

Now you are good to go! You can either run the target in CLI with `-t` argument or in the webpage.
