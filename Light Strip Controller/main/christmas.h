#ifndef LIGHT_STRIP_CONTROLLER_CHRISTMAS_H

#define LIGHT_STRIP_CONTROLLER_CHRISTMAS_H

#include "constants.h"
#include <FastLED.h>

void christmas(CRGB *leds, uint8_t *dat)
{
    if (*dat == 0)
    {
        // White, Green, White, Red
        fill_gradient_RGB(leds, 0, CRGB::CadetBlue, NUM_LEDS / 4 - 1, CRGB::Green);
        fill_gradient_RGB(leds, NUM_LEDS / 4, CRGB::Green, NUM_LEDS / 2 - 1, CRGB::CadetBlue);
        fill_gradient_RGB(leds, NUM_LEDS / 2, CRGB::CadetBlue, NUM_LEDS / 4 * 3 - 1, CRGB::Red);
        fill_gradient_RGB(leds, NUM_LEDS / 4 * 3, CRGB::Red, NUM_LEDS - 1, CRGB::CadetBlue);
        *dat = 1;
    }
    else
    {
        // save the first element
        CRGB first = leds[0];
        // shift every element down one
        for (int i = 1; i < NUM_LEDS; i++)
        {
            leds[i - 1] = leds[i];
        }
        // put the first element in the last slot
        leds[NUM_LEDS - 1] = first;
    }
}

uint8_t *init_christmas_dat()
{
    uint8_t *dat = (uint8_t *)malloc(sizeof(uint8_t));
    *dat = 0;

    return dat;
}

#endif