import { logCyan } from "./util.mjs";

// TODO:
// - Share timeout config with dashboard-view for red cards (20 mins?)
// - Could we add a screenshot image from the last check-in?
// - Look at best practices for setInterval on long-running server
// - Conditional initialization if there are no integrations?
// - externalize integration-specific code if/as we add more

class OfflineAlerts {
  static INTERVAL = 60000; // 1000; // check every second/minute
  static OFFLINE_THRESHOLD = 20 * 60000; // 7000; // 7 seconds / 20 minutes without a checkin

  constructor(dashboardApi, alertProjectIds, slackApiHookUrl) {
    logCyan("OfflineAlerts Project IDs:", alertProjectIds);
    logCyan("OfflineAlerts Slack Hook URL:", slackApiHookUrl);
    this.dashboardApi = dashboardApi; // dashboardApi.dashboardData for data
    this.alertProjectIds = alertProjectIds;
    this.slackApiHookUrl = slackApiHookUrl;
    this.projects = {}; // production will always start empty, since it's ephemeral. lazy-populate with new checkins
    this.interval = setInterval(() => this.checkProjects(), OfflineAlerts.INTERVAL);
  }

  dashboardProjects() {
    return this.dashboardApi.dashboardData.checkins;
  }

  checkProjects() {
    for (const projectId in this.dashboardProjects()) {
      // opt in to projects we want alerts for
      if (this.alertProjectIds.includes(projectId)) {
        // get checkin data
        const project = this.dashboardProjects()[projectId];
        const lastSeen = project.lastSeen * 1000; // convert to ms - dashboard checkin times are in seconds
        const timeSinceLastSeen = Date.now() - lastSeen;
        const isOnline = timeSinceLastSeen < OfflineAlerts.OFFLINE_THRESHOLD;

        // if we're not tracking a newly-found project, add it
        if (!this.projects[projectId]) {
          this.projects[projectId] = { alerted: false };
          if (!isOnline) this.projects[projectId].alerted = true; // if it's already offline, don't alert. this is probably stale data, but wouldn't happen in an ephemeral production situation
        } else {
          if (!isOnline && !this.projects[projectId].alerted) {
            // we've seen this project before, check if it's offline
            this.projects[projectId].alerted = true;
            this.offlineTrigger(projectId);
          } else if (isOnline && this.projects[projectId].alerted) {
            // reset alerted if it's back online
            this.projects[projectId].alerted = false;
            this.onlineTrigger(projectId);
          } else {
            // state hasn't changed, do nothing
          }
        }
      }
    }
  }

  offlineTrigger(projectId) {
    logCyan(`Project OFFLINE: ${projectId}`);
    if (this.slackApiHookUrl) this.sendSlackMessage(projectId, false);
  }

  onlineTrigger(projectId) {
    logCyan(`Project ONLINE: ${projectId}`);
    if (this.slackApiHookUrl) this.sendSlackMessage(projectId, true);
  }

  async sendSlackMessage(projectId, isOnline) {
    // compose message
    let onlineText = isOnline
      ? `:tada: \`${projectId}\` is back *ONLINE* :tada:`
      : `:rotating_light: \`${projectId}\` is *OFFLINE* :rotating_light:`;
    let msgTest = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `Alert for ${projectId}`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: onlineText,
          },
        },
      ],
    };

    // send it!
    let res = await fetch(this.slackApiHookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(msgTest),
    });
    if (res.ok) {
      logCyan("Slack message sent successfully!");
    } else {
      logCyan("Error sending message:", res.statusText);
    }
  }
}

export default OfflineAlerts;
