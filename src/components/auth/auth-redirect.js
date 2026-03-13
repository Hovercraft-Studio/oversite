import AuthForm from "./auth-form.js";

class AuthRedirect extends HTMLElement {
  connectedCallback() {
    let authenticated = AuthForm.checkAuthCookie() || this.ignoreAuth();
    if (!authenticated) {
      let currentPath = window.location.pathname;
      window.location.href = `/login/?redirect=${encodeURIComponent(currentPath)}`;
    } else {
      this.style.display = "inherit";
    }
  }

  ignoreAuth() {
    if (import.meta.env.VITE_FORCE_LOCAL_AUTH === "true") return false; // don't ignore auth if we've manually enforced dev authentication
    return (
      this.isIpAddress(window.location.hostname) ||
      window.location.hostname === "localhost" ||
      window.location.hostname.endsWith(".local") ||
      window.location.hostname.endsWith(".dev")
    );
  }

  isIpAddress(hostname) {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  }

  static register() {
    customElements.define("auth-redirect", AuthRedirect);
  }
}

AuthRedirect.register();

export default AuthRedirect;
