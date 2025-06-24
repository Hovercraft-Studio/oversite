class AppConfig extends HTMLElement {
  async connectedCallback() {
    await this.readEnv();
    this.render();
  }

  async readEnv() {
    this.envProps = {};
    let data = await Neutralino.filesystem.readFile("./.env");
    if (data) {
      console.log("INFO: .env file loaded successfully.");
      console.log(`Content: ${data}`);
      // Parse the .env file content and set global variables
      data.split("\n").forEach((line) => {
        if (line && !line.startsWith("#")) {
          let [key, value] = line.split("=");
          if (key && value) {
            this.envProps[key.trim()] = value.trim();
          }
        }
      });
    }
    console.log("INFO: Environment variables loaded:");
    window.envProps = this.envProps; // Make envProps globally accessible
    // this.render(); // Re-render to show the loaded environment variables
    // Log the loaded environment variables
  }

  envVarLog() {
    if (!this.envProps || Object.keys(this.envProps).length === 0) {
      return "No environment variables loaded.";
    }
    return Object.entries(this.envProps)
      .map(([key, value]) => `<li>${key} = <code>${value}</code></li>`)
      .join("");
  }

  async render() {
    let html = `
      <div>
        <article>
          <h3>Config</h3>
          <p>.env</p>
          <ul>
            ${this.envVarLog()}
          </ul>
        </article>
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
