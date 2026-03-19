import AppStoreElement from "./app-store-element.js";

/**
 * AppStoreDropdown - A <select> dropdown with two-way AppStore binding.
 *
 * Options can be provided three ways (later calls replace earlier data):
 *   1. `options` attribute — JSON array of strings or {title, value} objects
 *   2. `setOptions(list)` — same formats accepted programmatically
 *   3. Inline <option> elements in the light DOM (captured before first render)
 *
 * When a selection is made the chosen value is broadcast via _store.set().
 * When the store key updates externally the <select> tracks the new value.
 *
 * Usage:
 *   <app-store-dropdown key="scene" options='["A","B","C"]'></app-store-dropdown>
 *   <app-store-dropdown key="scene" options='[{"title":"Scene A","value":"a"}]'></app-store-dropdown>
 *   <app-store-dropdown key="scene" value="b">
 *     <option value="a">Scene A</option>
 *     <option value="b">Scene B</option>
 *   </app-store-dropdown>
 */
class AppStoreDropdown extends AppStoreElement {
  subclassInit() {
    this.select = this.el.querySelector("select");

    // If an `options` attribute was provided, parse and apply it
    const optionsAttr = this.getAttribute("options");
    if (optionsAttr) {
      try {
        this.setOptions(JSON.parse(optionsAttr));
      } catch (_) {
        // invalid JSON — leave any inline <option> elements as-is
      }
    }

    // Select the current store value (or the initial value attribute)
    const initial = _store.get(this.storeKey) ?? this.storeValue;
    if (initial != null) this.select.value = String(initial);

    this.select.addEventListener("change", (e) => {
      _store.set(this.storeKey, e.target.value, true);
    });
  }

  /**
   * Set the dropdown options programmatically.
   * @param {Array<string|{title:string, value:string}>} list
   */
  setOptions(list) {
    if (!Array.isArray(list)) return;
    this._options = list;
    this._buildOptions();
  }

  _buildOptions() {
    if (!this.select) return;
    const current = this.select.value;
    this.select.innerHTML = "";
    for (const item of this._options) {
      const opt = document.createElement("option");
      if (typeof item === "object" && item !== null) {
        opt.value = item.value ?? item.title ?? "";
        opt.textContent = item.title ?? item.value ?? "";
      } else {
        opt.value = String(item);
        opt.textContent = String(item);
      }
      this.select.appendChild(opt);
    }
    // Restore previous selection if still present, else keep first
    if (current && [...this.select.options].some((o) => o.value === current)) {
      this.select.value = current;
    }
  }

  setStoreValue(value) {
    if (this.select) this.select.value = String(value);
  }

  css() {
    return /*css*/ ``;
  }

  html() {
    return /*html*/ `
      <select>${this.initialHTML}</select>
    `;
  }

  static register() {
    customElements.define("app-store-dropdown", AppStoreDropdown);
  }
}

AppStoreDropdown.register();

export default AppStoreDropdown;
