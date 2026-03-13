// _store.set("OPEN_MODAL", {
//   title: `Final Video: ${videoId}`,
//   content: this.previewForFinalVideo(videoData, qrTag),
//   cancelValue: `viewFinal`,
//   // confirmValue: `viewSource`,
// });
import AppStore from "../../app-store/app-store-.mjs";
import ModalDialog from "../ui/modal-dialog.js";

class ModalWindowDemo extends HTMLElement {
  connectedCallback() {
    this.render();
    AppStore.checkStoreReady(this);
  }

  storeIsReady() {
    _store.addListener(this, ModalDialog.MODAL_CONFIRM);
    _store.addListener(this, ModalDialog.MODAL_CANCEL);
    _store.addListener(this, ModalDialog.MODAL_CLOSED);
    this.initButton();
  }

  initButton() {
    this.button = this.querySelector("[action-open-window]");
    this.button.addEventListener("click", () => {
      _store.set("OPEN_MODAL", {
        title: `Example Modal Title`,
        content: `<p>This is an example of a modal window that can be opened from a web component. You can customize the content, title, and button text by setting the appropriate values in the _store when dispatching the OPEN_MODAL event.</p>`,
        cancelValue: `cancelled`,
        confirmValue: `confirmed`,
        cancelBtnText: `CANCEL`,
        confirmBtnText: `CONFIRM`,
      });
    });
    this.button = this.querySelector("[action-open-close]");
    this.button.addEventListener("click", () => {
      _store.set("OPEN_MODAL", {
        title: `Temporary Modal`,
        content: `<p>This will open then close.</p>`,
      });
      setTimeout(() => {
        _store.set(ModalDialog.CLOSE_MODAL, true);
      }, 3000);
    });
  }

  MODAL_CONFIRM(value) {
    _store.set("toast", `Modal Confirmed`);
  }

  MODAL_CANCEL(value) {
    _store.set("toast_error", `Modal Cancelled`);
  }

  MODAL_CLOSED(value) {
    _store.set("toast", `Modal closed`);
  }

  disconnectedCallback() {}

  css() {
    return /*css*/ `
    `;
  }

  html() {
    return /*html*/ `
      <button action-open-window>Open Modal Window</button>
      <button action-open-close>Open & Auto-Close Modal</button>
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
    customElements.define("modal-window-demo", ModalWindowDemo);
  }
}

ModalWindowDemo.register();

export default ModalWindowDemo;
