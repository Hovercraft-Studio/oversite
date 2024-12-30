import DateUtil from "../date-util.mjs";
import css from "./app-store-table-css.js";

class AppStoreTable extends HTMLElement {
  async connectedCallback() {
    this.markup = this.innerHTML;
    this.serverURL = _store.get("server_url");
    await this.getDataFromServer();
    this.render();
    _store.addListener(this);
    this.addClickListeners();
    this.startTimeUpdates();
  }

  addClickListeners() {
    this.addEventListener("click", async (e) => {
      if (e.target.classList.contains("delete")) {
        let key = e.target.getAttribute("data-key");
        try {
          let res = await fetch(`${this.serverURL}wipe/${key}`);
          let data = await res.json();
          this.getDataFromServer();
        } catch (error) {
          console.log("Failed to wipe key:", error);
        }
      }
    });
  }

  storeUpdated(key, value) {
    this.addRow(key, value);
    this.flashRow(key);
  }

  addRow(key, value) {
    if (!this.tableBuilt) return;
    // check if row exists and add or update row
    let row = this.getRowObj(key);
    if (!row) {
      // add new row
      let obj = _store.getData(key); // get full data from AppStoreDistributed to we can populate metadata columns besides key/value
      if (!!obj) {
        let tbody = this.querySelector("tbody");
        obj.el = this.buildRowEl(obj);
        tbody.appendChild(obj.el);
        this.rows.push(obj);
        this.sortRows();
      }
    } else {
      // update existing row
      let updatedRow = this.getRowObj(key);
      if (updatedRow) this.updateRow(updatedRow, key, value);
      this.sortRows();
    }
  }

  updateRow(updatedRow, key, newValue) {
    let obj = _store.getData(key); // get full data from AppStoreDistributed
    Object.assign(updatedRow, obj);
    let { value, sender, type, time } = updatedRow;
    let timeAgoMs = time ? Math.round(Date.now() - updatedRow.time) : 0;
    updatedRow.el.querySelector("td[data-value]").innerHTML = value;
    updatedRow.el.querySelector("td[data-sender]").innerHTML = sender;
    updatedRow.el.querySelector("td[data-type]").innerHTML = type;
    updatedRow.el.querySelector("td[data-time]").innerHTML =
      DateUtil.formattedTime(timeAgoMs);
  }

  getRowObj(key) {
    return this.rows.find((row) => row.key === key);
  }

  flashRow(key) {
    let row = this.getRowObj(key);
    if (row && row.el) {
      window.clearTimeout(row.timeout);
      window.clearTimeout(row.timeout2);
      row.el.classList.remove("flash");
      row.timeout = setTimeout(() => {
        row.el.classList.add("flash");
      }, 50);
      row.timeout2 = setTimeout(() => {
        row.el.classList.remove("flash");
      }, 1010);
    }
  }

  startTablePoll() {
    setInterval(async () => {
      this.getDataFromServer();
      this.render();
    }, 5000);
  }

  startTimeUpdates() {
    setInterval(() => {
      this.updateTimeAgo();
    }, 1000);
  }

  updateTimeAgo() {
    this.rows.forEach((row) => {
      let timeAgoMs = row.time ? Math.round(Date.now() - row.time) : 0;
      row.el.querySelector("td[data-time]").innerHTML =
        DateUtil.formattedTime(timeAgoMs);
    });
  }

  async getDataFromServer() {
    try {
      let res = await fetch(`${this.serverURL}state`);
      let data = await res.json();
      this.buildTable(data);
    } catch (error) {
      console.log("getDataFromServer() Failed to fetch data:", error);
    }
  }

  stringToElement(str) {
    let doc = new DOMParser().parseFromString(str, "text/html");
    return doc.body.firstElementChild;
  }

  stringToTrElement(str) {
    let table = document.createElement("table");
    table.innerHTML = str;
    return table.querySelector("tbody").firstChild;
  }

  buildTable(data) {
    this.removeRowsFromTable();
    this.buildRows(data);
    // build table
    this.markup = /*html*/ `
      <table class="striped">
        <thead>
          <tr>
            <td>Key</td>
            <td>Value</td>
            <td>Type</td>
            <td>Sender</td>
            <td>Time Ago</td>
            <td>Actions</td>
          </tr>
        </thead>
        <tbody></tbody>
      </table>`;
  }

  removeRowsFromTable() {
    let tbody = this.querySelector("tbody");
    if (tbody) {
      while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
      }
    }
  }

  buildRows(data) {
    this.rows = [];
    Object.keys(data).forEach((key) => {
      let obj = data[key];
      obj.el = this.buildRowEl(obj); // add html element to state data object
      this.rows.push(obj);
    });
    this.sortRows();
  }

  sortRows() {
    // sort by sender then key
    this.rows.sort((a, b) => {
      if (a.sender === b.sender) {
        return a.key.localeCompare(b.key);
      }
      return a.sender.localeCompare(b.sender);
    });

    // then re-add to dom in sorted order
    let tbody = this.querySelector("tbody");
    if (tbody)
      this.rows.forEach((row) => {
        tbody.appendChild(row.el);
      });
  }

  getCrossIcon() {
    return /*html*/ `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <path d="m18.8 16 5.5-5.5c.8-.8.8-2 0-2.8-.3-.4-.8-.7-1.3-.7s-1 .2-1.4.6L16 13.2l-5.5-5.5c-.8-.8-2.1-.8-2.8 0-.4.3-.7.8-.7 1.4s.2 1 .6 1.4l5.5 5.5-5.5 5.5c-.3.4-.6.9-.6 1.5 0 .5.2 1 .6 1.4.4.4.9.6 1.4.6.5 0 1-.2 1.4-.6l5.5-5.5 5.5 5.5c.8.8 2.1.8 2.8 0 .8-.8.8-2.1 0-2.8L18.8 16z"/>
      </svg>
    `;
  }

  buildRowEl(obj) {
    let timeAgoMs = obj.time ? Math.round(Date.now() - obj.time) : 0;
    let rowType = "";
    let val = obj.value;

    if (obj.key.toLowerCase().includes("heartbeat")) {
      val = DateUtil.formattedTime(val);
      rowType = "heartbeat";
    }
    let markup =
      /*html*/
      `<tr data-key="${obj.key}" data-row-type="${rowType}">
        <td>${obj.key}</td>
        <td data-value>${val}</td>
        <td data-type>${obj.type}</td>
        <td data-sender>${obj.sender || ""}</td>
        <td data-time>${DateUtil.formattedTime(timeAgoMs)}</td>
        <td class="row-actions">
          <span title="Delete" class="delete" data-key="${
            obj.key
          }">${this.getCrossIcon()}</span>
        </td>
      </tr>`;
    return this.stringToTrElement(markup);
  }

  insertTableRows() {
    let tbody = this.querySelector("tbody");
    this.rows.forEach((row) => {
      tbody.appendChild(row.el);
    });
  }

  getRowEl(key) {
    return this.querySelector(`tr[data-key="${key}"]`);
  }

  css() {
    return /*css*/ `
    `;
  }

  render() {
    this.innerHTML = /*html*/ `
      ${this.markup}
      <style>
        ${css}
        ${this.css()}
      </style>
    `;
    this.insertTableRows();
    this.tableBuilt = true;
  }

  static register() {
    customElements.define("app-store-table", AppStoreTable);
  }
}

AppStoreTable.register();

export default AppStoreTable;
