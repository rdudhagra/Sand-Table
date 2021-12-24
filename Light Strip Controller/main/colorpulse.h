#ifndef LIGHT_STRIP_CONTROLLER_COLOR_PULSE_H

#define LIGHT_STRIP_CONTROLLER_COLOR_PULSE_H

#include "constants.h"
#include <FastLED.h>

#define PI 128 // This is with relation to 2pi=256, used by 8-bit FastLED trig funcs

const uint8_t N_OVER_2 = NUM_LEDS / 2;
const uint8_t A = 255 / NUM_LEDS;

const CRGB BLACK = CRGB(0, 0, 0);

uint8_t calcIntensity(uint8_t widthOfSine, uint8_t x)
{
    // See https://www.desmos.com/calculator/pugbvzhzrd for equation rationale
    uint8_t res =
        scale8(
            cubicwave8(
                qadd8(
                    qmul8(
                        (uint8_t)(255.0 / widthOfSine * x),
                        A),
                    PI)),
            qsub8(
                255,
                scale8(
                    255,
                    widthOfSine)));
    return qadd8(res, scale8(res, PULSE_INTENSITY));
}

void process_pulse(CRGB *leds, uint8_t *dat, fract8 blend_amount)
{
    if (dat[1] == 255)
    {
        dat[0] = random8(NUM_LEDS);
        dat[1] = 0;
        CRGB newColor = CHSV(random8(), random8(PULSE_MIN_SATURATION, 255), 255);
        dat[2] = newColor.red;
        dat[3] = newColor.green;
        dat[4] = newColor.blue;
    }

    uint8_t range = scale8(N_OVER_2, dat[1]);
    int m = (int)dat[0] - (int)range;
    if (m < 0)
        m += NUM_LEDS;
    uint8_t min = (uint8_t)m;

    uint8_t max = addmod8(dat[0], range, NUM_LEDS);

    if (min == max)
    {
        for (int i = 0; i < NUM_LEDS; i++)
        {
            leds[i] = blend(leds[i], BLACK, blend_amount);
        }
    }
    else
    {

        int8_t i = -1 * range;
        uint8_t j = min;

        while (j != max)
        {
            uint8_t intensity = calcIntensity(dat[1], abs8(i));
            leds[j] = blend(
                leds[j],
                CRGB(
                    scale8_LEAVING_R1_DIRTY(dat[2], intensity),
                    scale8_LEAVING_R1_DIRTY(dat[3], intensity),
                    scale8(dat[4], intensity)),
                blend_amount);

            j = addmod8(j, 1, NUM_LEDS);
            i++;
        }
        while (j != min)
        {
            leds[j] = blend(
                leds[j],
                BLACK,
                blend_amount);

            j = addmod8(j, 1, NUM_LEDS);
        }
    }

    dat[1]++;
}

void color_pulse(CRGB *leds, uint8_t *dat)
{
    fill_solid(leds, NUM_LEDS, CRGB(PULSE_BACKGROUND_BRIGHTNESS, PULSE_BACKGROUND_BRIGHTNESS, PULSE_BACKGROUND_BRIGHTNESS));

    process_pulse(leds, dat, 192);

    if (dat[15] == 0)
        process_pulse(leds, dat + 5, 110);
    else
    {
        for (int i = 0; i < NUM_LEDS; i++)
        {
            leds[i] = blend(leds[i], BLACK, 110);
        }
        dat[15]--;
    }

    if (dat[16] == 0)
        process_pulse(leds, dat + 10, 77);
    else
    {
        for (int i = 0; i < NUM_LEDS; i++)
        {
            leds[i] = blend(leds[i], BLACK, 77);
        }
        dat[16]--;
    }

    for (int i = 0; i < NUM_LEDS; i++)
    {
        leds[i] *= 3;
    }
}

uint8_t *init_color_pulse_dat()
{
    uint8_t *dat = (uint8_t *)calloc(5, sizeof(uint8_t));
    dat[0] = 0;    // Pulse 1 Current LED position for pulse center (255 means no pos)
    dat[1] = 255;  // Pulse 1 Current sine wave progression for pulse center (from 0 to 255)
    dat[2] = 0;    // Pulse 1 Current LED Red value
    dat[3] = 0;    // Pulse 1 Current LED Green value
    dat[4] = 0;    // Pulse 1 Current LED Blue value
    dat[5] = 0;    // Pulse 2 Current LED position for pulse center (255 means no pos)
    dat[6] = 255;  // Pulse 2 Current sine wave progression for pulse center (from 0 to 255)
    dat[7] = 0;    // Pulse 2 Current LED Red value
    dat[8] = 0;    // Pulse 2 Current LED Green value
    dat[9] = 0;    // Pulse 2 Current LED Blue value
    dat[10] = 0;   // Pulse 3 Current LED position for pulse center (255 means no pos)
    dat[11] = 255; // Pulse 3 Current sine wave progression for pulse center (from 0 to 255)
    dat[12] = 0;   // Pulse 3 Current LED Red value
    dat[13] = 0;   // Pulse 3 Current LED Green value
    dat[14] = 0;   // Pulse 3 Current LED Blue value
    dat[15] = 85;  // Initial number of frames to delay Pulse 2 by
    dat[16] = 170; // Initial number of frames to delay Pulse 3 by
    return dat;
}

#endif