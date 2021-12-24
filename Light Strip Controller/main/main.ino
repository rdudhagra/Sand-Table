#define FASTLED_ALLOW_INTERRUPTS 0
#include <FastLED.h>
#include "constants.h"
#include "mode.h"
#include "solidcolor.h"

CRGB leds[NUM_LEDS];

uint8_t mode = OFF; // Start with leds off
uint8_t *dat;

uint16_t millis_per_frame = 1e3 / 25;

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

char inputBuf[BUF_SIZE];        // a String to hold incoming data
char cmd[BUF_SIZE];             // a String to hold the finished command
uint8_t buf_pos = 0;            // Current position in the buffer (and length of stored string)
bool newCommandReady = false;   // whether the string is complete
bool processingCommand = false; // a bool to prevent modifying cmd while reading it

void loop()
{
    // Compute next frame
    EVERY_N_MILLIS_I(thisTimer, millis_per_frame)
    {
        handle_serial_data();
        process_cmd();
        thisTimer.setPeriod(millis_per_frame);
        next_frame(mode, leds, dat);
        FastLED.show();
        // Serial.println(*dat);
    }
}

void process_cmd()
{
    // Check for new mode
    if (newCommandReady)
    {
        newCommandReady = false;
        processingCommand = true;

        // Verify start character
        if (cmd[0] == START_CHAR)
        {
            // Set new mode
            uint8_t newMode = (uint8_t)cmd[1];
            if (newMode != '\r' && newMode != '\n')
            {
                if (DEBUG)
                {
                    Serial.print("Setting new mode: ");
                    Serial.println(newMode);
                }

                if (newMode == BRIGHTNESS_CMD)
                {
                    // Check that the command is valid
                    if (cmd[3] == END_CHAR)
                    {
                        // Set new brightness
                        uint8_t b = cmd[2];

                        if (DEBUG)
                        {
                            Serial.print("Setting brightness: ");
                            Serial.println(b);
                        }

                        FastLED.setBrightness(b);

                        send_ack();
                    }
                }
                else if (newMode == FPS_CMD)
                {
                    // Check that the command is valid
                    if (cmd[3] == END_CHAR)
                    {
                        // Set new fps
                        uint16_t fps = cmd[2];
                        millis_per_frame = 1e3 / fps;

                        if (DEBUG)
                        {
                            Serial.print("Setting FPS: ");
                            Serial.println(fps);
                        }

                        send_ack();
                    }
                }
                else if (newMode == RGB_CMD)
                {
                    // Check that the command is valid
                    if (cmd[5] == END_CHAR)
                    {
                        // We are sending a solid color, not a predefined mode
                        // act accordingly...
                        uint8_t r = cmd[2];
                        uint8_t g = cmd[3];
                        uint8_t b = cmd[4];

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

                        send_ack();
                    }
                }
                else
                {
                    // Check that the command is valid
                    if (cmd[2] == END_CHAR)
                    {
                        mode = newMode;

                        // Free old dat
                        free(dat);

                        // Init dat to correct type
                        dat = init_dat(mode);

                        send_ack();
                    }
                }
            }
        }

        processingCommand = false;
    }
}

void send_ack()
{
    Serial.println("ack");
}

void handle_serial_data()
{
    while (Serial.available())
    {
        // get the new byte:
        char inChar = (char)Serial.read();
        // if the incoming character is the start character, we are receiving the
        // beginning of a new command. Reset the buffer
        // Or, reset the buffer if we've filled it up.
        if (inChar == START_CHAR || buf_pos >= BUF_SIZE)
        {
            memset(inputBuf, 0, BUF_SIZE);
            buf_pos = 0;
        }

        inputBuf[buf_pos] = inChar;
        buf_pos++;

        // if the incoming character is the end character, set a flag so the
        // main loop can do something about it:
        if (inChar == END_CHAR)
        {
            // If we're processing a command already, just throw this new one away
            if (!processingCommand)
            {
                memcpy(cmd, inputBuf, BUF_SIZE);
                newCommandReady = true;
            }
            memset(inputBuf, 0, BUF_SIZE);
            buf_pos = 0;
        }
    }
}
