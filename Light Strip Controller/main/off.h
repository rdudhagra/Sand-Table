#ifndef LIGHT_STRIP_CONTROLLER_OFF_H

#define LIGHT_STRIP_CONTROLLER_OFF_H

#include "constants.h"
#include <FastLED.h>

void off(CRGB *leds, uint8_t *dat)
{
    fill_solid(leds, NUM_LEDS, CRGB::Black);
}

uint8_t *init_off_dat()
{
    uint8_t *dat = (uint8_t*) malloc(sizeof(uint8_t));
    *dat = 0;
    return dat;
}

#endif