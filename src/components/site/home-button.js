class HomeButton extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {}

  css() {
    return /*css*/ `
      home-button {
        position: absolute; 
        top: 0; 
        left: 0; 
        padding: 1rem;

        a,
        a:visited,
        a:hover,
        a:active {
          text-decoration: none;
        }
      }
    `;
  }

  html() {
    return /*html*/ `
      <a href="/">🏠</a>
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
    customElements.define("home-button", HomeButton);
  }
}

HomeButton.register();

export default HomeButton;
