class OversiteHeader extends HTMLElement {
  connectedCallback() {
    this.pageId = this.getAttribute("id") || "no_id";
    this.render();
  }

  disconnectedCallback() {}

  render() {
    let isHome = window.location.pathname === "/" || window.location.pathname === "/index.html";
    this.innerHTML =
      /*html*/ `
      <app-store-init sender="${this.pageId}" debug side-debug></app-store-init>
      <app-store-heartbeat key="${this.pageId}_heartbeat" value="n/a" interval="30000" show="false"></app-store-heartbeat>
      <auth-logout-button emoji></auth-logout-button>
      <notyf-listener></notyf-listener>
    ` + (isHome ? "" : `<home-button></home-button>`);
  }

  static register() {
    customElements.define("oversite-header", OversiteHeader);
  }
}

OversiteHeader.register();

export default OversiteHeader;
