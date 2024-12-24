class EventLogTable extends HTMLElement {
  connectedCallback() {
    this.el = this.shadow ? this.shadow : this;
    this.events = [];
    this.render();
    _store.addListener(this);
    this.maxLength = parseInt(this.getAttribute("max-length")) || 10;
  }

  storeUpdated(key, value) {
    // TODO: add timestamp and show how long ago it was
    this.events.unshift({ key, value, time: Date.now() });
    if (this.events.length > this.maxLength) this.events.pop();
    this.render();
  }

  html() {
    // build table
    this.markup = "<table>";
    this.markup += `
        <thead>
          <tr>
            <td>Key</td>
            <td>Value</td>
            <td>Time</td>
          </tr>
        </thead>
        <tbody>`;
    // show table data
    this.events.forEach((el) => {
      let obj = this.events[el];
      this.markup += `<tr data-key="${el.key}">
          <td>${el.key}</td>
          <td class="truncate">${el.value}</td>
          <td>${Math.round((Date.now() - el.time) / 1000)}s</td>
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
        box-shadow: 0 0 20px 0 rgba(0,0,0,0.5);
        background: rgba(0,0,0,0.5);
        display: block;
        padding: 0.5rem 2rem;
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
