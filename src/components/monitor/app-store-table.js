import AppStore from "../../app-store/app-store-.mjs";
import DateUtil from "../../util/date-util.mjs";
import css from "./app-store-table-css.js";

class AppStoreTable extends HTMLElement {
  async connectedCallback() {
    this.markup = this.innerHTML;
    AppStore.checkStoreReady(this);
  }

  disconnectedCallback() {
    clearInterval(this.timeUpdateInterval);
    _store.removeListener(this);
    _store.removeListener(this, "persistent_state");
    this.cleanRows();
  }

  async storeIsReady() {
    this.rows = [];
    _store.addListener(this);
    _store.addListener(this, "persistent_state");
    this.addClickListeners();
    this.startTimeUpdates();
  }

  persistent_state(stateData) {
    this.buildTable(stateData);
    this.render();
  }

  addClickListeners() {
    this.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete")) {
        let key = e.target.getAttribute("data-key");
        _store.set("state_delete", key, true);
        _store.remove(key);
        this.removeRow(key);
      }
    });
  }

  storeUpdated(key, value) {
    if (!key) return;
    this.addRow(key, value);
    this.flashRow(key);
  }

  addRow(key, value) {
    if (!this.tableBuilt) return;
    // check if row exists and add or update row
    let row = this.getRowObj(key);
    if (row) {
      // update existing row
      this.updateRow(row, key, value);
      this.sortRows();
    } else {
      // create new row
      let data = _store.getData(key); // get full data from AppStoreDistributed to populate metadata columns
      if (data) {
        row = { ...data }; // copy so we don't attach el to the shared stateData object
        row.el = this.buildRowEl(row);
        this.getTBody().appendChild(row.el);
        this.rows.push(row);
        this.sortRows();
      }
    }
  }

  highlightProblems(row) {
    if (!row) return;
    let rowEl = row.el;
    let key = row.key.toLowerCase();
    let value = row.value;

    // check for 35s heartbeat timeout
    if (key.includes("_heartbeat")) {
      if (Date.now() - row.time > 35000) {
        rowEl.classList.add("error");
      } else {
        rowEl.classList.remove("error");
      }
    }

    // check for _health being bad
    if (key.includes("_health")) {
      if (value == "false" || value == false || value == "0" || value == 0) {
        rowEl.classList.add("error");
      } else {
        rowEl.classList.remove("error");
      }
    }
  }

  updateRow(updatedRow, key, newValue) {
    let obj = _store.getData(key); // get full data from AppStoreDistributed
    Object.assign(updatedRow, obj); // copy full object data to row object for sender/time/etc
    let { value, sender, type, time } = updatedRow;
    let timeAgoMs = time ? Math.round(Date.now() - updatedRow.time) : 0;
    let timeAgoFormatted = DateUtil.formattedTime(timeAgoMs);
    DateUtil.formattedTime(timeAgoMs);

    let rowEl = updatedRow.el;
    rowEl.querySelector("td[data-value]").innerHTML = value;
    rowEl.querySelector("td[data-sender]").innerHTML = sender;
    rowEl.querySelector("td[data-type]").innerHTML = type;
    rowEl.querySelector("td[data-time]").innerHTML = timeAgoFormatted;
  }

  getTBody() {
    return this.querySelector("tbody");
  }

  getRowObj(key) {
    return this.rows.find((row) => row.key === key);
  }

  removeRow(key) {
    let row = this.getRowObj(key);
    if (row) {
      row.el?.remove();
      this.rows = this.rows.filter((r) => r.key !== key);
    }
  }

  flashRow(key) {
    let row = this.getRowObj(key);
    if (row && row.el) {
      window.clearTimeout(row.timeout);
      window.clearTimeout(row.timeout2);
      row.el.classList.remove("flash");
      row.timeout = setTimeout(() => {
        row?.el?.classList.add("flash");
      }, 50);
      row.timeout2 = setTimeout(() => {
        row?.el?.classList.remove("flash");
      }, 1010);
    }
  }

  startTimeUpdates() {
    this.timeUpdateInterval = setInterval(() => this.updateTime(), 1000);
  }

  updateTime() {
    this.rows.forEach((row) => {
      let timeAgoMs = row.time ? Math.round(Date.now() - row.time) : 0;
      row.el.querySelector("td[data-time]").innerHTML = DateUtil.formattedTime(timeAgoMs);

      this.highlightProblems(row);
    });
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
    this.buildRows(data);
    // build table
    this.markup = /*html*/ `
      <table class="striped overflow-auto">
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

  cleanRows() {
    if (this.rows) {
      this.rows.forEach((row) => {
        if (row.el) {
          row.el.remove();
          row.el = null;
        }
      });
    }
    this.rows = [];
  }

  buildRows(data) {
    this.cleanRows();
    Object.keys(data).forEach((key) => {
      let rowData = data[key];
      if (rowData.key) {
        rowData.el = this.buildRowEl(rowData); // add html element to state data object
        this.rows.push(rowData);
      }
    });
    this.sortRows();
  }

  sortRows() {
    this.rows.sort((a, b) => a.key.localeCompare(b.key));

    // then re-add to dom in sorted order
    let tbody = this.getTBody();
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
    if (obj.key && obj.key.toLowerCase().includes("heartbeat")) {
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
          <span title="Delete" class="delete" data-key="${obj.key}">${this.getCrossIcon()}</span>
        </td>
      </tr>`;
    return this.stringToTrElement(markup);
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
    this.sortRows();
    this.tableBuilt = true;
  }

  static register() {
    customElements.define("app-store-table", AppStoreTable);
  }
}

AppStoreTable.register();

export default AppStoreTable;
