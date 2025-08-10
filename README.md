# PrintMate
A react/next.js based controller for Bambu Lab 3D printers. 

## Printer Compatibility
A1 series - Tested and working\
P1 series - Untested, most likely will work\
X1 series - Untested, most likely will work\
H2D - Untested, unlikely to function correctly

## Features
* Connect to Bambu Lab printers over MQTT and FTP
* Receive data about temperature, status, etc
* List and print files on the internal storage
* Control an in-progress print
* Camera stream for A1/P1 series printers
* Get Bambu HMS (Health Management System) messages
* Manage filament settings
* Skip objects during print
* Download timelapse files from the printer

## Planned features
* Camera stream for X1 series/external RTSP camera
* Modify the printer configuration (partially implemented)
