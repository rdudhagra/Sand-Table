#ifndef LIGHT_STRIP_CONTROLLER_CONSTANTS_H

#define LIGHT_STRIP_CONTROLLER_CONSTANTS_H

// General Constants
#define DEBUG false
#define SERIAL_BAUD_RATE 115200
#define BUF_SIZE 32

// Communication Protocol Constants
#define START_CHAR '['
#define END_CHAR ']'
#define BRIGHTNESS_CMD '!'
#define FPS_CMD '@'
#define RGB_CMD '#'

// LED Strip Constants
#define DATA_PIN 3
#define LED_TYPE WS2813
#define NUM_LEDS 240
#define BRIGHTNESS 255
#define MAX_MILLIAMPS 12000

// Color Modes
#define OFF 0
#define RAINBOW 1
#define CHRISTMAS 2
#define COLOR_PULSE 3
#define AMBIANCE 4
#define CONFETTI 5

#define SOLID_COLOR 255 // Not to be used by client...only internally

// Color Pulse Mode Constants
#define PULSE_FREQUENCY 3               // Frequency for a new pulse in Hz  \
                                        // Will be on average this value... \
                                        // actual pulses will be created using rng
#define PULSE_MIN_SATURATION 225        // Out of 255
#define PULSE_INTENSITY 50              // bigger the number, longer the leds stay bright, 0 is no change
#define PULSE_BACKGROUND_BRIGHTNESS 80  // 0..255

// Ambiance Mode Constants
#define AMBIANCE_SATURATION 100
#define AMBIANCE_CHANGE_RATE 0.03 // Defines the bounds for the random walk
#define AMBIANCE_MAX_CHANGE_RATE 0.3

// Confetti Mode Constants
#define CONFETTI_DECAY_RATE 2 // Low values = slower fade
#define CONFETTI_SATURATION 150


#endif
