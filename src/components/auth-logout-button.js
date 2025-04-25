class AuthLogoutButton extends HTMLElement {
  connectedCallback() {
    this.render();
    this.logoutListenerBound = this.logoutListener.bind(this);
    this.addEventListener("click", this.logoutListenerBound);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.logoutListenerBound);
  }

  initStoreListener() {
    this.render();
  }

  logoutListener(e) {
    e.preventDefault();
    // get outer <auth-form> element and call its logout method
    const authForm = this.closest("auth-form");
    if (authForm) {
      authForm.logOut(); // call the logOut method of the auth-form element
    } else {
      console.error("AuthLogoutButton: No auth-form parent.");
    }
  }

  css() {
    return /*css*/ `

    `;
  }

  html() {
    return /*html*/ `
      <button>Logout</button>
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
    customElements.define("auth-logout-button", AuthLogoutButton);
  }
}

AuthLogoutButton.register();

export default AuthLogoutButton;
