import DateUtil from "../date-util.mjs";
import AppStoreTable from "./app-store-table.js";

class AppStoreClients extends AppStoreTable {
  connectedCallback() {
    super.connectedCallback();
    this.startTablePoll();
  }

  storeUpdated(key, value) {
    // flash heartbeat indicator when matched heartbeat comes in
    let isHeartbeat = key.toLowerCase().includes("heartbeat");
    if (isHeartbeat) this.flashHeartbeats(key);
  }

  async startTablePoll() {
    // give a moment for websocket to connect for initial list
    setTimeout(async () => {
      await this.getDataFromServer();
      this.render();
    }, 500);
    // then start polling
    setInterval(async () => {
      await this.getDataFromServer();
      this.render();
    }, 5000);
  }

  async getDataFromServer() {
    try {
      let res = await fetch(`${this.serverURL}clients`);
      let data = await res.json();
      this.buildTable(data);
    } catch (error) {
      console.log("getDataFromServer() Failed to fetch data:", error);
    }
  }

  buildTable(data) {
    // build table
    this.markup = "<table>";
    this.markup += `
        <thead>
          <tr>
            <td>Client</td>
            <td>Connected Time</td>
            <td>Heartbeat</td>
          </tr>
        </thead>
        <tbody>`;
    // show table data
    Object.keys(data).forEach((key) => {
      let obj = data[key];
      this.markup += `<tr data-key="${obj.sender}" data-time="${
        obj.connectedTime
      }">
          <td>${obj.sender}</td>
          <td>${DateUtil.formattedTime(obj.connectedTime)}</td>
          <td class="heartbeat">❤️</td>
        </tr>`;
    });
    this.markup += "</tbody></table>";
  }

  render() {
    super.render();
    this.flashNewConnections();
    // flash any connections that are new (lower connectedTime than the interval)
  }

  flashHeartbeats(heartbeatKey) {
    let rows = this.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      let key = row.getAttribute("data-key");
      if (heartbeatKey.includes(key.toLowerCase())) {
        row.classList.add("heartbeat");
        setTimeout(() => {
          row.classList.remove("heartbeat");
        }, 1000);
      }
    });
  }

  flashNewConnections() {
    let rows = this.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      let time = parseInt(row.getAttribute("data-time"));
      if (time < 5000) {
        row.classList.add("flash");
        setTimeout(() => {
          row.classList.remove("flash");
        }, 1000);
      }
    });
  }

  static register() {
    customElements.define("app-store-clients", AppStoreClients);
  }
}

AppStoreClients.register();

export default AppStoreClients;
