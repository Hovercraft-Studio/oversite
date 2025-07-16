

Project created with: Electron Forge and Vite template:

```
npx create-electron-app@latest desktop-electron --template=vite
```

## TODO

- Take screenshots within electron 
  - add to dashboard poster
  - Add toggle w/ localstorage/.env active setting
  - Screen capture object should check screen size/aspect ratio and adjust the screenshot size
- Webcam
  - choose size of webcam in settings - the default is small
- [WIP] system info & env config should be set on appStore or window
  - https://www.electronjs.org/docs/latest/api/screen
  - Re-render vitals on an interval and add the data to the dashboard
  - Display resolutions/hz as custom props on check-in - need to add to DashboardPoster [WIP]
- Add tray/app icons: https://www.electronjs.org/docs/latest/api/native-image
- Option to start minimized - use .env
- Add main modes
  - Main mode - report everything w/screenshot & all checkins every 10 minutes
  - Companion mode - report screenshot and minimal info every hour (remove anything that another Dashboard client would post ()), so we'll see failures of main app, and not overlap much data
    - "uptime": 29400,
    - "frameCount": 1,
    - "frameRate": 60,
    - But the server adding last_seen time would prevent us from seeing a red card ever. maybe companion mode could note itself to the server, or we create a secondary app id?
- .env Startup window placement (or minimize)

Deployment

- Test builds on Windows and Linux
- How to auto-launch app updates?
  - https://www.electronjs.org/docs/latest/tutorial/updates
  - Can the app keep its localStorage settings? .env file might negate this need anyway

Nice-to-haves

- Add notyf for checkin success/failure, webcam errors, etc.
- Unify config between env file, textfields, and Electron storage
  - Is there a util we could make for this across web components? Or is the dashboard pattern good enough?
- Webcam doesn't work on built mac app, but works in dev. Check Windows
