#!/bin/bash

############# Install Arduino ###############

# Install Arduino CLI
if [ ! -f "$HOME"/arduino-cli ]
then
	echo "arduino-cli not found! Installing..."
    curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=$HOME/ sh
    chmod +x "$HOME"/arduino-cli
fi

# Install AVR Boards
"$HOME"/arduino-cli core install arduino:avr

# Install FastLED
"$HOME"/arduino-cli lib install FastLED

##############  Flash sketch  ###############

# cd to the script's directory
cd "${0%/*}" || exit

# Compile
"$HOME"/arduino-cli compile -b arduino:avr:uno "../Light Strip Controller/main"

# Upload
source .env
"$HOME"/arduino-cli upload -p "$LED_STRIP_ARDUINO_SERIAL_PORT" -b arduino:avr:uno "../Light Strip Controller/main" -t -v


echo "Done!"
