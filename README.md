# PrintMate
A react/next.js based controller for Bambu Lab 3D printers. 

## Printer Compatibility
A1 series - Tested and working\
P1 series - Tested and working\
X1 series - Untested, most likely will work\
H2D - Untested, unlikely to function correctly

## Features
* Connect to Bambu Lab printers over MQTT (local and Bambu cloud) and FTP
* Receive data about temperature, status, etc
* List and print files on the internal storage
* Control an in-progress print
* Camera stream for A1/P1 series printers
* Get Bambu HMS (Health Management System) messages
* Skip objects during print
* Download timelapse files from the printer
* Change printer and filament settings and firmware update

## Planned features
* Camera stream for X1 series/external RTSP camera

## Usage
### Linux (x64)
Download the linux-x64.zip from latest release, unzip, and run `print_mate`, no install required.

### Windows (x64)
Download the win-x64.zip from latest release, unzip, and run `PrintMate.exe`, no install required.
