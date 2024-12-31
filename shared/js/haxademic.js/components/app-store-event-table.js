import DateUtil from "../date-util.mjs";
import css from "./app-store-table-css.js";

class AppStoreEventTable extends HTMLElement {
  connectedCallback() {
    this.el = this.shadow ? this.shadow : this;
    this.events = [];
    this.render();
    _store.addListener(this);
    this.maxLength = parseInt(this.getAttribute("max-length")) || 10;
    this.startTimeUpdates();
    this.initFilters();
  }

  initFilters() {
    this.excludeKeys = [];
    this.showOnlyKeys = [];

    // handle text inputs
    this.excludeFilterInput = this.querySelector("#exclude_keys");
    this.excludeDisplay = this.querySelector(`[for="exclude_keys"] > span`);
    this.showOnlyFilterInput = this.querySelector("#show_only_keys");
    this.showOnlyDisplay = this.querySelector(`[for="show_only_keys"] > span`);
    this.excludeFilterInput.addEventListener("input", (e) => {
      this.excludeKeys = this.buildFilterList(
        this.excludeFilterInput.value,
        this.excludeDisplay
      );
      localStorage.setItem("excludeKeys", this.excludeFilterInput.value);
    });
    this.showOnlyFilterInput.addEventListener("input", (e) => {
      this.showOnlyKeys = this.buildFilterList(
        this.showOnlyFilterInput.value,
        this.showOnlyDisplay
      );
      localStorage.setItem("showOnlyKeys", this.showOnlyFilterInput.value);
    });

    // init from local storage
    this.excludeFilterInput.value = localStorage.getItem("excludeKeys") || "";
    if (this.excludeFilterInput.value.length > 0)
      this.excludeFilterInput.dispatchEvent(new Event("input"));
    this.showOnlyFilterInput.value = localStorage.getItem("showOnlyKeys") || "";
    if (this.showOnlyFilterInput.value.length > 0)
      this.showOnlyFilterInput.dispatchEvent(new Event("input"));
  }

  buildFilterList(inputStr, displayEl) {
    // build filter array
    let keysList = [];
    if (inputStr.length > 0) {
      keysList = inputStr.trim().split(" ");
    } else {
      keysList = [];
    }
    // ensure valid filters - no empty strings
    keysList = keysList.map((el) => el.trim()).filter((el) => el.length > 0);
    // show filters list as tags
    displayEl.innerHTML = keysList
      .map((el) => {
        return `<kbd>${el}</kbd>`;
      })
      .join(" ");
    return keysList;
  }

  filterEvent(key) {
    // filter out keys if they're in the exclude list
    let excludeMatched = this.excludeKeys.find((excludeKey) =>
      key.toLowerCase().includes(excludeKey)
    );
    if (excludeMatched) return true;

    // filter out keys if they're not in the show-only list
    if (this.showOnlyKeys.length > 0) {
      let showOnlyMatch = this.showOnlyKeys.find((showOnlyKey) =>
        key.toLowerCase().includes(showOnlyKey)
      );
      if (!showOnlyMatch) return true;
    }

    return false;
  }

  storeUpdated(key, value) {
    // filter out heartbeats if checkbox is unchecked
    if (this.filterEvent(key)) return;

    // add to front of array
    let rowObj = { key, value, time: Date.now() };
    this.events.unshift(rowObj);
    let tbody = this.querySelector("tbody");
    rowObj.el = this.buildRowEl(rowObj);
    tbody.insertBefore(rowObj.el, tbody.firstChild);

    // remove from end of array/table
    if (this.events.length > this.maxLength) {
      let removedEvent = this.events.pop();
      removedEvent.el.remove();
      removedEvent.el = null;
      removedEvent = null;
    }

    // animate new event
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
    this.markup =
      /*html*/
      `<nav class="grid filters">
        <label for="exclude_keys">Exclude Filters: <span class="small">(space-separated)</span>
          <input type="text" id="exclude_keys" name="exclude_keys" placeholder="Exclude keys" aria-invalid="true">
        </label>
        <label for="show_only_keys">Show only filters: <span class="small">(space-separated)</span>
          <input type="text" id="show_only_keys" name="show_only_keys" placeholder="Show only keys" aria-invalid="false">
        </label>
      </nav>
      <table>
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
        ${css}
        ${this.css()}
      </style>
    `;
  }

  static register() {
    customElements.define("app-store-event-table", AppStoreEventTable);
  }
}

AppStoreEventTable.register();

export default AppStoreEventTable;
