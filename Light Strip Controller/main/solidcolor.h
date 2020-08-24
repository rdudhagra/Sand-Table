#ifndef LIGHT_STRIP_CONTROLLER_SOLID_COLOR_H

#define LIGHT_STRIP_CONTROLLER_SOLID_COLOR_H

#include "constants.h"
#include <FastLED.h>

void solid_color(CRGB *leds, uint8_t *dat)
{
    fill_solid(leds, NUM_LEDS, CRGB(dat[0], dat[1], dat[2]));
}

uint8_t *init_solid_color_dat(uint8_t r, uint8_t g, uint8_t b)
{
    uint8_t *dat = (uint8_t*) calloc(3, sizeof(uint8_t));

    dat[0] = r;
    dat[1] = g;
    dat[2] = b;
    return dat;
}

#endif