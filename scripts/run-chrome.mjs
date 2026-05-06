/*******************************************************************

# Run Chrome in kiosk mode

Notes:

- This is a Windows-only tool!
- Kiosk mode is good for user-facing touchscreens that can't be escaped, but fullscreen mode is better for dev work, because you can still easily use dev tools, etc. You can also use the Broadcast Channel API to send messages between windows (kiosk mode disables this). However, sending browsers to multiple screens requires the --screen-num (--user-dir) option, which also disables the Broadcast Channel API.
- Chrome is launched via `exec()` (not `spawn`). This is intentional: `exec` inherits the foreground window token from the calling process, which is what allows Chrome to appear on top of other windows. Using `spawn` with `detached: true` breaks that inheritance chain and Chrome will open behind other windows.

Usage:

node run-chrome.mjs --url http://localhost:3002 --chrome-path "C:\\Program Files\\Chromium\\Application\\"

To launch 2 Chrome windows to different monitors:

Use --location to place the window on the target monitor (x,y coordinates in Windows virtual desktop space, accounting
for display zoom). Once positioned on the right monitor, --fullscreen or --kiosk will expand to fill that screen.

--screen-num does NOT move the window — it creates a separate Chrome user profile at c:/_chrome-kiosk-prefs/screen-{N}
on disk, which lets two Chrome instances run in fullscreen/kiosk on different monitors simultaneously. Without separate
profiles, Chrome gets confused and both windows fight over the same fullscreen state. Only needed for multi-monitor setups.

- node run-chrome.mjs --url http://localhost:3002 --location 500,100 --fullscreen true --screen-num 1 
- node run-chrome.mjs --url http://localhost:3002 --location 2500,100 --fullscreen true --screen-num 2

Required params:

`--url` - URL to open in Chrome

Optional params:

`--chrome-path` - Path to the Chrome executable. Needs formatting like: `C:\\Program Files\\Chromium\\Application\\`
`--kiosk` - Whether to run in kiosk mode (true/false) - most likely for a user-facing locked-down touchscreen. Defaults to false. Don't combine with --fullscreen mode.
`--fullscreen` - Whether to launch in fullscreen. Defaults to false. Allows for exiting fullscreen mode for debugging. Don't combine with --kiosk mode.
`--screen-num` - Required when using kiosk/fullscreen across multiple monitors. It should be set to the display number to launch the window on. This creates a Chrome user profile directory on the computer on the C: drive for each browser. This user directory lets chrome launch 2+ fullscreen/kiosk windows on separate displays at the same time, as it runs them in separate sandboxes, to a degree. 
`--address-bar` - Keeps the address bar if true. Defaults to false for a more minimal app title bar, and has no impact in kiosk mode.
`--size` - width,height of window. Defaults to `800,600`
`--location` - x,y coordinates to launch the window at. Defaults to 0,0. Needed to place windows on different monitors. *You* need to account for display zoom set in Windows. 
`--incognito` - Whether to disable localstorage, etc. Defaults to false. 
`--unsafe-origins` - Comma-separated list of URLs to allow in Chrome that are not secure, for getUserMedia, etc. We automatically set the main URL as an unsafe origin, so you don't need to include it in this list.
  - More info: https://www.chromium.org/Home/chromium-security/deprecating-powerful-features-on-insecure-origins/
  - If not launching in kiosk mode, this flag will trigger an infobar telling you that it's unsafe and not supported, which is not true. Though it seems that --test-type solved this rogue infobar.
`--log-displays` - Logs displays properties for debugging. Defaults to false.
`--kill-before` - Whether to kill any Chrome instances before running. Defaults to false.

npm script usage:

`npm run launch-chrome`

and in package.json:

```
"launch-chrome": "node ./scripts/run-chrome.mjs --url http://localhost:3002 --location 500,100 --fullscreen true --screen-num 1",
```

To import and use programmatically from a Node app:

import ChromeLauncher from "./scripts/run-chrome.mjs";

const launcher = new ChromeLauncher({
  url: "http://localhost:3002",
  isFullscreen: true,
  screenNum: "1",
  location: "500,100",
  killBefore: true,
});
await launcher.launch();

Options passed to the constructor mirror the CLI flags:
  url, chromePath, killBefore, isIncognito, isKiosk, isFullscreen,
  addressBar, logDisplays, screenNum, location, size, unsafeOrigins

*******************************************************************/

/////////////////////////////////
// Imports
/////////////////////////////////

import { exec } from "node:child_process";
import util from "util";
import { fileURLToPath } from "url";
const execAsync = util.promisify(exec);

/////////////////////////////////
// Helpers
/////////////////////////////////

function logLine() {
  logPurple("====================================================");
}

function logBlue(text) {
  console.log("\x1b[36m%s\x1b[0m", text);
}

function logPurple(text) {
  console.log("\x1b[35m%s\x1b[0m", text);
}

function logBlueKV(key, value) {
  console.log(`${key}: \x1b[36m%s\x1b[0m`, value);
}

async function runCmd(cmd) {
  try {
    const { stdout, stderr } = await execAsync(cmd);
    return stdout;
  } catch (e) {
    console.error(e);
    return e;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getArg(key, defaultValue) {
  const args = process.argv.slice(2);
  const index = args.indexOf(key);
  return index !== -1 ? args[index + 1] : defaultValue;
}

/////////////////////////////////
// ChromeLauncher class
/////////////////////////////////

class ChromeLauncher {
  /**
   * @param {object} [options]
   * @param {string}  [options.url]           - URL to open. Default: http://localhost:3002
   * @param {string}  [options.chromePath]    - Path to Chrome/Chromium application folder
   * @param {boolean} [options.killBefore]    - Kill existing Chrome instances first
   * @param {boolean} [options.isIncognito]   - Launch in incognito mode
   * @param {boolean} [options.isKiosk]       - Launch in kiosk mode
   * @param {boolean} [options.isFullscreen]  - Launch in fullscreen mode
   * @param {boolean} [options.addressBar]    - Keep address bar visible
   * @param {boolean} [options.logDisplays]   - Log display info before launching
   * @param {string}  [options.screenNum]     - Screen number for multi-monitor kiosk (creates separate user-data-dir)
   * @param {string}  [options.location]      - Window position as "x,y". Default: "0,0"
   * @param {string}  [options.size]          - Window size as "w,h". Default: "800,600"
   * @param {string}  [options.unsafeOrigins] - Comma-separated list of extra unsafe origins
   */
  constructor(options = {}) {
    // Resolve each option: programmatic value takes precedence, then CLI arg, then default.
    const str = (key, flag, def) => (key in options ? options[key] : getArg(flag, def));
    const bool = (key, flag) => (key in options ? Boolean(options[key]) : getArg(flag, "false") === "true");

    this.url = str("url", "--url", "http://localhost:3002");
    this.chromePath = str("chromePath", "--chrome-path", "C:\\Program Files\\Chromium\\Application\\");
    this.killBefore = bool("killBefore", "--kill-before");
    this.isIncognito = bool("isIncognito", "--incognito");
    this.isKiosk = bool("isKiosk", "--kiosk");
    this.isFullscreen = bool("isFullscreen", "--fullscreen");
    this.addressBar = bool("addressBar", "--address-bar");
    this.logDisplays = bool("logDisplays", "--log-displays");
    this.screenNum = str("screenNum", "--screen-num", "-1");
    this.location = str("location", "--location", "0,0");
    this.windowSize = str("size", "--size", "800,600");

    // Build unsafe-origins list: any extras + the main URL in both http and ws forms
    const urlWs = this.url.replace(/^https:\/\//, "ws://").replace(/^http:\/\//, "ws://");
    const extraOrigins = str("unsafeOrigins", "--unsafe-origins", null);
    const originsArr = extraOrigins ? extraOrigins.split(",") : [];
    originsArr.push(this.url, urlWs);
    this.unsafeOriginsArr = originsArr;
    this.unsafeOriginsStr = originsArr.join(",");
  }

  logConfig() {
    logLine();
    logPurple("Config:");
    logBlueKV("Starting Chrome with URL:", this.url);
    logBlueKV("Chrome Path:", this.chromePath);
    logBlueKV("killBefore:", this.killBefore);
    logBlueKV("isIncognito:", this.isIncognito);
    logBlueKV("isKiosk:", this.isKiosk);
    logBlueKV("isFullscreen:", this.isFullscreen);
    logBlueKV("screenNum:", this.screenNum);
    logBlueKV("addressBar:", this.addressBar);
    logBlueKV("logDisplays:", this.logDisplays);
    logBlueKV("location:", this.location);
    logBlueKV("size:", this.windowSize);
    logBlueKV("Unsafe Origins:", this.unsafeOriginsArr);
  }

  buildCommand() {
    const {
      chromePath,
      url,
      isKiosk,
      addressBar,
      isFullscreen,
      screenNum,
      location,
      windowSize,
      isIncognito,
      unsafeOriginsStr,
    } = this;
    // ---- confirmed flags ----
    const confirmedFlags =
      (isKiosk ? `--kiosk ` : ``) +
      (addressBar ? `` : `--app=${url} `) + // app mode: strips address bar and browser chrome, showing just the page in a minimal window
      (isFullscreen ? `--start-fullscreen ` : ``) +
      (screenNum !== "-1" ? `--user-data-dir=c:/_chrome-kiosk-prefs/screen-${screenNum} ` : ``) +
      `--window-position=${location} ` +
      `--window-size=${windowSize} ` +
      (isIncognito ? `--incognito ` : ``) + // disables localStorage, cookies, and other persistent storage
      `--new-window ` + // opens the URL in a new browser window instead of a new tab in an existing window
      `--no-first-run ` + // skips the first-run welcome experience, setup dialogs, and startup prompts
      `--disable-pinch ` + // disables compositor-accelerated pinch-to-zoom gesture on touch screens
      `--overscroll-history-navigation=0 ` + // disables swipe-left/right gestures that navigate browser history
      `--disable-session-crashed-bubble ` + // suppresses the "Chrome didn't shut down correctly" restore prompt on startup
      `--no-default-browser-check ` + // suppresses the "set Chrome as your default browser" prompt on startup
      `--allow-file-access-from-files ` + // allows file:// URIs to access other file:// resources (normally blocked for security)
      `--allow-running-insecure-content ` + // allows HTTPS pages to load HTTP resources (mixed content)
      `--remember-cert-error-decisions ` + // persists user decisions to bypass certificate errors across sessions
      `--enable-chrome-browser-cloud-management ` + // enables Chrome Browser Cloud Management (enterprise feature); may trigger enrollment attempts if the device is not configured with a policy
      `--autoplay-policy=no-user-gesture-required ` + // allows audio/video to autoplay without requiring a user gesture first
      `--disable-gesture-requirement-for-presentation ` + // removes the gesture requirement for the Presentation API (casting/presenting to secondary screens)
      `--enable-experimental-accessibility-autoclick ` + // shows additional experimental auto-click options in Chrome's accessibility settings UI
      `--pull-to-refresh=0 ` + // disables the pull-to-refresh gesture on touch screens (0=disabled, 1=touchpad+touchscreen, 2=touchscreen only)
      `--test-type ` + // marks Chrome as running under a test harness; side-effect: suppresses the "unsupported command-line flag" warning bar
      `--ignore-certificate-errors ` + // bypasses SSL certificate errors and the "insecure site" warning for self-signed certs
      `--disable-web-security ` + // disables same-origin policy and CORS; NOTE: has no effect unless --user-data-dir is also set (only active when --screen-num is used)
      `--disable-popup-blocking ` + // disables the built-in popup blocker
      `--use-fake-ui-for-media-stream ` + // auto-approves camera/mic permission without showing the Allow/Block dialog; use with --unsafely-treat-insecure-origin-as-secure to auto-init cameras on http:// origins
      `--unsafely-treat-insecure-origin-as-secure=${unsafeOriginsStr} `; // treats listed origins as secure, enabling getUserMedia and other powerful APIs on http:// URLs

    // ---- questionable / possibly legacy flags (kept for safety, may be no-ops in modern Chrome) ----
    const legacyFlags =
      `--fast-start ` + // not found in current Chromium switch list; likely a no-op
      `--disable-application-cache ` + // HTML5 AppCache API was removed in Chrome 93; this flag is now a no-op
      `--disable-infobars ` + // removed in Chrome 65+; no longer supported
      `--reduce-security-for-testing ` + // not a recognized Chromium flag; confirmed no-op
      `--ignore-urlfetcher-cert-requests ` + // not found in current Chromium switch list; likely a no-op
      `--no-user-gesture-required ` + // redundant alias for --autoplay-policy=no-user-gesture-required above
      `--disable-translate ` + // not in current Chromium switch list; may be a no-op in modern Chrome
      `--disable-tab-switcher `; // primarily a mobile Chrome UI flag; likely a no-op on desktop

    return `"${chromePath}chrome.exe" ` + confirmedFlags + legacyFlags + `${url}`;
  }

  async kill() {
    await runCmd("taskkill /F /T /IM chrome.exe");
  }

  async start() {
    if (this.killBefore) {
      console.warn("Killing Chrome before starting a new instance.");
      await this.kill();
      await delay(500);
    }

    const cmdStr = this.buildCommand();
    logLine();
    logPurple("Launch command:");
    logBlue(cmdStr);
    logLine();

    // exec() inherits the foreground token from the calling process (so Chrome appears on top).
    // Don't await — Chrome outlives the Node process; the script exits cleanly on its own.
    execAsync(cmdStr);
  }

  /////////////////////////////////
  // PowerShell command to get screen resolutions
  /////////////////////////////////

  async getDisplayDimensions() {
    // 2-line powershell command to get physical display properties
    const psCmd =
      'powershell.exe -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::AllScreens"';
    const lines = (await runCmd(psCmd)).split("\n");

    // break output into lines and regex out the screen resolution
    const boundsLines = lines.filter((line) => line.includes("Bounds"));
    const res = boundsLines.map((line) => line.match(/Bounds\s+:\s+{X=(\d+),Y=(\d+),Width=(\d+),Height=(\d+)}/));
    const screens = res.map((match) => ({
      x: parseInt(match[1]),
      y: parseInt(match[2]),
      width: parseInt(match[3]),
      height: parseInt(match[4]),
    }));

    logLine();
    logPurple("Displays info:");
    logBlueKV("Num screens", screens.length);
    screens.forEach((screen, i) => logBlueKV(`Screen [${i + 1}]`, screen));

    // attempted to auto-set screenX and screenY based on displayIndex, but display zoom isn't taken into account, which means this is not reliable
    // screenX = screens[displayIndex].x;
    // screenY = screens[displayIndex].y;

    return screens;
  }

  async launch() {
    this.logConfig();
    if (this.logDisplays) {
      await this.getDisplayDimensions();
    }
    await this.start();
  }
}

/////////////////////////////////
// CLI entry point
/////////////////////////////////

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  new ChromeLauncher().launch();
}

export default ChromeLauncher;
