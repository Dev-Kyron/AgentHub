# AgentHub

> A lightweight productivity dashboard built to centralise the daily workflow of call centre agents — one tab, every tool, powered by AI.

[![Launch AgentHub](https://img.shields.io/badge/Launch-AgentHub-7c3aed?style=for-the-badge)](https://agenthub.solutions)
![Deployed](https://img.shields.io/badge/Live-agenthub.solutions-7c3aed?style=flat-square)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square)

---

## Core Concept

Call centre agents juggle multiple disconnected platforms throughout their day — CRMs, portals, knowledge bases, scheduling tools, Teams. Every tab switch adds friction and cognitive load.

AgentHub brings everything into a single customisable workspace, organised around how agents actually work: start of day, through the day, end of day. With the AI Assistant unlocked, agents can ask questions and get answers sourced directly from company-approved pages — no guessing, no searching.

---

## Feature Tiers

AgentHub operates in two modes. The core productivity suite is **free for everyone**. The AI Assistant is a **paid feature** unlocked per deployment via a System Unlock Key (SUK).

### Free — Core Productivity Suite

| Feature | Description |
|---|---|
| **Custom Tool Hub** | Three workflow columns (Start of Day, Main Day, End of Day) — add, edit, remove and rename tools |
| **One-Click Boot** | "Boot Up My Day" opens every Start of Day and Main Day tool in new tabs simultaneously |
| **Drag & Drop Reordering** | Organise tools by priority or workflow order within each column |
| **Smart Tool Icons** | Auto-fetches favicons for instant visual recognition of every tool |
| **Scripts & Notes** | Persistent scratchpad for call scripts, talking points, and shift notes — auto-saved |
| **Shift Scheduler** | Rolling 7-day calendar showing real dates — add reminders, follow-ups, and daily tasks |
| **Share & Backup** | Export your full setup as a compressed code — restore it on any machine instantly |
| **14 Colour Themes** | Brand-matched and custom colour themes with live switching |
| **Guided Tour** | Built-in interactive onboarding tour for new users |

### Paid — AI Agent (SUK Required)

| Feature | Description |
|---|---|
| **AI Agent Panel** | Floating chat panel powered by Claude — real-time streaming responses with a live thinking indicator |
| **Source-Specific Search** | Add company URLs as sources; the AI fetches and answers exclusively from that content |
| **Whole-Site Search** | Add a root domain and the AI searches across the entire site — not just one page |
| **Bookmarklet Capture** | One-click browser bookmarklet captures any private/internal page (e.g. Lighthouse) including PDF links — no login required from the server |
| **PDF Support** | PDF links found on captured pages are automatically added and read as sources |
| **Call Centre Optimised** | AI delivers structured, in-depth answers formatted for agents on live calls — never redirects to a website |
| **Cited Answers** | Source URL cited at the end of every source-based answer |
| **Chat History** | Conversation persists across sessions via local storage |
| **SUK Gate** | Access controlled via a System Unlock Key — no key, no AI access |
| **Multi-Client SUKs** | One deployment supports multiple clients — each gets their own key, revoked instantly by removing it |

---

## Screenshots

<table>
  <tr>
    <td><img src="AgentHub_ProductPhotos/Clean_HUD_Example.png" alt="AgentHub clean HUD"/></td>
    <td><img src="AgentHub_ProductPhotos/Creator_Example.png" alt="AgentHub creator workflow"/></td>
  </tr>
  <tr>
    <td><img src="AgentHub_ProductPhotos/Developer_Example.png" alt="AgentHub developer workflow"/></td>
    <td><img src="AgentHub_ProductPhotos/Features_Highlighted.png" alt="AgentHub features"/></td>
  </tr>
</table>

---

## Pricing Packages

The following packages are designed for businesses deploying AgentHub to their teams. The **Free** tier includes all core productivity features with no setup required.

### Free

- All core productivity features
- Unlimited tool columns and entries
- Shift scheduler and notes
- Share & backup system
- 14 colour themes
- No AI features

---

### AI Assistant Packages

The AI Assistant is powered by a secure server-side AI model. All packages are billed monthly per deployment.

| Package | Agents | Monthly Price |
|---|---|---|
| **Starter** | 10 agents | $50–100 |
| **Growth** | 25 agents | $125–200 |
| **Business** | 50 agents | $250–400 |
| **Enterprise** | 100 agents | $500–1,000 |

> Pricing is per deployment. Contact for custom enterprise agreements or volume discounts.

---

## How the AI Assistant Works

1. The floating `🤖` button opens the AI Agent panel
2. Agents enter their **System Unlock Key (SUK)** — validated server-side before any AI access is granted
3. Once unlocked, agents can chat freely or add **company source URLs** via the `🔗` button
4. For private internal tools (e.g. Lighthouse), agents install a **one-click bookmarklet** — click it on any page they're logged into, then paste the captured content into AgentHub as a source
5. PDF links found on captured pages are automatically added and fetched as additional sources
6. With sources active, the AI answers exclusively from that content — structured for live calls with no website redirects
7. Responses stream in real time with a live thinking indicator
8. All API calls are proxied through a serverless function — the Anthropic API key is never visible to end users

---

## Security & Privacy

| Concern | How AgentHub Handles It |
|---|---|
| **API key exposure** | Anthropic API key is stored in Vercel environment variables only — never in client code |
| **AI access control** | SUK validated server-side on every request — changing the key instantly revokes access |
| **Data storage** | All user data (tools, notes, schedule) is stored in browser local storage only — nothing sent to a server |
| **AI data privacy** | Anthropic does not train on API data by default |
| **Source content** | URLs are fetched at query time via Jina Reader and discarded after — not stored |

---

## Getting Started

### Use It Instantly

No install required. All core features are available immediately:

[![Launch AgentHub](https://img.shields.io/badge/Launch-AgentHub-7c3aed?style=for-the-badge)](https://agenthub.solutions)

---

## Purpose

Built to solve a real-world problem observed in a call centre environment. Agents rely on too many disconnected systems — AgentHub reduces that friction by:

- Minimising tab switching and cognitive load
- Centralising tools around the natural rhythm of a shift
- Providing a personalised, shareable workspace per agent
- Giving agents instant, cited answers from company-approved sources via AI

---

## Feedback & Reviews

Have feedback, a feature request, or want to share how you're using AgentHub?

**[💬 Join the Discussion →](https://github.com/Dev-Kyron/AgentHub/discussions)**

- **General feedback** — what's working, what isn't
- **Feature requests** — something you'd like to see added
- **Show & tell** — share how your team is using it
- **Q&A** — questions about setup or the AI Agent features

---

## Roadmap

- [ ] Admin dashboard to manage SUK rotation and usage monitoring
- [ ] Per-agent usage analytics
- [ ] Shared team source libraries (admin-defined URLs pushed to all agents)
- [ ] Cloud sync for cross-device setups
- [ ] Team profiles and onboarding templates
- [ ] Tool categorisation and tagging
- [ ] Optional SSO / authentication layer
- [ ] Mobile-responsive layout

---

> **Copyright © 2026 Kyron (Dev_Kyron). All Rights Reserved.**
> This repository is public for portfolio and demonstration purposes only. Unauthorised commercial use is prohibited.
