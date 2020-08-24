#define FASTLED_ALLOW_INTERRUPTS 0
#include <FastLED.h>
#include "constants.h"
#include "mode.h"
#include "solidcolor.h"

CRGB leds[NUM_LEDS];

uint8_t mode = OFF; // Start with leds off
uint8_t *dat;

void setup()
{
    delay(1000); // 1 second delay for recovery

    // tell FastLED about the LED strip configuration
    FastLED.addLeds<LED_TYPE, DATA_PIN, GRB>(leds, NUM_LEDS);

    // set master brightness control
    FastLED.setBrightness(BRIGHTNESS);
    FastLED.setMaxPowerInVoltsAndMilliamps(5, MAX_MILLIAMPS);

    // Set Serial baud rate
    Serial.begin(SERIAL_BAUD_RATE);

    // Initialize dat for the first time
    dat = init_dat(mode);
}

void loop()
{
    // Check for new mode
    if (Serial.available())
    {
        // Set new mode
        uint8_t newMode = Serial.read();
        if (newMode != '\r' && newMode != '\n')
        {
            if (DEBUG)
            {
                Serial.print("Setting new mode: ");
                Serial.println(newMode);
            }

            if (newMode == '!')
            {
                // Set new brightness
                uint8_t t = 1;
                while (t && Serial.available() < 1)
                {
                    // Wait a bit to get all bytes from serial (b)
                    // Limited to 255ms (by size of uint8_t)
                    FastLED.delay(1);
                    if (DEBUG)
                        Serial.print(".");
                    t++;
                }

                if (Serial.available() < 1)
                {
                    while (Serial.available())
                        Serial.read(); // flush serial buffer
                    if (DEBUG)
                        Serial.println();
                    Serial.println("Invalid brightness input...");
                    return;
                }

                uint8_t b = Serial.read();

                if (DEBUG)
                {
                    Serial.print("Setting brightness: ");
                    Serial.println(b);
                }

                FastLED.setBrightness(b);
            }
            else if (newMode == '#')
            {
                // We are sending a solid color, not a predefined mode
                // act accordingly...

                uint8_t t = 1;
                while (t && Serial.available() < 3)
                {
                    // Wait a bit to get all three bytes from serial (r,g,b)
                    // Limited to 255ms (by size of uint8_t)
                    FastLED.delay(1);
                    if (DEBUG)
                        Serial.print(".");
                    t++;
                }

                if (Serial.available() < 3)
                {
                    while (Serial.available())
                        Serial.read(); // flush serial buffer
                    if (DEBUG)
                        Serial.println();
                    Serial.println("Invalid solid color input...");
                    return;
                }

                uint8_t r = Serial.read();
                uint8_t g = Serial.read();
                uint8_t b = Serial.read();

                if (DEBUG)
                {
                    Serial.print("Setting solid color: (");
                    Serial.print(r);
                    Serial.print(", ");
                    Serial.print(g);
                    Serial.print(", ");
                    Serial.print(b);
                    Serial.println(")");
                }

                // Free old dat
                free(dat);

                // Init dat to solid color type
                dat = init_solid_color_dat(r, g, b); // Assume rgb format

                mode = SOLID_COLOR;
            }
            else
            {
                mode = newMode;

                // Free old dat
                free(dat);

                // Init dat to correct type
                dat = init_dat(mode);
            }
        }
    }

    // Compute next frame
    next_frame(mode, leds, dat);
    FastLED.show();

    // Serial.println(*dat);

    // Wait until next frame
    FastLED.delay(1e3 / FRAMES_PER_SECOND);
}
