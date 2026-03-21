import AppStoreElement from "./app-store-element.js";

const ICONS = {
  audio: /*html*/ `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 69 52" fill="currentColor">
    <path d="M37.38 3.142v45.501c0 2.612-3.003 4.08-5.063 2.476L15.252 37.844H4.095A4.092 4.092 0 0 1 0 33.75V18.035c0-2.26 1.83-4.095 4.095-4.095h11.16L32.318.666c2.06-1.602 5.062-.133 5.062 2.476Z"/>
    <path d="M47.656 39.883a3.045 3.045 0 0 1-2.037-5.31c2.48-2.23 3.903-5.392 3.903-8.675 0-3.282-1.423-6.444-3.903-8.674a3.046 3.046 0 0 1 4.072-4.53c3.763 3.384 5.921 8.197 5.921 13.204 0 5.008-2.158 9.82-5.921 13.204-.582.524-1.31.78-2.035.78Z"/>
    <path d="M57.49 49.328a3.046 3.046 0 0 1-2.216-5.134c4.998-5.305 7.64-11.633 7.64-18.3 0-6.666-2.642-12.994-7.64-18.299a3.046 3.046 0 0 1 4.433-4.177c6.083 6.457 9.298 14.229 9.298 22.476 0 8.248-3.215 16.02-9.298 22.477-.599.635-1.407.957-2.217.957Z"/>
  </svg>`,
  brightness: /*html*/ `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 18a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4.22 4.22a1 1 0 0 1 1.42 0l.7.7a1 1 0 0 1-1.41 1.42l-.71-.7a1 1 0 0 1 0-1.42Zm14.14 14.14a1 1 0 0 1 1.42 0l.7.7a1 1 0 0 1-1.41 1.42l-.71-.7a1 1 0 0 1 0-1.42ZM2 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm18 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1ZM5.64 17.64a1 1 0 0 1 0 1.42l-.7.7a1 1 0 0 1-1.42-1.41l.7-.71a1 1 0 0 1 1.42 0ZM19.78 4.22a1 1 0 0 1 0 1.42l-.7.7a1 1 0 1 1-1.42-1.41l.7-.71a1 1 0 0 1 1.42 0Z"/>
  </svg>`,
};

class AppStoreSlider extends AppStoreElement {
  subclassInit() {
    this.input = this.el.querySelector("input");

    this.input.setAttribute("min", this.getAttribute("min") || 0);
    this.input.setAttribute("max", this.getAttribute("max") || 1);
    this.input.setAttribute("step", this.getAttribute("step") || 0.001);

    this.input.value = parseFloat(this.storeValue) || 0;

    this.input.addEventListener("input", (e) => {
      _store.set(this.storeKey, parseFloat(e.target.value), true);
    });
  }

  setStoreValue(value) {
    this.input.value = value;
  }

  getIconName() {
    for (const name of Object.keys(ICONS)) {
      if (this.hasAttribute(`icon-${name}`)) return name;
    }
    return null;
  }

  css() {
    return /*css*/ `
      app-store-slider .slider-icon-container {
        display: flex;
        align-items: center;
        gap: 1rem;
        height: 3.6rem;
      }
      app-store-slider .slider-icon-container .slider-icon {
        width: 2rem;
        flex-shrink: 0;
        display: flex;
      }
      app-store-slider .slider-icon-container .slider-label {
        flex-shrink: 0;
        width: 10rem;
        font-size: 0.85em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      app-store-slider .slider-icon-container .slider-label code {
        margin-left: 0.3rem;
      }
      app-store-slider .slider-icon-container input {
        flex-grow: 1;
        margin-bottom: 0;
      }
    `;
  }

  html() {
    const iconName = this.getIconName();
    const showValue = this.hasAttribute("show-value");
    if (iconName) {
      return /*html*/ `
        <div class="slider-icon-container">
          <div class="slider-icon">${ICONS[iconName]}</div>
          <input type="range" value="0">
        </div>
      `;
    }
    if (showValue) {
      return /*html*/ `
        <div class="slider-icon-container">
          <div class="slider-label">${this.storeKey}: <code><app-store-element key="${this.storeKey}"></app-store-element></code></div>
          <input type="range" value="0">
        </div>
      `;
    }
    return /*html*/ `
      <input type="range" value="0">
    `;
  }

  static register() {
    customElements.define("app-store-slider", AppStoreSlider);
  }
}

AppStoreSlider.register();

export default AppStoreSlider;
