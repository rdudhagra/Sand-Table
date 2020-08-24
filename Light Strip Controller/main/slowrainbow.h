#ifndef LIGHT_STRIP_CONTROLLER_SLOW_RAINBOW_H

#define LIGHT_STRIP_CONTROLLER_SLOW_RAINBOW_H

#include "constants.h"
#include <FastLED.h>


void slow_rainbow(CRGB *leds, uint8_t *dat)
{
    fill_rainbow(leds, NUM_LEDS, dat[1], 1);
    dat[0]++;
    if (dat[0] >= 5)
    {
        dat[1]++;
        dat[0] = 0;
    }
}

uint8_t *init_slow_rainbow_dat()
{
    uint8_t *dat = (uint8_t*) calloc(2, sizeof(uint8_t));
    dat[0] = 0; // Local counter to slow down rainbow size
    dat[1] = 0; // Counter for hue offest, same as rainbow
    return dat;
}

#endif