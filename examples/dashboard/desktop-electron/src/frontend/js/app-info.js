class AppInfo extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    let electronVersions = _store.get("main_config").versions;
    let infoHTML = /* html */ `
      <div>
        <details openXX="">
          <summary><b>App Info</b></summary>
          <article>
            <h3>App Versions</h3>
            <ul>
              <li>Electron: ${electronVersions.electron}</li>
              <li>Chromium: ${electronVersions.chrome}</li>
              <li>Node: ${electronVersions.node}</li>
            </ul>
          </article>
        </details>
      </div>
      <hr>
    `;
    this.innerHTML = infoHTML;
  }

  disconnectedCallback() {
    console.log("AppInfo component removed from DOM.");
  }
}

if (!customElements.get("app-info")) {
  customElements.define("app-info", AppInfo);
}

export default AppInfo;
