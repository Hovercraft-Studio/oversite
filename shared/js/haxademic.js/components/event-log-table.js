import DateUtil from "../date-util.mjs";

class EventLogTable extends HTMLElement {
  connectedCallback() {
    this.el = this.shadow ? this.shadow : this;
    this.events = [];
    this.render();
    _store.addListener(this);
    this.maxLength = parseInt(this.getAttribute("max-length")) || 10;
  }

  storeUpdated(key, value) {
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
    // build table
    this.markup = "<table>";
    this.markup += `
        <thead>
          <tr>
            <td>Key</td>
            <td>Value</td>
            <td>Time Ago</td>
          </tr>
        </thead>
        <tbody>`;
    // show table data
    this.events.forEach((el) => {
      let obj = this.events[el];
      let secondsAgo = Math.round((Date.now() - el.time) / 1000);
      let val = el.value;
      if (el.key.toLowerCase().includes("heartbeat")) {
        val = DateUtil.formattedTime(val);
      }

      this.markup += `<tr data-key="${el.key}">
          <td>${el.key}</td>
          <td>${val}</td>
          <td>${secondsAgo}s</td>
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
