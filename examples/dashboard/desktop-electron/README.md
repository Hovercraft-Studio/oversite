

Project created with: Electron Forge and Vite template:

```
npx create-electron-app@latest desktop-electron --template=vite
```

## TODO

- Fix broken custom images sent to dashboard when there's no webcam. why is this sending?
- Rename .exe to `dashboard-poster.exe`
- Minimize dashboard poster app on an interval
- Make sure Dashboard Poster app doesn't keep the Windows task bar visible
- Report vitals to dashboard
  - Re-render vitals on an interval and add the data to the dashboard as custom properties
  - Display resolutions/hz as custom props on check-in - need to add to DashboardPoster [WIP]
- [WIP] system info & env config should be set on appStore or window
  - https://www.electronjs.org/docs/latest/api/screen
- Add tray/app icons: https://www.electronjs.org/docs/latest/api/native-image
- Add main modes
  - Main mode - report everything w/screenshot & all checkins every 10 minutes
  - Companion mode - report screenshot and minimal info every hour (remove anything that another Dashboard client would post ()), so we'll see failures of main app, and not overlap much data
    - "uptime": 29400,
    - "frameCount": 1,
    - "frameRate": 60,
    - But the server adding last_seen time would prevent us from seeing a red card ever. maybe companion mode could note itself to the server, or we create a secondary app id?

Deployment

- Confirm build process & document! Do we have to install via squirrel Setup.exe?
- Test builds on Windows and Linux
- How to auto-launch app updates?
  - https://www.electronjs.org/docs/latest/tutorial/updates
  - Can the app keep its localStorage settings? .env file might negate this need anyway

Nice-to-haves

- Add notyf for checkin success/failure, webcam errors, etc.
- Refactor & unify config between env file, textfields, and Electron storage
  - Is there a util we could make for this across web components? Or is the dashboard pattern good enough?
- Webcam doesn't work on built mac app, but works in dev
- Take screenshots within electron 
  - Screen capture object should check screen size/aspect ratio and adjust the screenshot size. Right now we're requesting 1080p
