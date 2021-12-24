#ifndef LIGHT_STRIP_CONTROLLER_CONFETTI_H

#define LIGHT_STRIP_CONTROLLER_CONFETTI_H

#include "constants.h"
#include <FastLED.h>

// Adapted from https://github.com/atuline/FastLED-Demos/blob/master/confetti/confetti.ino

void confetti(CRGB *leds, uint8_t *dat)
{
    (void)dat;

    fadeToBlackBy(leds, NUM_LEDS, CONFETTI_DECAY_RATE);     
    int pos = random16(NUM_LEDS);
    leds[pos] += CHSV((*dat + random16(256))/4 , CONFETTI_SATURATION, 255);  // 12 bits for hue so that the hue increment isn't too quick.
    *dat++;
}

uint8_t *init_confetti_dat()
{
    uint8_t *dat = (uint8_t *)malloc(sizeof(uint8_t));
    *dat = 0;

    return dat;
}

#endif