---
title: Topo
status: shipped
start: 2022
end: present
role: Co-founder & CTO
order: 1
summary: AI agents for B2B outbound sales (YC W24), used by 150+ customers. I designed the platform and led the team as CTO.
focus: AI SDR, Playbooks engine, 1B-document search index
dek: AI agents for B2B outbound sales, from Y Combinator to 150+ customers including Air France and Aircall.
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
stack: [Temporal, Elasticsearch, PostgreSQL, MCP]
tags: [YC W24]
highlights:
  - title: Agent platform
    body: Durable agent workflows on Temporal executing tens of millions of actions per month, with human review before every send and realtime streaming to the product.
    stack: [Temporal, event-driven, streaming]
  - title: Agentic engineering
    body: "Redesigned how we ship around coding agents (Claude Code, Codex, Cursor): strict CI gates, shift-left feedback, auto-fix loops, background agents and automated incident triage."
    result: Merged PRs/month 80 → 318 · bugs per 100 PRs −63% · CI failures 15.7% → 2.4%
  - title: LLM systems
    body: Agents for account discovery, enrichment, personalized outreach, reply handling and in-product chat. Context engineering over CRM data and call transcripts, with LLM evals to measure and improve quality.
    stack: [context engineering, RAG, tool use, evals]
  - title: Playbooks & MCP
    body: A composable, trigger-driven workflow engine (signals → agent steps → sequences) with versioning, test runs and rollback. An MCP server with 170+ tools lets customers run Topo from their own agents.
    stack: [workflow engine, MCP]
  - title: Search at scale
    body: "The data layer: a 1B-document Elasticsearch index with hybrid search and ranking, migrated from Quickwit and fed by durable enrichment pipelines."
    stack: [Elasticsearch, hybrid ranking, PostgreSQL]
  - title: Enterprise readiness
    body: "Made Topo ready for customers like Air France: CRM integrations, SAML SSO, security reviews, and SOC 2 Type 2, which I led."
    stack: [SOC 2 Type 2, SSO, CRM integrations]
---

Since 2022 I've been building Topo: AI agents for B2B outbound sales, used by 150+ customers including Air France and Aircall. Our AI SDR went from $0 to $1M ARR in three months.

As CTO I designed the platform, hired and led the team, and stayed its top committer with 1,205 merged PRs. Under the product: durable agent workflows on Temporal that execute tens of millions of actions a month; Playbooks, a composable, trigger-driven workflow engine; a 1B-document search index on Elasticsearch; and an MCP server with 170+ tools that lets customers run Topo from their own agents.
