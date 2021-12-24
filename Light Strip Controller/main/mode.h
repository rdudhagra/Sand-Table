#ifndef LIGHT_STRIP_CONTROLLER_MODE_H

#define LIGHT_STRIP_CONTROLLER_MODE_H

#include "constants.h"
#include "off.h"
#include "rainbow.h"
#include "christmas.h"
#include "solidcolor.h"
#include "colorpulse.h"
#include "ambiance.h"
#include "confetti.h"

void next_frame(uint8_t mode, CRGB *leds, uint8_t *dat)
{

    void (*updateFn)(CRGB *, uint8_t *);

    switch (mode)
    {
    case OFF:
        updateFn = &off;
        break;
    case RAINBOW:
        updateFn = &rainbow;
        break;
    case CHRISTMAS:
        updateFn = &christmas;
        break;
    case SOLID_COLOR:
        updateFn = &solid_color;
        break;
    case COLOR_PULSE:
        updateFn = &color_pulse;
        break;
    case AMBIANCE:
        updateFn = &ambiance;
        break;
    case CONFETTI:
        updateFn = &confetti;
        break;
    default:
        updateFn = &off; // Turn off by default
        break;
    }

    (*updateFn)(leds, dat);
}

uint8_t *init_dat(uint8_t mode)
{

    uint8_t *(*initFn)();

    switch (mode)
    {
    case OFF:
        initFn = *init_off_dat;
        break;
    case RAINBOW:
        initFn = *init_rainbow_dat;
        break;
    case CHRISTMAS:
        initFn = *init_christmas_dat;
        break;
    case COLOR_PULSE:
        initFn = &init_color_pulse_dat;
        break;
    case AMBIANCE:
        initFn = &init_ambiance_dat;
        break;
    case CONFETTI:
        initFn = &init_confetti_dat;
        break;
    default:
        initFn = *init_off_dat; // Turn off by default
        break;
    }
    return (*initFn)();
}

#endif