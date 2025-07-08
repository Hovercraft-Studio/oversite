

Project created with: Electron Forge and Vite template:

```
npx create-electron-app@latest desktop-electron --template=vite
```

## TODO:

- Test builds on Windows and Linux
- Add notyf for checkin success/failure, webcam errors, etc.
- Read app config from env
  - Dashboard settings
  - Webcam index

## TODO (continued):

- Webcam
  - doesn't work on built mac app, but works in dev. Check Windows
  - Make sure it only posts a new image if it's activated - clear old canvas if webcam has been shut off
- Unify config between env file, textfields, and Electron storage
  - Is there a util we could make for this across web components? Or is the dashboard pattern good enough?
- [WIP] system info & env config should be set on appStore or window
  - https://www.electronjs.org/docs/latest/api/screen
- Webcam updates
  - add webcam toggle button - it's weird to have it running always during dev
  - Add a webcam picker to select which webcam to use (make it index-based so .env file can set it)
- Take screenshots within electron: https://www.electronjs.org/docs/latest/api/desktop-capturer
- Add tray/app icons: https://www.electronjs.org/docs/latest/api/native-image
- Add main modes
  - Main mode - report everything w/screenshot & all checkins every 10 minutes
  - Companion mode - report screenshot and minimal info every hour, so we'll see failures of main app, and not overlap much data
- Add a local env file to set defaults. Or what's the best Electron way to do this?
  - Default dashboard address to `http://localhost:3002`
  - Startup window placement (or minimize)
  - Webcam selection (and don't initialize if not set)
  - post intervals
  - webcam index
- Re-render vitals on an interval and add the data to the dashboard
  - Display resolutions/hz as custom props on check-in - need to add to DashboardPoster [WIP]
