import DateUtil from "../date-util.mjs";

class EventLogTable extends HTMLElement {
  connectedCallback() {
    this.el = this.shadow ? this.shadow : this;
    this.events = [];
    this.render();
    _store.addListener(this);
    this.maxLength = parseInt(this.getAttribute("max-length")) || 10;
    this.startTimeUpdates();
  }

  storeUpdated(key, value) {
    // filter out heartbeats if checkbox is unchecked
    let isHeartbeat = key.toLowerCase().includes("heartbeat");
    if (isHeartbeat && !_store.get("log_heartbeats")) return;

    // add to front of array
    let rowObj = { key, value, time: Date.now() };
    this.events.unshift(rowObj);
    let tbody = this.querySelector("tbody");
    rowObj.el = this.buildRowEl(rowObj);
    tbody.insertBefore(rowObj.el, tbody.firstChild);

    // remove from end of array/table
    if (this.events.length > this.maxLength) {
      this.events.pop();
      tbody.removeChild(tbody.lastChild);
    }
    // this.render();
    this.flashFirstRow();
  }

  buildRowEl(rowObj) {
    let rowType = "";
    let val = rowObj.value;
    let timeAgoMs = Date.now() - rowObj.time;

    if (rowObj.key.toLowerCase().includes("heartbeat")) {
      val = DateUtil.formattedTime(val);
      rowType = "heartbeat";
    }

    let markup =
      /*html*/
      `<tr data-key="${rowObj.key}" data-row-type="${rowType}">
          <td>${rowObj.key}</td>
          <td>${val}</td>
          <td data-time>${Math.round(timeAgoMs / 1000)}s</td>
        </tr>`;

    return this.stringToTrElement(markup);
  }

  stringToTrElement(str) {
    let table = document.createElement("table");
    table.innerHTML = str;
    return table.querySelector("tbody").firstChild;
  }

  flashFirstRow() {
    let row = this.querySelector("tbody tr");
    row.classList.add("flash");
    setTimeout(() => {
      row.classList.remove("flash");
    }, 1000);
  }

  startTimeUpdates() {
    setInterval(() => {
      this.updateTimeAgo();
    }, 1000);
  }

  updateTimeAgo() {
    this.events.forEach((row) => {
      let timeAgoMs = row.time ? Math.round(Date.now() - row.time) : 0;
      row.el.querySelector("td[data-time]").innerHTML = `${Math.round(
        timeAgoMs / 1000
      )}s`;
    });
  }

  html() {
    let checked = this.showHeartbeats ? "checked" : "";
    // build table
    this.markup = /*html*/ `<table>
      <thead>
        <tr>
          <td>Key</td>
          <td>Value</td>
          <td>Time</td>
        </tr>
      </thead>
      <tbody></tbody>
    </table>`;

    return /*html*/ `
      ${this.markup}
    `;
  }

  css() {
    return /*css*/ `
      :host {

      }
    `;
  }

  render() {
    this.el.innerHTML = /*html*/ `
      ${this.html()}
      <style>
        ${this.css()}
      </style>
    `;
  }

  static register() {
    customElements.define("event-log-table", EventLogTable);
  }
}

EventLogTable.register();

export default EventLogTable;
