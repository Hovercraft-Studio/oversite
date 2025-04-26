class AuthForm extends HTMLElement {
  static AUTHENTICATED = "authenticated";

  connectedCallback() {
    // get attributes
    this.users = atob(this.getAttribute("user")).split(","); // base64-decode
    this.passwords = atob(this.getAttribute("pass")).split(","); // base64-decode
    this.expiryDays = this.getAttribute("expiry-days") ?? 30; // default to 30 days
    this.apiURL = this.getAttribute("api-url") || null;
    if (this.apiURL && this.apiURL.startsWith("/")) this.apiURL = this.apiURL.substring(1); // remove leading slash
    this.logoutReloads = this.getAttribute("logout-reloads") || false;

    // prep markup for rendering
    this.innerContent = this.innerHTML;
    this.innerHTML = "";
    this.style.display = "block"; // undo `display: none` upon fully loading web component

    // form listener
    this.formListenerBound = this.formListener.bind(this);
    this.addEventListener("submit", this.formListenerBound);

    // render form but immediately show content if auth cookie is set
    this.render();
    if (this.checkAuthCookie()) {
      this.innerHTML = this.innerContent; // reset innerHTML to original protected content
    }
  }

  disconnectedCallback() {
    this.removeEventListener("submit", this.formListenerBound);
  }

  //////////////////////////////////
  // Form handling
  //////////////////////////////////

  formListener(e) {
    e.preventDefault();

    // get form data
    const form = this.querySelector("form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // do either frontend (insecure) or backend auth
    if (this.apiURL) {
      this.loginViaApi(data);
    } else {
      if (this.checkFrontendAuth(data.username, data.password)) {
        this.authSuccess();
      } else {
        this.authFailed();
      }
    }
  }

  checkFrontendAuth(user, pass) {
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i] === user) {
        if (this.passwords[i] === pass) {
          return true;
        }
      }
    }
    return false;
  }

  loginViaApi(data) {
    fetch(`${_store.get("server_url")}${this.apiURL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Login failed");
        }
      })
      .then((data) => {
        this.authSuccess(); // call authSuccess to reset innerHTML and set authenticated state
      })
      .catch((error) => {
        this.authFailed();
      });
  }

  //////////////////////////////////
  // Login response handling
  //////////////////////////////////

  authFailed() {
    // inline form validation
    let inputs = this.querySelectorAll("input");
    inputs.forEach((input) => {
      input.setAttribute("aria-invalid", "true"); // pico css error styling
      input.setAttribute("aria-errormessage", "Invalid username or password");
    });
    this.querySelector("#invalid-helper").style.display = "block";
    _store.set("toast_error", "❌ Login Failed");
  }

  authSuccess() {
    this.setAuthCookie();
    _store.set(AuthForm.AUTHENTICATED, true); // internal auth state in case content isn't wrapped in <auth-form>
    this.innerHTML = this.innerContent; // reset innerHTML to original protected content
    _store.set("toast", "✅ Login Successful");
  }

  //////////////////////////////////
  // Cookie handling
  //////////////////////////////////

  setAuthCookie() {
    let daySeconds = 24 * 60 * 60; // seconds in a day
    let expirySeconds = Math.round(this.expiryDays * daySeconds); // set cookie to expire in [x] days. seconds needs to be integer
    document.cookie = `auth=true; max-age=${expirySeconds}; path=/`;
  }

  logOut() {
    document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    _store.set(AuthForm.AUTHENTICATED, false);
    this.render();
    if (this.logoutReloads) window.location.reload();
  }

  checkAuthCookie() {
    // check if auth cookie is set
    let cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
      let [name, value] = cookie.split("=");
      if (name === "auth" && value === "true") {
        return true;
      }
    }
    return false;
  }

  css() {
    return /*css*/ `
      .dashboard-login {
        input, button {
          padding: 1rem;
        }
      }
      #invalid-helper {
        display: none;
      }
    `;
  }

  html() {
    return /*html*/ `
      <div class="dashboard-login">
        <h3>Login</h3>
        <form>
          <div class="grid">
            <div>
              <input type="text" name="username" placeholder="Username" required />
            </div>
            <div>
              <input type="password" name="password" placeholder="Password" aria-describedby="invalid-helper" required />
              <small id="invalid-helper">Invalid username or password</small>
            </div>
          </div>
          <button type="submit">Login</button>
        </form>
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
    customElements.define("auth-form", AuthForm);
  }
}

AuthForm.register();

export default AuthForm;
