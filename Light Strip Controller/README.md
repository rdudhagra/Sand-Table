# Light Strip Controller
### An Arduino program meant for controlling an RGB LED strip using FastLED, with predefined modes and the ability to be controlled through serial
### Designed by Ravi Dudhagra ([@rdudhagra](https://github.com/rdudhagra))

## Prerequisites
Hardware:
- Arduino (literally anything that FastLED can run on...I used an Uno)
- LED Strip(s) (anything FastLED can support), and an adequate way to power them
  - Note: because of how the code was optimized to use 8-bit arithmetic (because it's orders of magnitude faster than floating-point math), this code supports **at most 255 led's**. If you want more led's, you will have to convert the 8-bit math to 16-bit/floating point arithmetic, which in that case, I would recommend using a more powerful arduino like a Due/Teensy.

## Configuration
All configuration is done in `main/constants.h`. The most important parameter is `NUM_LEDS`, which controls how many led's that the software will compute values for. 

Also important is the `DATA_PIN` parameter, which controls what pin on the Arduino will send the data to the led's. If you are using an led strip with more than one data pin (such as a DotStar), you may have to modify this file, as well as `main.ino`. 

Note that changing `FRAMES_PER_SECOND` will speed up/slow down the patterns themselves as well. 

Change `MAX_MILLIAMPS` to whatever the maximum current rating of your power source is to avoid blowing stuff up. 

The rest of the parameters control the individual modes...these can be left as is unless you're curious...

## Installing

Using the Arduino IDE (or vscode extension, etc.), upload the firmware to your Arduino. You can then use the sand table webserver to test it, or use the file `util/serial_send.py` to manually send commands.