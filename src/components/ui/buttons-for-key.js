import AppStore from "../../app-store/app-store-.mjs";

class ButtonsForKey extends HTMLElement {
  connectedCallback() {
    this.sections = [];
    this.innerContent = this.innerHTML;


    AppStore.checkStoreReady(this);
  }

  storeIsReady() {
    // check store for initial value
    this.momentary = this.hasAttribute("momentary");
    this.storeKey = this.getAttribute("key"); // listens for buttons array
    this.storeKeyOut = this.storeKey.replace("_buttons", ""); // key to set on button click

    // attribute values take initial priority, then check store
    let valuesAttr = this.getAttribute("values");
    if (valuesAttr) {
      this.sections = valuesAttr.split(",").map((s) => s.trim()).filter(Boolean);
    }
    const initialValue = _store.get(this.storeKey);
    if (initialValue) {
      this.sections = JSON.parse(initialValue);
    }
    this.outerDetails = this.closest("details");

    this.render();

    // listen for new buttons
    _store.addListener(this);
  }


  disconnectedCallback() {}

  storeUpdated(key, value) {
    if (key == this.storeKey) {
      this.sections = JSON.parse(value);
      this.render();
    }
  }

  show() {
    if (this.outerDetails) {
      this.outerDetails.style.display = "block";
    }
  }

  hide() {
    if (this.outerDetails) {
      this.outerDetails.style.display = "none"; // close dropdown if open
    }
  }

  buildButton(sectionVal) {
    let btn = document.createElement("app-store-button");
    btn.setAttribute("key", this.storeKeyOut);
    btn.setAttribute("value", sectionVal);
    if (this.momentary) btn.setAttribute("momentary", "");
    btn.textContent = sectionVal.toUpperCase();
    return btn.outerHTML;
  }

  css() {
    return /*css*/ `
      :host {
        display: block;
        width: 100%;
      }

      .sections-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
        justify-content: flex-start;
      }

      .sections-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;

        button {
          width: 100%;
        }
      }

      .sections-grid app-store-button {
        flex: 0 0 auto;
      }

      @media (max-width: 640px) {
        .sections-grid {
          gap: 0.5rem;
        }
      }

      :is(button, [type="button"], [type="submit"], [type="reset"], [role="button"], [type="file"]::file-selector-button) {
        letter-spacing: 0.02em;
        font-size: 0.7rem;
      }

    `;
  }

  html() {
    let htmlStr = this.sections.map((sectionVal) => this.buildButton(sectionVal)).join("");
    if (this.sections.length === 0) {
      htmlStr = "No sections found.";
      this.hide();
    } else {
      this.show();
    }
    return /*html*/ `
      <div class="sections-grid">
        ${htmlStr}
      </div>
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
    customElements.define("buttons-for-key", ButtonsForKey);
  }
}

ButtonsForKey.register();
export default ButtonsForKey;
