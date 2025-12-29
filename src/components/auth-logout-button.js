import AuthForm from "./auth-form.js";

class AuthLogoutButton extends HTMLElement {
  connectedCallback() {
    this.render();
    this.logoutListenerBound = this.logoutListener.bind(this);
    this.addEventListener("click", this.logoutListenerBound);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.logoutListenerBound);
  }

  logoutListener(e) {
    e.preventDefault();
    // get outer <auth-form> element and call its logout method
    const authForm = this.closest("auth-form");
    if (authForm) {
      authForm.logOutForm(); // call the logOut method of the auth-form element
    } else {
      AuthForm.logOut(); // use this from header button or outside of auth-form
    }
  }

  css() {
    return /*css*/ `
      auth-logout-button a {
        position: absolute; 
        top: 0; 
        right: 4rem; 
        padding: 1rem;
        text-decoration: none;
      }
    `;
  }

  html() {
    if (AuthForm.checkAuthCookie() === false) {
      return "";
    } else if (this.hasAttribute("emoji")) {
      return /*html*/ `<a href="#" title="Logout">🔒</a>`;
    } else {
      return /*html*/ `<button>Logout</button>`;
    }
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
