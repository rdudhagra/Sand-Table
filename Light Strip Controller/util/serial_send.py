import serial, time
ser = serial.Serial('/dev/tty.usbmodem142101', 2400, timeout=1)  # open serial port

time.sleep(4)
print("Writing command...")

ser.write(b'#\xff\xcc\x33')

print(ser.readline())
print(ser.readline())
print(ser.readline())

time.sleep(1)
ser.close()