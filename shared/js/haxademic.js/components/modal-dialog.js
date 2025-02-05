import ObjectUtil from "../object-util.mjs";

class ModalDialog extends HTMLElement {
  connectedCallback() {
    // this.shadow = this.attachShadow({ mode: "open" });
    this.el = this.shadow ? this.shadow : this;
    this.config();
    this.addDocumentListeners();
    this.render();

    ObjectUtil.callbackWhenPropertyExists(window, "_store", () => {
      this.initStoreListener();
    });
  }

  initStoreListener() {
    _store.addListener(this, "OPEN_MODAL");
    _store.addListener(this, "CLOSE_MODAL");
  }

  config() {
    this.title = "Confirm your selection";
    this.content = `Cras sit amet maximus risus. Pellentesque sodales odio sit amet augue finibus pellentesque. Nullam finibus risus non semper euismod.`;
    this.cancelValue = "Cancel example";
    this.confirmValue = "Confirm example";
    this.cancelBtnTextDef = "Cancel";
    this.cancelBtnText = this.cancelBtnTextDef;
    this.confirmBtnTextDef = "Confirm";
    this.confirmBtnText = this.confirmBtnTextDef;

    this.isOpenClass = "modal-is-open";
    this.openingClass = "modal-is-opening";
    this.closingClass = "modal-is-closing";
    this.scrollbarWidthCssVar = "--pico-scrollbar-width";
    this.animationDuration = 400; // ms
    this.modalActive = false;
  }

  addDocumentListeners() {
    // listen for clicks outside of the active modal and close is clicked
    document.addEventListener("click", (e) => {
      if (this.modalActive == false) return;
      const isClickInside = this.modalContent.contains(e.target);
      if (!isClickInside) this.closeModal();
    });

    // Close with Esc key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modalActive) {
        e.preventDefault(); // ESC will immediately close the modal, instead of animating out
        this.closeModal();
      }
    });

    // check close buttons inside the modal
    document.addEventListener("click", (e) => {
      let actionClose = e.target.dataset.actionClose;
      if (actionClose) {
        this.closeModal();
        if (actionClose == "confirm")
          _store.set("MODAL_CONFIRM", this.confirmValue);
        if (actionClose == "cancel")
          _store.set("MODAL_CANCEL", this.cancelValue);
      }
    });
  }

  storeUpdated(key, value) {
    this.eventLog.log(`<pre>[${Date.now()}] ${key}: ${value}</pre>`);
  }

  // Open modal
  OPEN_MODAL(config) {
    this.title = config.title;
    this.content = config.content;
    this.cancelValue = config.cancelValue;
    this.confirmValue = config.confirmValue;
    this.cancelBtnText = this.cancelBtnTextDef;
    if (config.cancelBtnText) this.cancelBtnText = config.cancelBtnText;
    this.confirmBtnText = this.confirmBtnTextDef;
    if (config.confirmBtnText) this.confirmBtnText = config.confirmBtnText;
    this.openModal();
  }

  CLOSE_MODAL(val) {
    this.closeModal();
  }

  openModal() {
    this.render();
    const html = document.documentElement;
    const scrollbarWidth = this.getScrollbarWidth();
    if (scrollbarWidth) {
      html.style.setProperty(this.scrollbarWidthCssVar, `${scrollbarWidth}px`);
    }
    html.classList.add(this.isOpenClass, this.openingClass);
    setTimeout(() => {
      this.modalActive = true;
      html.classList.remove(this.openingClass);
    }, this.animationDuration);
    this.modal.showModal(); // showModal() is a native/vanilla function on <dialog>
  }

  // Close modal
  closeModal() {
    this.modalActive = false;
    const { documentElement: html } = document;
    html.classList.add(this.closingClass);
    setTimeout(() => {
      html.classList.remove(this.closingClass, this.isOpenClass);
      html.style.removeProperty(this.scrollbarWidthCssVar);
      this.modal.close();
      this.content = "";
      this.render();
    }, this.animationDuration);
  }

  // Get scrollbar width
  getScrollbarWidth() {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    return scrollbarWidth;
  }

  // Is scrollbar visible
  isScrollbarVisible() {
    return document.body.scrollHeight > screen.height;
  }

  cancelButton() {
    return /*html*/ `
      <button role="button" class="secondary" data-action-close="cancel">${this.cancelBtnText}</button>
    `;
  }

  confirmButton() {
    return /*html*/ `
      <button autofocus data-action-close="confirm">${this.confirmBtnText}</button>
    `;
  }

  html() {
    return /*html*/ `
      <dialog>
        <article>
          <header>
            <button aria-label="Close" rel="prev" data-action-close="cancel"></button>
            <h3>${this.title}</h3>
          </header>
          <div data-content>${this.content}</div>
          <footer>
            ${this.cancelValue ? this.cancelButton() : ""}
            ${this.confirmValue ? this.confirmButton() : ""}
          </footer>
        </article>
      </dialog>
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
    this.modal = this.querySelector("dialog");
    this.modalContent = this.querySelector("article");
  }

  static register() {
    customElements.define("modal-dialog", ModalDialog);
  }
}

ModalDialog.register();

export default ModalDialog;
