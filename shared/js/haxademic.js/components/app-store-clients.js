import DateUtil from "../date-util.mjs";
import css from "./app-store-table-css.js";

class AppStoreClients extends HTMLElement {
  async connectedCallback() {
    this.markup = this.innerHTML;
    this.serverURL = _store.get("server_url");
    await this.getDataFromServer();
    this.render();
    _store.addListener(this);
    // this.startTimeUpdates();
    this.startTablePoll();
  }

  getHeartIcon() {
    return /*html*/ `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path fill="#000" d="M12 5.881C12.981 4.729 14.484 4 16.05 4 18.822 4 21 6.178 21 8.95c0 3.3992-3.055 6.1695-7.6836 10.3667l-.0114.0103L12 20.515l-1.305-1.179-.0355-.0323C6.0444 15.1098 3 12.3433 3 8.95 3 6.178 5.178 4 7.95 4c1.566 0 3.069.729 4.05 1.881Z"/>
      </svg>
    `;
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
      let res = await fetch(`${this.serverURL}api/state/clients`);
      let data = await res.json();
      this.buildTable(data);
    } catch (error) {
      console.log("getDataFromServer() Failed to fetch data:", error);
    }
  }

  buildTable(data) {
    // build table
    this.markup = /*html*/ `<table>
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
      this.markup += `<tr data-key="${obj.sender}" data-time="${obj.connectedTime}">
          <td>${obj.sender}</td>
          <td>${DateUtil.formattedTime(obj.connectedTime)}</td>
          <td class="heartbeat"><span>${this.getHeartIcon()}</span></td>
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

  render() {
    this.innerHTML = this.markup + `<style>${css}</style>`;
  }

  static register() {
    customElements.define("app-store-clients", AppStoreClients);
  }
}

AppStoreClients.register();

export default AppStoreClients;
