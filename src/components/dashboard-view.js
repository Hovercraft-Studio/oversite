class DashboardView extends HTMLElement {
  ignoreKeys = [
    "appId",
    "uptime",
    "lastSeen",
    "appTitle",
    "lastSeenScreenshot",
    "lastSeenExtra",
    "imageScreenshot",
    "imageExtra",
    "history",
    "imageScreenshotSrc",
    "imageExtraSrc",
  ];

  connectedCallback() {
    this.initialHTML = this.innerHTML;
    this.apiURL = this.getAttribute("api-url");
    this.serverBase = this.getAttribute("server-base") || "";
    this.refreshInterval = this.getAttribute("refresh-interval") || 60;
    this.dashboardDataUrl = `${this.apiURL}/json`;
    this.shadow = this.attachShadow({ mode: "open" });
    this.el = this.shadow ? this.shadow : this;
    this.detailID = null;
    this.data = null;
    this.isAuthenticated = true; // this.checkAuthCookie();
    this.render();
    this.initComponent();
  }

  initComponent() {
    this.listenForHashChange();
    this.listenForTabVisibility();
    this.listenForClicks();
    this.getData();
    this.restartPolling();
  }

  disconnectedCallback() {
    window.removeEventListener("hashchange", this.processHashCallback);
    window.removeEventListener("historychange", this.processHashCallback);
    window.removeEventListener("popstate", this.processHashCallback);
    window.removeEventListener("visibilitychange", this.tabVisibilityCallback);
    window.removeEventListener("click", this.clickListenerBound);
    window.removeEventListener("mouseover", this.hoverListenerBound);
    window.clearInterval(this.pollingInterval);
    window.clearInterval(this.progressInterval);
  }

  ////////////////////////////////////////
  // Hash query navigation & actions
  ////////////////////////////////////////

  listenForHashChange() {
    this.processHashCallback = this.processHash.bind(this);
    window.addEventListener("hashchange", this.processHashCallback);
    window.addEventListener("historychange", this.processHashCallback);
    window.addEventListener("popstate", this.processHashCallback);
    this.processHash();
  }

  getHashQueryParam(variable) {
    const url = new URL(document.location);
    const searchParams = new URLSearchParams(url.hash.substring(1));
    for (let [key, value] of searchParams) {
      if (key == variable) return value;
    }
    return null;
  }

  processHash(e) {
    let hash = window.location.hash;
    let actionDetail = this.getHashQueryParam("detail");
    let actionDelete = this.getHashQueryParam("delete");
    if (actionDetail) {
      this.detailID = actionDetail;
      this.getData();
    } else if (actionDelete) {
      this.deleteApp(actionDelete);
      window.location.hash = ""; // remove hash
      this.restartPolling();
    } else {
      // no action, show home listing
      this.detailID = null;
      window.location.hash = "";
      this.getData();
    }
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }

  ////////////////////////////////////////
  // Server data
  ////////////////////////////////////////

  restartPolling() {
    if (!this.isAuthenticated) return;
    window.clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      this.getData();
    }, 1000 * this.refreshInterval);

    this.startTime = Date.now();
    window.clearInterval(this.progressInterval);
    this.progressInterval = setInterval(() => {
      if (this.progress) {
        this.progress.max = this.refreshInterval;
        this.progress.value = (Date.now() - this.startTime) / 1000;
      }
    }, 16);
  }

  getData() {
    if (!this.isAuthenticated) return;
    fetch(this.dashboardDataUrl)
      .then((response) => response.json())
      .then((data) => {
        this.data = data;
        this.render();
      });
    this.restartPolling();
  }

  deleteApp(appId) {
    let confirmDelete = confirm(
      "Are you sure you want to delete this app?\nIt will be recreated with the next check-in."
    );
    if (!confirmDelete) return;

    fetch(`${this.apiURL}/delete/${appId}`)
      .then((response) => {
        if (response.ok) {
          this.getData();
        } else {
          console.error("Error deleting", appId, response.statusText);
        }
      })
      .catch((error) => {
        console.error("Error deleting", appId, error);
      });
  }

  // Retrieve data when switching back to browser tab

  listenForTabVisibility() {
    this.tabVisibilityCallback = this.checkTabVisibility.bind(this);
    document.addEventListener("visibilitychange", this.tabVisibilityCallback);
  }

  checkTabVisibility() {
    if (!document.hidden) {
      this.getData();
    }
  }

  ////////////////////////////////////////
  // CSS styling
  // Slight dependency on pico.css
  ////////////////////////////////////////

  css() {
    return /*css*/ `

      :host {
        cursor: default;
      }

      .api-data-link::after {
        content: "↗";
        display: inline-block;
        margin: 0 0 0 0.25rem;
        transform: translateY(-23%);
        text-decoration: none;
      }

      article {
        padding: var(--pico-spacing);
        background-color: var(--pico-contrast-inverse);
      }

      progress {
        width: 100%;
        height: 8px;
        margin: 0.5rem 0;
      }

      .dashboard-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        grid-gap: var(--pico-spacing);
        margin-bottom: var(--pico-spacing);
        box-sizing: border-box;
        font-size: calc(var(--pico-font-size) * 0.6);

        * {
          box-sizing: border-box;
        }

        dashboard-card {
          position: relative;
          padding: var(--pico-spacing);
          width: 100%;
          border-radius: var(--pico-border-radius);
          background-color: var(--pico-contrast-inverse);
          box-shadow: var(--pico-card-box-shadow);
        }

        dashboard-card.dashboard-offline {
          background-color: rgba(255,0,0,0.3);
        }

        dashboard-card.dashboard-restarted {
          background-color: rgba(0,255,0,0.3);
        }

        dashboard-card .dashboard-title {
          padding: 0 0 4px;
          font-size: 18px;
          font-weight: bold;
          border-bottom: 2px solid #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        dashboard-card .dashboard-title a,
        dashboard-card .dashboard-title a:active,
        dashboard-card .dashboard-title a:hover {
          text-decoration: none;
          color: #fff;
        }

        dashboard-card p {
          line-height: 1.2;
        }
        dashboard-card .dashboard-info-time {
          margin: 6px 0;
          line-height: 1.2;
          font-size: 14px;
          line-height: 1.2;
        }
        dashboard-card .dashboard-info-custom {
          line-height: 1.2;
        }
        dashboard-card .dashboard-info-custom b {
          border-bottom: 1px solid #fff;
          margin-bottom: 4px;
          display: block;
        }
        dashboard-card .dashboard-img-outer {
          background: rgba(0, 0, 0, 0.3);
          font-size: 11px;
          text-indent: 6px;
          margin-bottom: 8px;
        }

        dashboard-card .dashboard-img-container {
          display: block;
          text-align: center;
          position: relative;
          background-color: rgba(0, 0, 0, 0.5);
          aspect-ratio: 16 / 9;
        }

        dashboard-card img {
          width: 100%;
          height: 100%;
          background: #000;
          object-fit: contain;
          display: block;
          cursor: zoom-in;
        }

        .dashboard-custom-props {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(50%, 1fr));
          grid-gap: 0;
        }
        .dashboard-key,
        .dashboard-val {
          font-size: 12px;
          line-height: 1.2;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .dashboard-card-delete {
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
          text-decoration: none;
          float: right;

          svg {
            width: 16px;
            height: 16px;
            fill: #fff;
            transition: all 0.2s ease-in-out;
            &:hover {
              transform: rotate(90deg);
            }
          }
        }

        dashboard-card input,
        dashboard-card textarea,
        dashboard-card select,
        dashboard-card fieldset {
          margin-bottom: 0;
          width: 100%;
          margin: 6px 0;
          height: 32px;
          text-indent: 4px;
        }

      }

      .dashboard-image-highlight {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        pointer-events: none;

        img {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          max-width: 90%;
          max-height: 90%;
          border-radius: 10px;
        }
      }
    `;
  }

  ////////////////////////////////////////
  // Render outer layout
  ////////////////////////////////////////

  render() {
    this.el.innerHTML = /*html*/ `
      ${this.renderDashboard()}
      <style>
        ${this.css()}
      </style>
    `;
    this.progress = this.el.querySelector("progress");
  }

  renderDashboard() {
    let projectsCards = this.detailID
      ? this.renderProjectHistory(this.data.checkins[this.detailID])
      : this.renderProjects(this.data);

    let dashboardTitle = this.detailID ? `<a href="#home">All Projects</a>` : "All Projects";
    let apiLinkProject = this.detailID ? `/${this.detailID}` : "";

    return /*html*/ `
      <h1>${dashboardTitle} ${this.breadcrumb()}</h1>
      <article>
        <div><small>apiURL: <code>${this.apiURL}</code></small></div>
        <div><small>serverBase: <code>${this.serverBase}</code></small></div>
        <a href="${this.apiURL}/json${apiLinkProject}" target="_blank" class="api-data-link">API Data</a>
      </article>
      <progress id="file" max="60" value="0">70%</progress>
      <div class="dashboard-cards">
        ${projectsCards}
      </div>
      <div class="dashboard-image-highlight">
        <img src="" crossorigin="anonymous" />
      </div>
    `;
  }

  breadcrumb() {
    if (this.data && this.detailID) {
      return `→ ${this.data.checkins[this.detailID].appTitle}`;
    } else {
      return "";
    }
  }

  ////////////////////////////////////////
  // Render checkin cards
  ////////////////////////////////////////

  renderProjects() {
    let data = this.data;
    if (!data || !data.checkins) {
      return `<h2 aria-busy="true">Loading...</h2>`;
    }
    if (Object.keys(data.checkins).length === 0) {
      return `<h2>No projects found</h2>`;
    }
    let projectKeys = Object.keys(data.checkins);
    projectKeys.sort();
    let projectsCards = projectKeys.map((appId) => {
      let project = data.checkins[appId];
      return this.renderCard(appId, project);
    });

    return projectsCards.join("");
  }

  renderProjectHistory(projectData) {
    if (!projectData || !projectData.history || projectData.history.length === 0) {
      return `<h2>No project history found</h2>`;
    }
    let historyCards = projectData.history.map((checkinData, i) => {
      return this.renderCard(projectData.appId, checkinData, i);
    });

    return historyCards.join("");
  }

  daysAndSecondsToClockTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const time = new Date(seconds * 1000).toISOString().substr(11, 8);
    return days > 0 ? `${days}d + ${time}` : time;
  }

  getMsSince1970(secondsSince1970) {
    return new Date(secondsSince1970 * 1000);
  }

  timeElapsedString(dateTimeSince, full = false) {
    // display how long ago in human readable format
    const diff = Date.now() - dateTimeSince;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(weeks / 4);
    const years = Math.floor(months / 12);

    if (years > 0) {
      return `${years} year${years > 1 ? "s" : ""} ago`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else if (weeks > 0) {
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (seconds > 0) {
      return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  }

  renderImage(imageURL, lastSeen, title) {
    if (!imageURL) {
      return "";
    }
    imageURL = imageURL.replace("data/projects", "/data/dashboard/projects"); // convert old data format - not needed moving forward
    imageURL = this.serverBase + imageURL;
    let imgHTML = /*html*/ `
      <div class="dashboard-img-outer">
        ${title}: ${this.timeElapsedString(this.getMsSince1970(lastSeen))}
        <span class="dashboard-img-container">
          <img zoomable src="${imageURL}" crossorigin="anonymous">
        </span>
      </div>
    `;
    return imgHTML;
  }

  renderCard(appId, project, index) {
    // calculate values
    let appTitle = project.appTitle ? project.appTitle : appId;

    // get last seen & uptime
    let uptime = project.uptime ? project.uptime : 0;
    let secondsSinceSeen = Date.now() / 1000 - project.lastSeen;
    // add offline alert color to card
    let offlineAlert = secondsSinceSeen > 20 * 60 ? " class='dashboard-offline'" : ""; // 20 minute window to show offline indication
    if (this.detailID && index > 0) {
      offlineAlert = ""; // don't show offline alert on detail view
    }
    // add restarted alert color to card
    let restartedWindow = this.detailID ? 5 : 30;
    let restartedAlert = uptime < restartedWindow * 60 ? " class='dashboard-restarted'" : ""; // 30 minute window to show restarted color
    // calculate times
    let uptimeClock = this.daysAndSecondsToClockTime(uptime);
    let timeSinceLastSeen = this.timeElapsedString(this.getMsSince1970(project.lastSeen));
    // legacy vals - maybe can get rid of these?
    let uptimeClockLegacy = project.appUptime ? this.daysAndSecondsToClockTime(appUptime) : "n/a";
    let lastSeenApp = this.timeElapsedString(this.getMsSince1970(project.lastSeenApp));

    // get images
    let imgScreenshot = this.renderImage(project.imageScreenshot, project.lastSeenScreenshot, "Screenshot");
    let imgExtra = this.renderImage(project.imageExtra, project.lastSeenExtra, "Custom Img");

    // draw custom props
    let checkIn = project;
    let customProps = Object.keys(checkIn).filter((key) => !this.ignoreKeys.includes(key));
    let customPropsHTML = customProps.map((key) => {
      let val = checkIn[key];
      return /*html*/ `
        <div class="dashboard-key" title="key">${key}</div>
        <div class="dashboard-val" title="val">${val}</div>
      `;
    });

    // delete button
    let deleteButton = /*html*/ `
      <a href="#delete=${appId}" class="dashboard-card-delete">
        <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="800" height="800" viewBox="0 0 460.8 460.8">
          <path d="M285 230.4 456.3 59.3c6-6.1 6-16 0-22L423.5 4.6a15.6 15.6 0 0 0-22 0L230.4 175.7 59.2 4.6a15.6 15.6 0 0 0-22 0L4.7 37.3c-6.1 6-6.1 15.9 0 22l171.1 171.1L4.6 401.5c-6.1 6-6.1 16 0 22l32.7 32.7a15.5 15.5 0 0 0 22 0l171-171.1 171.2 171.1a15.6 15.6 0 0 0 22 0l32.7-32.7c6-6 6-16 0-22L285.1 230.4z"/>
        </svg>
      </a>
    `;

    // link or no link in title
    let cardTitle = /*html*/ `
      <div class="dashboard-title" title="${appTitle}">
        <a href="#detail=${appId}">${appTitle}</a>
        ${deleteButton}
      </div>
    `;
    if (this.detailID) {
      cardTitle = ""; //appTitle;
    }

    return /*html*/ `
      <dashboard-card ${offlineAlert} ${restartedAlert}>
        ${cardTitle}
        <div class="dashboard-info-time">
          <b>Uptime</b>: ${uptimeClock}<br>
          <b>Updated</b>: ${timeSinceLastSeen}
        </div>
        ${imgScreenshot}
        ${imgExtra}
        <div class="dashboard-info-custom"><b>Properties</b></div>
        <div class="dashboard-custom-props">
          ${customPropsHTML.join("")}
        </div>
      </dashboard-card>
    `;
  }

  ////////////////////////////////////////
  // Mouse & hover events
  ////////////////////////////////////////

  listenForClicks() {
    this.clickListenerBound = this.clickListener.bind(this);
    this.hoverListenerBound = this.hoverListener.bind(this);
    this.el.addEventListener("click", this.clickListenerBound);
    this.el.addEventListener("mouseover", this.hoverListenerBound.bind(this));
  }

  clickListener(e) {
    if (e.target.nodeName === "IMG") {
      let img = e.target;
      console.log(img.naturalWidth, img.naturalHeight);
    }
  }

  hoverListener(e) {
    // get hovered image and pass to overlay
    if (e.target.nodeName === "IMG") {
      let img = e.target;
      if (img.hasAttribute("zoomable")) {
        let imageHighlight = this.el.querySelector(".dashboard-image-highlight");
        let imgHighlightImg = imageHighlight.querySelector("img");
        imgHighlightImg.src = img.src;
        imageHighlight.style.opacity = 1;
      }
    } else {
      let imageHighlight = this.el.querySelector(".dashboard-image-highlight");
      if (imageHighlight) imageHighlight.style.opacity = 0;
    }
  }

  static register() {
    customElements.define("dashboard-view", DashboardView);
  }
}

DashboardView.register();

export default DashboardView;
