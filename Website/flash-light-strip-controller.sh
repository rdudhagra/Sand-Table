#!/bin/bash

############# Install Arduino ###############

# Install Arduino CLI
if [ ! -f /home/pi/arduino-cli ]
then
	echo "arduino-cli not found! Installing..."
    curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=/home/pi/ sh
    chmod +x /home/pi/arduino-cli
fi

# Install AVR Boards
/home/pi/arduino-cli core install arduino:avr

# Install FastLED
/home/pi/arduino-cli lib install FastLED

##############  Flash sketch  ###############

# cd to the script's directory
cd "${0%/*}"

# Compile
/home/pi/arduino-cli compile -b arduino:avr:uno "../Light Strip Controller/main"

# Upload
source .env
/home/pi/arduino-cli upload -p $LED_STRIP_ARDUINO_SERIAL_PORT -b arduino:avr:uno "../Light Strip Controller/main" -t -v


echo "Done!"
