/**
 * Theme toggle button — switches between light and dark Pico CSS color schemes.
 * Sets `data-theme` on `<html>` and persists the choice to localStorage.
 *
 * Usage:
 *   <theme-toggle></theme-toggle>
 *
 * SVG icon source: https://toggles.dev
 */

class ThemeToggle extends HTMLElement {
  static NODE_NAME = "theme-toggle";
  static GLOBAL_CSS = true;
  static LOCAL_STORAGE_KEY = "pico-theme";

  /////////////////////////////////////////////////////////
  // Lifecycle
  /////////////////////////////////////////////////////////

  connectedCallback() {
    this.render();
    this.button = this.querySelector("button");
    this.button.addEventListener("click", this.toggle.bind(this));
    this.applyTheme(this.currentTheme());
  }

  disconnectedCallback() {
    this.button?.removeEventListener("click", this.toggle.bind(this));
  }

  /////////////////////////////////////////////////////////
  // Theme logic
  /////////////////////////////////////////////////////////

  currentTheme() {
    const stored = localStorage.getItem(ThemeToggle.LOCAL_STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  toggle() {
    const next = this.currentTheme() === "dark" ? "light" : "dark";
    this.applyTheme(next);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(ThemeToggle.LOCAL_STORAGE_KEY, theme);
    this.updateIcon(theme);
  }

  updateIcon(theme) {
    const svg = this.querySelector("svg");
    if (svg) {
      svg.classList.toggle("moon", theme === "dark");
    }
  }

  /////////////////////////////////////////////////////////
  // CSS & Rendering
  /////////////////////////////////////////////////////////

  static css = /*css*/ `
    theme-toggle {
      --theme-toggle-duration: 0.5s;
      display: inline-block;
      position: fixed;
      top: 3.3rem;
      right: 0.9rem;

      button {
        all: unset;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        color: var(--pico-primary);
        line-height: 1;
      }

      button:hover {
        color: var(--pico-primary-hover);
      }

      button:focus-visible {
        outline: 2px solid var(--pico-primary-focus);
        outline-offset: 2px;
        border-radius: 4px;
      }

      svg {
        display: inline-block;
        width: auto;
        height: 1.25rem;
        vertical-align: middle;
        overflow: hidden;
        transform: translateY(-0.0625rem);
      }

      /* clipPath crescent morph */
      svg :first-child path {
        transition-duration: calc(var(--theme-toggle-duration) * 0.6);
        transition-property: transform, d;
        transition-timing-function: cubic-bezier(0, 0, 0.5, 1);
      }

      svg.moon :first-child path {
        d: path("M-9 3h25a1 1 0 0017 13v30H0Z");
        transition-delay: calc(var(--theme-toggle-duration) * 0.4);
        transition-timing-function: cubic-bezier(0, 0, 0, 1.25);
      }

      /* circle + rays shared transition */
      svg g circle,
      svg g path {
        transform-origin: center;
        transition: transform calc(var(--theme-toggle-duration) * 0.65) cubic-bezier(0, 0, 0, 1.25) calc(var(--theme-toggle-duration) * 0.35);
      }

      /* moon state: enlarge circle, shrink rays */
      svg.moon g circle {
        transform: scale(1.4);
        transition-delay: 0s;
      }

      svg.moon g path {
        transform: scale(0.75);
        transition-delay: 0s;
      }
    }
  `;

  static addGlobalStyles() {
    if (!ThemeToggle.GLOBAL_CSS) return;
    const styleId = ThemeToggle.NODE_NAME + "-style";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = ThemeToggle.css;
    document.head.appendChild(style);
  }

  html() {
    const isDark = this.currentTheme() === "dark";
    const label = isDark ? "Turn off dark mode" : "Turn on dark mode";
    return /*html*/ `
      <button aria-label="${label}" title="${label}">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 32 32"
          fill="currentColor"
          class="${isDark ? "moon" : ""}"
        >
          <clipPath id="theme-toggle-cutout">
            <path d="M0-11h25a1 1 0 0017 13v30H0Z" />
          </clipPath>
          <g clip-path="url(#theme-toggle-cutout)">
            <circle cx="16" cy="16" r="8.4" />
            <path d="M18.3 3.2c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3S14.7.9 16 .9s2.3 1 2.3 2.3zm-4.6 25.6c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3-1 2.3-2.3 2.3-2.3-1-2.3-2.3zm15.1-10.5c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zM3.2 13.7c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3S.9 17.3.9 16s1-2.3 2.3-2.3zm5.8-7C9 7.9 7.9 9 6.7 9S4.4 8 4.4 6.7s1-2.3 2.3-2.3S9 5.4 9 6.7zm16.3 21c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zm2.4-21c0 1.3-1 2.3-2.3 2.3S23 7.9 23 6.7s1-2.3 2.3-2.3 2.4 1 2.4 2.3zM6.7 23C8 23 9 24 9 25.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3 1-2.3 2.3-2.3z" />
          </g>
        </svg>
      </button>
    `;
  }

  render() {
    this.innerHTML = this.html();
  }

  /////////////////////////////////////////////////////////
  // Registration
  /////////////////////////////////////////////////////////

  static register() {
    if ("customElements" in window) {
      window.customElements.define(ThemeToggle.NODE_NAME, ThemeToggle);
      ThemeToggle.addGlobalStyles();
    }
  }
}

ThemeToggle.register();
export default ThemeToggle;
