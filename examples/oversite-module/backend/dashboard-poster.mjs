// Show example of initializing the simplest dashboard poster using the installed `oversite` npm module

import DashboardPoster from "oversite/src/dashboard/dashboard-poster.mjs"; // ../../../src

class DashboardDemo {
  constructor() {
    this.dashboardPoster = new DashboardPoster(
      `http://localhost:3003/api/dashboard`,
      "test-node-app",
      "Test Node App",
      5 * 1000
    );
  }
}

new DashboardDemo();
