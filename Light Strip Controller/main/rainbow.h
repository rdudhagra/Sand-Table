#ifndef LIGHT_STRIP_CONTROLLER_RAINBOW_H

#define LIGHT_STRIP_CONTROLLER_RAINBOW_H

#include "constants.h"
#include <FastLED.h>

void rainbow(CRGB *leds, uint8_t *dat)
{
    fill_rainbow(leds, NUM_LEDS, *dat, 1);
    (*dat)++;
}

uint8_t *init_rainbow_dat()
{
    uint8_t *dat = (uint8_t*) malloc(sizeof(uint8_t));
    *dat = 0;
    return dat;
}

#endif