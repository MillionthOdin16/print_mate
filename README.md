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

## Platform Support

### Desktop
#### Linux (x64)
Download the linux-x64.zip from latest release, unzip, and run `print_mate`, no install required.

#### Windows (x64)
Download the win-x64.zip from latest release, unzip, and run `PrintMate.exe`, no install required.

### Mobile
#### Android
Download the latest APK from releases or automatic builds. The app provides core functionality optimized for mobile devices.

**Features on Android:**
- Add and manage printers via local storage
- Direct Bambu Cloud authentication
- Optimized mobile interface
- Network connectivity for local and cloud printers

## Development

### Desktop Development
```bash
npm install
npm run dev
```

### Mobile Development (Android)
```bash
npm install
npm run build:mobile
npx cap sync android
npx cap run android
```

### Building for Production
- **Desktop**: `npm run package:linux` or `npm run package:win`
- **Android**: `npm run android:build` (requires Android SDK)

## Architecture
- **Frontend**: Next.js with React
- **Desktop**: Electron wrapper
- **Mobile**: Capacitor for native Android app
- **Storage**: File system (desktop) or Capacitor Preferences (mobile)
- **Communication**: MQTT and FTP protocols
