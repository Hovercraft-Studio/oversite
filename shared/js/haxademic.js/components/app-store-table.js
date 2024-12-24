class AppStoreTable extends HTMLElement {
  async connectedCallback() {
    this.markup = this.innerHTML;
    this.serverURL = _store.socketServerUrl
      .replace("ws:", "http:")
      .replace("3001", "3003")
      .replace("/ws", "");
    console.log(this.serverURL);
    await this.getDataFromServer();
    this.render();
    _store.addListener(this);
  }

  storeUpdated(key, value) {
    this.addRow(key, value);
    this.flashRow(key);
  }

  addRow(key, value) {
    // TODO: switch to list of objects so this works properly
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
      row.classList.add("flash");
      setTimeout(() => {
        row.classList.remove("flash");
      }, 1000);
    }
  }

  startTablePoll() {
    setInterval(async () => {
      this.getDataFromServer();
      this.render();
    }, 5000);
  }

  async getDataFromServer() {
    let res = await fetch(`${this.serverURL}/state`);
    let data = await res.json();

    // build table
    this.markup = "<table>";
    this.markup += `
        <thead>
          <tr>
            <td>Key</td>
            <td>Value</td>
            <td>Type</td>
            <td>Sender</td>
          </tr>
        </thead>
        <tbody>`;
    // show table data
    Object.keys(data).forEach((key) => {
      let obj = data[key];
      this.markup += `<tr data-key="${obj.key}">
          <td>${obj.key}</td>
          <td class="truncate">${obj.value}</td>
          <td>${obj.type}</td>
          <td>${obj.sender || ""}</td>
        </tr>`;
    });
    this.markup += "</tbody></table>";
  }

  css() {
    return /*css*/ `
      table {
        font-size: 0.6rem;
        width: 100%;
      }
      td {
        padding: calc(var(--pico-spacing) / 6) var(--pico-spacing);
      }
      .flash td {
        background: rgba(255,255,255,0.25);
      }
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
