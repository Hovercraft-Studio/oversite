class AppHelp extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    let infoHTML = /* html */ `
      <div>
        <details openXX="">
          <summary><b>App Help</b></summary>
          <article>
            <h4>.env settings</h4>
            <p>These settings can be overridden by the user in the .env file.</p>
            <ul>
              <li><code>app-id</code> - The ID of the application.</li>
              <li><code>app-title</code> - The title of the application.</li>
              <li><code>api-url</code> - The URL of the API to post</li>
              <li><code>post-interval</code> - The interval in milliseconds to post data to the API.</li>
              <li><code>webcam-interval</code> - The interval in milliseconds to capture webcam images.</li>
            </ul>
            <p>If <code>app-id</code> or <code>app-title</code> is is set in .env, that will always override these user settings when app is restarted.</p>
          </article>
        </details>
      </div>
      <hr>
    `;
    this.innerHTML = infoHTML;
  }

  disconnectedCallback() {
    console.log("AppHelp component removed from DOM.");
  }
}

if (!customElements.get("app-help")) {
  customElements.define("app-help", AppHelp);
}

export default AppHelp;
