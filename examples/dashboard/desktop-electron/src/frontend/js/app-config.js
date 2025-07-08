class AppConfig extends HTMLElement {
  async connectedCallback() {
    this.render();
  }

  envVarLog() {
    let envProps = _store.get("envProps") || {};
    if (!envProps || Object.keys(envProps).length === 0) {
      return "No environment variables loaded.";
    }
    return Object.entries(envProps)
      .map(([key, value]) => `<li>${key} = <code>${value}</code></li>`)
      .join("");
  }

  async render() {
    let html = /* html */ `
      <div>
        <details openXX="">
          <summary><b>.env</b></summary>
          <article>
            <p>Loaded from disk:</p>
            <ul>
              ${this.envVarLog()}
            </ul>
          </article>
        </details>
      </div>
      <hr>
    `;
    this.innerHTML = html;
  }
}

if (!customElements.get("app-config")) {
  customElements.define("app-config", AppConfig);
}

export default AppConfig;
