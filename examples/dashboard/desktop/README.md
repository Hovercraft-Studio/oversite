# neutralinojs-minimal

The default template for a Neutralinojs app. It's possible to use your favorite frontend framework by using [these steps](https://neutralino.js.org/docs/getting-started/using-frontend-libraries).

## Run Neutralino dev server

```bash
neu run
```

## TODO

- system info & env config should be set on appStore or window
- add webcam toggle button - it's weirdto have it running always during dev
- Add main modes
  - Main mode - report everything w/screenshot & all checkins every 10 minutes
  - Companion mode - report screenshot and minimal info every hour, so we'll see failures of main app, and not overlap much data
- Add a local env file to set defaults. Or what's the best Neutralino way to do this?
  - Default dashboard address to `http://localhost:3002`
  - Startup window placement (or minimize)
  - Webcam selection (and don't initialize if not set)
- Re-render vitals on an interval and add the data to the dashboard
  - Display resolutions/hz as custom props on check-in - need to add to DashboardPoster [WIP]