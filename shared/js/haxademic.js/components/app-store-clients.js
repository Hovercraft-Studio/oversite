import DateUtil from "../date-util.mjs";
import AppStoreTable from "./app-store-table.js";

class AppStoreClients extends AppStoreTable {
  connectedCallback() {
    super.connectedCallback();
    this.startTablePoll();
  }

  storeUpdated(key, value) {
    // TODO: flash row when sender matches client
    // TODO: add heartbeat indicator when matched heartbeat comes in
    // this.flashRow(key);
  }

  startTablePoll() {
    setInterval(async () => {
      this.getDataFromServer();
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
          </tr>
        </thead>
        <tbody>`;
    // show table data
    Object.keys(data).forEach((key) => {
      let obj = data[key];
      this.markup += `<tr data-key="${obj.key}" data-time="${
        obj.connectedTime
      }">
          <td>${obj.sender}</td>
          <td>${DateUtil.formattedTime(obj.connectedTime / 1000)}</td>
        </tr>`;
    });
    this.markup += "</tbody></table>";
  }

  render() {
    super.render();
    // flash any connections that are new (lower connectedTime than the interval)
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
