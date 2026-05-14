# AgentHub

> One tab. Every tool. Powered by AI.

[![Launch AgentHub](https://img.shields.io/badge/Launch-AgentHub-7c3aed?style=for-the-badge)](https://agenthub.solutions)
[![Live](https://img.shields.io/badge/Live-agenthub.solutions-7c3aed?style=flat-square)](https://agenthub.solutions)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square)](https://vercel.com)

---

## What is AgentHub?

Call centre agents juggle multiple disconnected platforms every shift — CRMs, portals, knowledge bases, scheduling tools, and more. Every tab switch adds friction and cognitive load.

AgentHub is a customisable productivity dashboard that brings everything into one place, organised around how agents actually work: start of day, through the day, end of day. With the AI Agent unlocked, agents can ask questions in real time and receive structured, in-depth answers pulled directly from company-approved sources — no searching, no guessing, no redirects.

---

## Features

AgentHub operates in two tiers. The core productivity suite is **free**. The AI Agent is a **paid feature** unlocked per deployment via a System Unlock Key (SUK).

### Free — Core Productivity Suite

| Feature | Description |
|---|---|
| **Custom Tool Hub** | Three workflow columns (Start of Day, Main Day, End of Day) — add, edit, reorder, and rename tools |
| **One-Click Boot** | "Boot Up My Day" opens every Start of Day and Main Day tool in new tabs simultaneously |
| **Drag & Drop Reordering** | Organise tools by priority or workflow order within each column |
| **Smart Tool Icons** | Auto-fetches favicons for instant visual recognition |
| **Scripts & Notes** | Persistent scratchpad for call scripts, talking points, and shift notes — auto-saved |
| **Shift Scheduler** | Rolling 7-day calendar with real dates — add reminders, follow-ups, and daily tasks |
| **Share & Backup** | Export your full setup as a compressed code and restore it on any machine instantly |
| **14 Colour Themes** | Brand-matched and custom colour themes with live switching |
| **Guided Tour** | Built-in interactive onboarding tour for new users |

### Paid — AI Agent

| Feature | Description |
|---|---|
| **AI Agent Panel** | Floating chat panel powered by Claude — real-time streaming responses with a live thinking indicator |
| **Source-Specific Answers** | Add company URLs as sources; the AI fetches and answers exclusively from that content |
| **Whole-Site Search** | Add a root domain and the AI searches across the entire site — not just one page |
| **Bookmarklet Capture** | One-click browser bookmarklet captures any private or internal page (e.g. Lighthouse) including PDF links — no server login required |
| **PDF Support** | PDF links found on captured pages are automatically added and read as additional sources |
| **Call Centre Optimised** | Structured, in-depth answers formatted for agents on live calls — never redirects to a website |
| **Cited Answers** | Source URL cited at the end of every source-based answer |
| **Chat History** | Conversation persists across sessions |
| **SUK Access Gate** | AI access is controlled via a System Unlock Key — no key, no access |
| **Multi-Client SUKs** | One deployment supports multiple clients — each gets their own key, revoked instantly when removed |

---

## Screenshots

<table>
  <tr>
    <td><img src="AgentHub_ProductPhotos/Clean_HUD_Example.png" alt="AgentHub clean HUD"/></td>
    <td><img src="AgentHub_ProductPhotos/Creator_Example.png" alt="AgentHub creator workflow"/></td>
  </tr>
  <tr>
    <td><img src="AgentHub_ProductPhotos/Developer_Example.png" alt="AgentHub developer workflow"/></td>
    <td><img src="AgentHub_ProductPhotos/Features_Highlighted.png" alt="AgentHub features highlighted"/></td>
  </tr>
</table>

---

## Pricing

The core productivity suite is free with no setup required. AI Agent packages are billed monthly per deployment.

### Free

- All core productivity features
- Unlimited tools, columns, and entries
- Shift scheduler and notes
- Share & backup
- 14 colour themes

### AI Agent Packages

| Package | Agents | Monthly Price |
|---|---|---|
| **Starter** | Up to 10 agents | $50–100 |
| **Growth** | Up to 25 agents | $125–200 |
| **Business** | Up to 50 agents | $250–400 |
| **Enterprise** | Up to 100 agents | $500–1,000 |

> Pricing is per deployment. Contact for custom enterprise agreements or volume discounts.

---

## How the AI Agent Works

1. The floating `🤖` button opens the AI Agent panel
2. Agents enter their **System Unlock Key (SUK)** — validated server-side before any access is granted
3. Once unlocked, agents chat freely or add **company source URLs** via the `🔗` button
4. For private internal tools, agents install a **one-click bookmarklet** — click it on any page they're already logged into and paste the captured content into AgentHub as a source
5. PDF links found on captured pages are automatically added as additional sources
6. With sources active, the AI answers exclusively from that content — structured for live calls with no website redirects
7. Responses stream in real time with a live thinking indicator
8. All API calls are proxied through a serverless function — no API keys are ever exposed to the browser

---

## Hosting, Security & IT Overview

> For IT departments, compliance reviews, and enterprise onboarding.

### Hosting & Infrastructure

- Hosted on Vercel — serverless, globally distributed, auto-scaling. No servers to manage.
- Domain: `agenthub.solutions` — custom domain with SSL, auto-renewed.
- Deployments auto-publish on every GitHub push with zero downtime.
- Vercel hobby tier carries no SLA. Vercel Pro (~$20/month) provides 99.9%+ uptime guarantees if required.

### Security

- API keys are stored only in Vercel environment variables — never in client code or the browser.
- SUK validation happens server-side on every request.
- No database — no user data is stored server-side.
- All agent data (tools, notes, schedule) lives in the agent's own browser localStorage.
- AI queries are proxied through serverless functions — never sent directly from the browser.
- Anthropic does not use API data for model training by default.
- HTTPS enforced across all endpoints.

### Data & Privacy

- No logins, accounts, analytics, or user tracking of any kind.
- The bookmarklet captures page content into the agent's clipboard only — nothing is transmitted until the agent explicitly pastes it.
- Fetched company URLs are processed at query time and immediately discarded — not stored or logged.
- Jina Reader briefly processes external URLs server-side for content fetching.

### Access Control

- Each client deployment receives a unique SUK.
- Access is revoked instantly by removing the key from Vercel — no redeploy required.
- No credentials are shared between client deployments.

### Integration & IT Requirements

- Runs entirely in the browser — no installation, plugins, or desktop software required.
- No VPN changes or firewall rules needed.
- The bookmarklet requires standard browser clipboard permissions (one-time prompt per agent).
- IT teams can push the bookmarklet to all agents centrally via standard browser management tools (Google Workspace, Intune, etc.).
- Works alongside existing CRMs, phone systems, and internal tools — replaces nothing, adds to everything.

### Operational Dependencies

- Anthropic outages may temporarily affect AI functionality. Core productivity features remain fully operational.
- If Jina Reader is unavailable, URL-based source fetching may fail. Bookmarklet-captured content is unaffected.
- Intranet pages behind a VPN are not accessible to Jina Reader — the bookmarklet covers this use case.

### Current Limitations

- No audit logs currently available — planned roadmap feature.
- Custom AI model support not currently available — Claude only.
- Self-hosted deployments are technically possible but not currently offered as a packaged solution.

### Frequently Asked IT Questions

| Question | Answer |
|---|---|
| Where is data stored? | Agent's browser only. Nothing stored server-side. |
| Who has access to the AI API key? | The platform administrator only, via Vercel dashboard. |
| Can we use our own AI model? | Not currently — Claude only. Custom model support is on the roadmap. |
| Can we self-host? | Possible, but not currently offered as a packaged deployment. |
| What happens if we cancel? | The SUK is revoked instantly. Access is disabled immediately. |
| Is there an audit trail? | Not yet. Planned roadmap feature. |
| Can IT push the bookmarklet company-wide? | Yes — deployable via any standard browser management policy. |

---

## Roadmap

- [ ] Admin dashboard for SUK management and usage monitoring
- [ ] Per-agent usage analytics
- [ ] Shared team source libraries — admin-defined URLs pushed to all agents
- [ ] Cloud sync for cross-device setups
- [ ] Team profiles and onboarding templates
- [ ] Audit logging
- [ ] Optional SSO / authentication layer
- [ ] Mobile-responsive layout

---

## Feedback & Discussions

Have feedback, a feature request, or want to share how your team uses AgentHub?

**[💬 Join the Discussion →](https://github.com/Dev-Kyron/AgentHub/discussions)**

- **General feedback** — what's working, what isn't
- **Feature requests** — ideas you'd like to see built
- **Show & tell** — share how your team is using it
- **Q&A** — questions about setup or the AI Agent

---

> **Copyright © 2026 Kyron (Dev_Kyron). All Rights Reserved.**
> This repository is public for portfolio and demonstration purposes only. Unauthorised commercial use, reproduction, or redistribution is prohibited.
