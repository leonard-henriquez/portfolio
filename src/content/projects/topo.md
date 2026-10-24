---
title: Topo
status: released
start: 2022
end: present
role: Co-founder & CTO
order: 1
summary: "AI agents for B2B outbound sales, used by 150+ customers including Air France and Aircall. I designed the platform: durable agent workflows on Temporal, the Playbooks engine, a search index of about a billion profiles, and an MCP server with 170+ tools."
focus: AI SDR, agent platform, 1B-profile search index
results:
  - "$0 → $1M ARR in 3 months"
  - 10M+ agent actions a month
  - 1,205 merged PRs
stack: [Temporal, Elasticsearch, PostgreSQL, MCP]
tags: [YC W24]
images:
  photo:
    src: ../../assets/photo/ridges.jpg
    alt: Mountain ridges at dawn
    caption: Ridges, dawn
    position: center 60%
  pixel:
    src: ../../assets/pixel/ridges.png
    alt: Pixelated mountain ridges at dawn
    caption: Ridges, 120×74 px
  illustration:
    src: ../../assets/illustration/trail.jpg
    alt: "Pixel art: a hiker on a rocky mountain trail at sunset"
    caption: Trail
    position: 50% 50%
  illustrationPixel:
    src: ../../assets/pixel/trail.png
    alt: "Pixel detail: a hiker on a rocky mountain trail"
    caption: Trail, 256×171 px
    position: 24% 57%
    zoom: 2.6
links:
  - label: topo.io
    href: https://www.topo.io
excerpt: "As CTO I designed the platform, hired and led the team, and stayed its top committer. I also made Topo ready for enterprise customers like Air France: CRM integrations, SAML SSO, security reviews, and a SOC 2 Type 2 audit that I led."
---

## The problem

Outbound sales for mid-market B2B companies is a long chain of small judgments. Which accounts fit, who to contact there, why now, what to say, how to answer the reply. Each step is easy for a person to do once and expensive to do a thousand times a week.

Topo's bet was that agents could run that chain end to end for a sales team. The condition was that the platform underneath them had to be built like infrastructure. An agent that writes a good email in a demo is easy. An agent that sends the right email to the right person, exactly once, after waiting four days for a reply, on behalf of a customer like Air France, is a distributed system.

## What I built

### A durable agent platform

Every agent run at Topo is a durable workflow on Temporal. A run calls slow models and unreliable third-party APIs, sleeps for days between sequence steps, and must survive deploys and crashes without sending anything twice. Durable execution gives us retries, idempotent steps and replay. On top of it, a person reviews and approves before anything leaves on a customer's behalf, and progress streams to the product in real time so users see agents working. The platform now executes more than ten million agent actions a month.

### Agents that do the sales work

Agents for account discovery, enrichment, personalized outreach, reply handling and in-product chat. Most of the quality gains did not come from prompt wording. They came from what the model sees: the CRM history of the account, transcripts of past calls, and the right tools at the right step. Evals told us whether a change actually helped.

### Playbooks, a workflow engine for go-to-market

Customers kept asking for the same shape of automation: when something happens, find the right people, enrich them, write to them. Playbooks is the engine for that. A playbook chains signals, agent steps and sequences, with versions, test runs and rollback.

The design rests on one split. A model is good at discovery, when nobody knows the steps in advance. A deterministic engine is good at execution that is repeated, irreversible and audited: enrolling contacts, sending messages. A playbook is a recipe that was discovered, then frozen into a versioned, typed and durable unit. AI decides to run it and powers specific model steps with typed outputs. It never drives the sequencing once the recipe is frozen.

I applied a strict simplicity rule to the spec. Before building, I scored 20 candidate workflows from real customer requests. Hiring-signal outbound, always-on prospecting against the ideal customer profile, and closed-lost revival came out on top, and the engine was shaped around what those needed.

### An MCP server with 170+ tools

Customers increasingly run their own agents. The Topo MCP server exposes the product to them: lead search, signals, playbooks, sequences, tasks, replies. Tools that spend credits, contact prospects or switch on automations ask for explicit confirmation.

### Search at scale

Everything starts with finding the right people, so the data layer matters. Topo's search index holds about a billion documents, with hybrid search and ranking, fed by durable enrichment pipelines.

We started on Quickwit, which stores its index on S3 and is very cheap to run. We moved to Elasticsearch when the product needed things an append-only engine does not do: upserts by deterministic ID, index aliases for an atomic swap during monthly re-indexing, and an enrich processor to join company data at ingest. At the time of the migration the people index alone held 416 million documents, about 2.5 TB.

### Ready for enterprise customers

Selling to companies like Air France meant CRM integrations, SAML single sign-on, security reviews, and a SOC 2 Type 2 audit, which I led.

### The team

As CTO I hired and led the engineering team and stayed its top committer, with 1,205 merged pull requests. In 2025 and 2026 I rebuilt how the team ships around coding agents, which is a story of its own: [Self-driving engineering](/projects/self-driving-engineering/).

## What it taught me

- **Agents are distributed systems.** A run is a long-lived workflow calling slow models and flaky APIs. It needs durable execution, retries, idempotent steps and replay, from the first version.
- **Context beats prompts.** The biggest improvements came from giving the model the right history, transcripts and tools at each step. Evals are how you know a change helped.
- **Keep humans where mistakes are expensive.** Review before every send cost little and bought customer trust. Everything that can be checked automatically should be.
