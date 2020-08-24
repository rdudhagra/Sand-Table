#ifndef LIGHT_STRIP_CONTROLLER_AMBIANCE_H

#define LIGHT_STRIP_CONTROLLER_AMBIANCE_H

#include "constants.h"
#include <FastLED.h>

float float_rand(float min, float max)
{
    float scale = rand() / (float)RAND_MAX; /* [0, 1.0] */
    return min + scale * (max - min);       /* [min, max] */
}

void ambiance(CRGB *leds, uint8_t *dat)
{
    float *data = (float *)dat;
    data[1] += float_rand(-AMBIANCE_CHANGE_RATE, AMBIANCE_CHANGE_RATE);
    data[1] = constrain(data[1], -AMBIANCE_MAX_CHANGE_RATE, AMBIANCE_MAX_CHANGE_RATE);
    data[0] += data[1];
    if (data[0] > 255)
        data[0] -= 255;
    else if (data[0] < 0)
        data[0] += 255;

    fill_solid(leds, NUM_LEDS, CHSV((uint8_t)data[0], AMBIANCE_SATURATION, 255));
}

uint8_t *init_ambiance_dat()
{
    float *dat = (float *)calloc(2, sizeof(float));
    dat[0] = 0; // Current hue
    dat[1] = 0; // Current increment amount for hue
    return (uint8_t *)dat;
}

#endif