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
          <summary><b>Help</b></summary>
          <article>
            <h4>.env settings</h4>
            <p>Dashboard Config settings can be <em>overridden</em> by the user in the .env file.</p>
            <ul>
              <li><code>app_id</code> - The ID of the application.</li>
              <li><code>app_title</code> - The title of the application.</li>
              <li><code>api_url</code> - The URL of the API to post</li>
              <li><code>post_interval</code> - The interval in milliseconds to post data to the API.</li>
              <li><code>webcam_interval</code> - The interval in milliseconds to capture webcam images.</li>
            </ul>
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
