# Electron HiDPI Rendering (Desktop)

## Purpose
Ensure WriteNow Electron desktop app renders crisply on HiDPI/Retina/4K displays and DPI-scaled environments (e.g. Windows 150%), without introducing unsafe Electron defaults.

## Requirements

### Requirement: Electron startup MUST enable HiDPI rendering switches
The Electron main process MUST append the necessary Chromium command line switches before `app.whenReady()` to ensure crisp rendering on HiDPI/Retina displays.
#### Scenario: App initializes Chromium
- **GIVEN** the Electron main process is starting
- **WHEN** the app initializes (before `app.whenReady()`)
- **THEN** it appends Chromium switches for HiDPI/Retina rendering (`high-dpi-support=1`, `force-device-scale-factor=1`)
- **THEN** it appends switches to improve rendering quality via GPU acceleration where supported
- **THEN** on Linux it can disable GPU sandbox if required for compatibility

### Requirement: Main window MUST use secure webPreferences
The main window webPreferences MUST use secure defaults and include rendering-quality related preferences to avoid blur.
#### Scenario: Main window is created
- **GIVEN** the app is ready to create the main window
- **WHEN** `createMainWindow()` creates the main `BrowserWindow`
- **THEN** `webPreferences` uses secure defaults (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `preload: ...`)
- **THEN** it sets rendering-related preferences (`zoomFactor: 1.0`, `enablePreferredSizeMode: true`)

### Requirement: WebContents MUST lock zoom factor to avoid blur
The main window `webContents` MUST be locked to `zoomFactor=1.0` and visual zoom MUST be disabled to prevent unintended scaling blur.
#### Scenario: WebContents is ready
- **GIVEN** the main window is created
- **WHEN** the app configures the window `webContents`
- **THEN** `webContents` is forced to `setZoomFactor(1.0)`
- **THEN** `setVisualZoomLevelLimits(1, 1)` prevents visual zoom (avoids blur from unintended scaling)

### Requirement: Global styles MUST improve text rendering
Global CSS MUST enable font smoothing and legibility optimizations to improve text clarity across platforms.
#### Scenario: App styles are loaded
- **GIVEN** the renderer loads global CSS
- **WHEN** styles are applied
- **THEN** font smoothing and text rendering are optimized for legibility
