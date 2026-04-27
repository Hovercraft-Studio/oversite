# SLA Planning Guide

Oversite gives studios real, quantifiable tools to back up a support agreement. This doc outlines how to use those tools to structure an SLA for ongoing maintenance of site-specific tech installations — including cloud CMS components and bespoke hardware.

The goal is not to prescribe a specific contract, but to give you the language and structure to approach a real client conversation with confidence.

---

## What Oversite Provides Out of the Box

Before structuring tiers, know what you can already commit to:

| Capability | How Oversite delivers it |
|---|---|
| **Uptime detection** | Dashboard check-ins give per-project last-seen timestamps |
| **Offline alerting** | `OfflineAlerts` fires a Slack webhook within ~20 min of a missed check-in |
| **Recovery alerting** | Slack fire again when the project comes back online |
| **Remote remediation** | `SystemCommands` lets you restart processes and kill hung apps without a site visit |
| **Live state inspection** | AppStore Monitor shows real-time key/value state across all connected machines |
| **CMS-style updates** | AppStore keys can be set remotely — toggle features, update content, change config |
| **Incident record** | Slack alert history + dashboard check-in log form a basic audit trail |

These capabilities are the backbone of any SLA you offer. The tiers below define how actively you act on them.

---

## SLA Tiers

### Tier 1 — Monitoring / "Eyes Open"

Passive observability. You watch, alert, and document. The client or their venue staff owns first response.

**Included:**
- Oversite dashboard live for all monitored installations
- Slack alerts to a shared channel on offline/recovery events
- Remote restart attempt via SystemCommands before escalating
- Monthly uptime report per installation (generated from dashboard history)
- Client-initiated support tickets, responded to within **48 business hours**

**Excluded:** on-site visits, hardware replacement, CMS content updates

**Best for:** Clients with internal AV or IT staff who need visibility and a formal escalation path but can handle day-to-day operations themselves.

---

### Tier 2 — Active Support / "Hands Ready"

You are the first responder. Remote-first resolution with defined escalation, plus a content update budget.

**Included, in addition to Tier 1:**
- Faster response windows — **8 business hours** standard, **2 hours** during defined event windows
- Defined remote triage via SystemCommands before any site dispatch
- **N CMS/content updates per month** via AppStore (media swaps, feature toggles, config changes)
- Quarterly remote health check — review logs, scan for stale state, verify heartbeats
- Hardware replacement coordination: client maintains a spare-parts kit, you manage deployment
- Dedicated support Slack channel or email thread

**Best for:** Semi-permanent installations where the client is non-technical, events are regular but not constant, and on-site visits should be rare.

---

### Tier 3 — Full Service / "White Glove"

You own it. Proactive maintenance, hardware coverage, on-call during high-stakes events.

**Included, in addition to Tier 2:**
- 24/7 monitoring with on-call rotation receiving Slack alerts
- Response SLA: **1h acknowledgment**, **4h remote resolution attempt**, **next-business-day on-site** if remote fails
- **N on-site visits per year** included — preventive maintenance, OS/software updates, hardware inspection
- Hardware parts budget defined in contract (e.g., "up to $X/year in consumables")
- Unlimited CMS/content updates via AppStore
- Proactive scheduled maintenance windows — nights/weekends to avoid disruption
- Monthly uptime report with incident postmortems for any downtime exceeding the SLA target
- Single named point of contact for the client

**Best for:** High-visibility permanent installations, flagship museum/gallery work, or clients who want zero operational burden.

---

## Metrics You Can Define Contractually

Oversite gives you the data to back up these numbers:

| Metric | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| Uptime target (operating hours) | Reported, not guaranteed | 97% | 99% |
| Time to detect (MTTD) | ~20 min (automated) | ~20 min (automated) | ~20 min (automated) |
| Time to acknowledge | 48 business hours | 8 business hours / 2h event | 1 hour |
| Time to resolve (remote) | Best effort | Next business day | 4 hours |
| Time to resolve (on-site) | Not included | Not included | Next business day |
| Content update turnaround | Not included | 48 business hours | 24 hours |

The MTTD row is worth highlighting to clients — automated detection is genuinely fast compared to "the venue calls us."

---

## Hardware-Specific Clauses

Bespoke hardware complicates SLAs. Spell these out explicitly regardless of tier:

- **Venue-caused exclusions** — power events, physical damage, unauthorized access by venue staff are out of scope
- **Consumables vs. components** — cables, indicator LEDs, and fans are consumables; compute hardware is a component. Define the boundary.
- **End-of-life substitution** — if a PC or microcontroller model is discontinued, you'll propose an equivalent and get client sign-off before replacing
- **Remote vs. on-site boundary** — define what triggers a dispatch. A useful rule: if SystemCommands can address it (process restart, config change, file push), you attempt remote first; if the machine is fully unreachable, a dispatch is warranted
- **Venue network dependency** — uptime SLA is conditioned on the venue's network being operational. Oversite can detect when a machine goes dark but cannot distinguish a crashed app from a venue network outage without additional local instrumentation

---

## Honest Gaps in Current Oversite Capabilities

Things that would strengthen an SLA offering but aren't yet built:

- **No ticketing integration** — Slack is the current audit trail. A ZohoDesk or similar integration (on the roadmap) would give you formal ticket IDs and resolution timestamps
- **No heartbeat timeline view** — currently you can see last-seen per client but not a visual history of gaps. A timeline view (roadmap item) would make uptime reporting much clearer
- **No cause-of-failure reporting** — Oversite knows a machine went dark; it doesn't know why. Distinguishing "app crashed" from "PC offline" from "network outage" requires local error reporting per machine, which is a bespoke addition per deployment
- **No formal uptime % export** — the dashboard log exists but there's no one-click report. This is currently a manual or scripted calculation from check-in history

These gaps are important to understand before committing to specific numbers in a contract.

---

## Structuring a Client Conversation

A few practical notes when approaching this with a real client:

**Lead with what you already monitor.** The dashboard and Slack alerts are real and working. Show them the dashboard live if possible — a client seeing their installation's last-seen timestamp and a screenshot is more compelling than any tier description.

**Define "operating hours" early.** A 99% uptime commitment means something very different across 24/7 vs. 9am–6pm museum hours. Get this in writing.

**Separate software from hardware SLAs.** Software issues (app crashes, config errors) are remote-resolvable and fast. Hardware failures require parts and a site visit. Clients often conflate these — distinguish them clearly up front.

**Price on-site visits separately or as a cap.** Travel time and on-site labor are variable costs. Either include a defined number of visits in the annual rate (Tier 3 model) or bill on-site work at a day rate on top of a retainer.

**Set expectations on detection vs. resolution.** You can honestly commit to fast detection (Oversite delivers this). Resolution time depends on the failure type. Don't over-commit on resolution without knowing the deployment's failure modes.
