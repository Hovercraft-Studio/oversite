import DateUtil from "../date-util.mjs";

class AppStoreTable extends HTMLElement {
  async connectedCallback() {
    this.markup = this.innerHTML;
    this.initServerURL();
    await this.getDataFromServer();
    this.render();
    _store.addListener(this);
  }

  initServerURL() {
    // transform ws:// URL into http server URL, since we have that address the store, and that's the same server!
    // we just need to check for a custom http port in the URL and otherwise use the ws:// address
    let socketURL = new URL(_store.socketServerUrl);
    socketURL.protocol = "http:";
    socketURL.search = "";
    socketURL.pathname = "";
    if (document.location.hash.includes("httpPort")) {
      let urlSearch = new URLSearchParams(document.location.hash);
      socketURL.port = urlSearch.get("httpPort"); // use port from the URL if exists
    } else {
      socketURL.port = 3003; // use default server port and write to hash
      document.location.hash += `&httpPort=${socketURL.port}`;
    }
    this.serverURL = socketURL.href;
  }

  storeUpdated(key, value) {
    this.addRow(key, value);
    this.flashRow(key);
  }

  addRow(key, value) {
    // TODO: switch to list of objects so this works properly
    // TODO: check to see if row exists before adding
    // - or update existing row
    if (!this.querySelector(`tr[data-key="${key}"]`)) {
      // this.markup += `<tr data-key="${key}">
      //   <td data-key>${key}</td>
      //   <td data-value>${value}</td>
      //   <td data-type>${value.type}</td>
      //   <td data-sender>${value.sender || ""}</td>
      // </tr>`;
      this.render();
    }
  }

  flashRow(key) {
    let row = this.querySelector(`tr[data-key="${key}"]`);
    if (row) {
      row.classList.remove("flash");
      setTimeout(() => {
        row.classList.add("flash");
      }, 10);
      setTimeout(() => {
        row.classList.remove("flash");
      }, 1010);
      // row.animate(
      //   [
      //     { backgroundColor: "green" },
      //     { backgroundColor: "var(--pico-background-color)" },
      //   ],
      //   {
      //     duration: 1000,
      //     iterations: 1,
      //     fill: "both",
      //   }
      // );
    }
  }

  startTablePoll() {
    setInterval(async () => {
      this.getDataFromServer();
      this.render();
    }, 5000);
  }

  async getDataFromServer() {
    try {
      let res = await fetch(`${this.serverURL}state`);
      let data = await res.json();
      this.buildTable(data);
      console.log(data);
    } catch (error) {
      console.log("getDataFromServer() Failed to fetch data:", error);
      // Handle the error, e.g., show an error message to the user
    }
  }

  buildTable(data) {
    // build table
    this.markup = "<table>";
    this.markup += `
        <thead>
          <tr>
            <td>Key</td>
            <td>Value</td>
            <td>Type</td>
            <td>Sender</td>
            <td>Time</td>
          </tr>
        </thead>
        <tbody>`;
    // show table data
    Object.keys(data).forEach((key) => {
      let obj = data[key];
      let timeAgoMs = obj.time ? Math.round(Date.now() - obj.time) : 0;
      let val = obj.value;
      if (obj.key.toLowerCase().includes("heartbeat")) {
        val = DateUtil.formattedTime(val);
      }
      this.markup += `<tr data-key="${obj.key}">
          <td>${obj.key}</td>
          <td>${val}</td>
          <td>${obj.type}</td>
          <td>${obj.sender || ""}</td>
          <td>${DateUtil.formattedTime(timeAgoMs)}</td>
        </tr>`;
    });
    this.markup += "</tbody></table>";
  }

  css() {
    return /*css*/ `
    `;
  }

  html() {
    return /*html*/ `
      ${this.markup}
    `;
  }

  render() {
    this.innerHTML = /*html*/ `
      ${this.html()}
      <style>
        ${this.css()}
      </style>
    `;
  }

  static register() {
    customElements.define("app-store-table", AppStoreTable);
  }
}

AppStoreTable.register();

export default AppStoreTable;
