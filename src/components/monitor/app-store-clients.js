import AppStore from "../../app-store/app-store-.mjs";
import DateUtil from "../../util/date-util.mjs";
import css from "./app-store-table-css.js";

class AppStoreClients extends HTMLElement {
  async connectedCallback() {
    this.markup = this.innerHTML;
    AppStore.checkStoreReady(this);
  }

  async storeIsReady() {
    this.rows = [];
    _store.addListener(this);
    _store.addListener(this, "clients");
    this.startTimeUpdates();
  }

  clients(data) {
    this.buildTable(data);
    this.render();
  }

  getHeartIcon() {
    return /*html*/ `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path fill="#000" d="M12 5.881C12.981 4.729 14.484 4 16.05 4 18.822 4 21 6.178 21 8.95c0 3.3992-3.055 6.1695-7.6836 10.3667l-.0114.0103L12 20.515l-1.305-1.179-.0355-.0323C6.0444 15.1098 3 12.3433 3 8.95 3 6.178 5.178 4 7.95 4c1.566 0 3.069.729 4.05 1.881Z"/>
      </svg>
    `;
  }

  storeUpdated(key, value) {
    let isHeartbeat = key.toLowerCase().includes("heartbeat");
    if (isHeartbeat) this.flashHeartbeats(key);
  }

  buildTable(data) {
    this.rows = Object.keys(data).map((key) => {
      let obj = data[key];
      return {
        sender: obj.sender,
        startTime: Date.now() - obj.connectedTime, // compute absolute start time from elapsed ms
      };
    })
    .sort((a, b) => a.sender.localeCompare(b.sender));

    this.markup = /*html*/ `<table>
        <thead>
          <tr>
            <td>Client</td>
            <td>Connected Time</td>
            <td>Heartbeat</td>
          </tr>
        </thead>
        <tbody>
          ${this.rows
            .map(
              (row) => `<tr data-key="${row.sender}">
            <td>${row.sender}</td>
            <td data-time></td>
            <td class="heartbeat"><span>${this.getHeartIcon()}</span></td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }

  startTimeUpdates() {
    setInterval(() => this.updateTime(), 1000);
  }

  updateTime() {
    this.rows.forEach((row) => {
      let el = this.querySelector(`tr[data-key="${row.sender}"] td[data-time]`);
      if (el) el.innerHTML = DateUtil.formattedTime(Date.now() - row.startTime);
    });
  }

  flashHeartbeats(heartbeatKey) {
    let rows = this.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      let key = row.getAttribute("data-key");
      if (heartbeatKey.includes(key.toLowerCase())) {
        row.classList.add("heartbeat");
        setTimeout(() => row.classList.remove("heartbeat"), 1000);
      }
    });
  }

  flashNewConnections() {
    this.rows.forEach((row) => {
      if (Date.now() - row.startTime < 5000) {
        let el = this.querySelector(`tr[data-key="${row.sender}"]`);
        if (el) {
          el.classList.add("flash");
          setTimeout(() => el.classList.remove("flash"), 1000);
        }
      }
    });
  }

  render() {
    this.innerHTML = this.markup + `<style>${css}</style>`;
    this.flashNewConnections();
  }

  static register() {
    customElements.define("app-store-clients", AppStoreClients);
  }
}

AppStoreClients.register();

export default AppStoreClients;
