import "/js/src/app-config.js";
import "/js/src/system-info-display.js";
import "/js/src/dashboard-poster-view.js";
import "/js/src/webcam-feed.js";

class MainApplication extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Initialize Neutralino. This should be called early.
    Neutralino.init();

    // Register Neutralino global event listeners
    // Ensure 'this' context is correct for the handler methods
    Neutralino.events.on("trayMenuItemClicked", this.onTrayMenuItemClicked.bind(this));
    Neutralino.events.on("windowClose", this.onWindowClose.bind(this));

    // Conditional tray setup
    // if (NL_OS !== "Darwin") {
    // TODO: Fix https://github.com/neutralinojs/neutralinojs/issues/615
    this.setTray();
    // }

    // Render the main UI of the application
    this.render();
  }

  render() {
    // Define the HTML structure for the main application
    this.innerHTML = `
      <header>
        <h1>
          Dashboard Poster
          <button id="reload" style="float:right;" onclick="location.reload();">⟳</button>
        </h1>
      </header>
      <main>
        <app-config></app-config>
        <dashboard-poster></dashboard-poster>
        <webcam-feed></webcam-feed>
        <system-info-display></system-info-display>
      </main>
      <footer>
        <p>App Version: ${NL_VERSION} | Client: ${NL_CVERSION}</p>
      </footer>
    `;
  }

  /*
        Function to set up a system tray menu.
    */
  setTray() {
    if (NL_MODE !== "window") {
      console.log("INFO: Tray menu is only available in the window mode.");
      return;
    }
    let tray = {
      icon: "/resources/icons/trayIcon.png",
      menuItems: [
        { id: "VERSION", text: "Get version" },
        { id: "SCREENSHOT", text: "Screenshot" },
        { id: "SEP", text: "-" },
        { id: "QUIT", text: "Quit" },
      ],
    };
    Neutralino.os.setTray(tray);
  }

  /*
        Function to handle click events on the tray menu items.
    */
  onTrayMenuItemClicked(event) {
    switch (event.detail.id) {
      case "VERSION":
        Neutralino.os.showMessageBox(
          "Version information",
          `Neutralinojs server: v${NL_VERSION} | Neutralinojs client: v${NL_CVERSION}`
        );
        break;
      case "SCREENSHOT":
        // Darwin: screencapture ~/Desktop/picture.png
        let screenCaptureCommand =
          NL_OS === "Darwin" ? "screencapture ~/Desktop/screenshot.png" : "screenshot ~/Desktop/screenshot.png";
        Neutralino.os.execCommand("screencapture ~/Desktop/screenshot.png").then((result) => {
          if (result.exitCode === 0) {
            Neutralino.os.showMessageBox("Screenshot", "Screenshot saved to your Desktop as screenshot.png");
          } else {
            Neutralino.os.showMessageBox("Error", `Failed to take screenshot: ${result.stdErr}`);
          }
        });
        break;
      case "QUIT":
        Neutralino.app.exit();
        break;
    }
  }

  /*
        Function to handle the window close event.
    */
  onWindowClose() {
    Neutralino.app.exit();
  }

  disconnectedCallback() {
    // Clean up if necessary, e.g., remove global event listeners
    // Neutralino.events.off("trayMenuItemClicked", this.onTrayMenuItemClicked.bind(this));
    // Neutralino.events.off("windowClose", this.onWindowClose.bind(this));
    // Note: .bind(this) creates a new function reference, so for 'off' to work,
    // you'd need to store the bound function reference.
    console.log("MainApplication component removed from DOM.");
  }
}

// Define the custom element for the main application
if (!customElements.get("main-application")) {
  customElements.define("main-application", MainApplication);
}
