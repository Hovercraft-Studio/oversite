

Project created with: Electron Forge and Vite template:

```
npx create-electron-app@latest desktop-electron --template=vite
```

## TODO

- Webcam
  - Make sure it only posts a new image if it's activated - clear old canvas if webcam has been shut off
- [WIP] system info & env config should be set on appStore or window
  - https://www.electronjs.org/docs/latest/api/screen
  - Re-render vitals on an interval and add the data to the dashboard
- Take screenshots within electron: https://www.electronjs.org/docs/latest/api/desktop-capturer
- Add tray/app icons: https://www.electronjs.org/docs/latest/api/native-image
- Add main modes
  - Main mode - report everything w/screenshot & all checkins every 10 minutes
  - Companion mode - report screenshot and minimal info every hour, so we'll see failures of main app, and not overlap much data
- .env Startup window placement (or minimize)
  - Display resolutions/hz as custom props on check-in - need to add to DashboardPoster [WIP]
- Test builds on Windows and Linux

Nice-to-haves

- Add notyf for checkin success/failure, webcam errors, etc.
- Unify config between env file, textfields, and Electron storage
  - Is there a util we could make for this across web components? Or is the dashboard pattern good enough?
- Webcam doesn't work on built mac app, but works in dev. Check Windows
