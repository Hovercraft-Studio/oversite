import DateUtil from "../date-util.mjs";

class EventLogTable extends HTMLElement {
  connectedCallback() {
    this.el = this.shadow ? this.shadow : this;
    this.events = [];
    this.showHeartbeats = true;
    this.render();
    this.listenForCheckbox();
    _store.addListener(this);
    this.maxLength = parseInt(this.getAttribute("max-length")) || 10;
  }

  listenForCheckbox() {
    this.addEventListener("change", (e) => {
      if (e.target.id === "log-heartbeats") {
        this.showHeartbeats = e.target.checked;
      }
    });
  }

  storeUpdated(key, value) {
    // filter out heartbeats if checkbox is unchecked
    let isHeartbeat = key.toLowerCase().includes("heartbeat");
    if (isHeartbeat && !this.querySelector("#log-heartbeats").checked) return;

    // add to front of array
    this.events.unshift({ key, value, time: Date.now() });
    if (this.events.length > this.maxLength) this.events.pop();
    this.render();
    this.flashFirstRow();
  }

  flashFirstRow() {
    let row = this.querySelector("tbody tr");
    row.classList.add("flash");
    setTimeout(() => {
      row.classList.remove("flash");
    }, 1000);
  }

  html() {
    let checked = this.showHeartbeats ? "checked" : "";
    // build table
    this.markup = `
      <div>
        <input type="checkbox" id="log-heartbeats" ${checked} /> Log Heartbeats
      </div>

      <table>`;
    this.markup += `
      <thead>
        <tr>
          <td>Key</td>
          <td>Value</td>
          <td>Time</td>
        </tr>
      </thead>
      <tbody>
    `;
    // show table data
    this.events.forEach((el) => {
      let obj = this.events[el];
      let timeAgoMs = Date.now() - el.time;
      let val = el.value;
      if (el.key.toLowerCase().includes("heartbeat")) {
        val = DateUtil.formattedTime(val);
      }

      this.markup += `<tr data-key="${el.key}">
          <td>${el.key}</td>
          <td>${val}</td>
          <td>${Math.round(timeAgoMs / 1000)}s</td>
        </tr>`;
    });
    this.markup += "</tbody></table>";

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
