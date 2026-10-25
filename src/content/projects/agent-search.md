---
title: Search for agents
status: exploring
start: 2026
role: Research & design
order: 8
summary: "An S3-native engine shaped around how agents query: many precise, iterative queries that mix full text, vectors and filters."
focus: S3-native search shaped around agent queries
results:
  - "400M+ documents indexed at Topo"
stack: [S3, BM25, vectors, MCP]
tags: [search, market study]
excerpt: "The opening is the interface: a file system with ls, glob, grep and read, plus semantic queries, at S3 scale, with an ephemeral, forkable index per agent session. I started with a market study rather than code, and set what would make it a yes: design partners, a benchmark on a real agent workload, and an engine builder on the team."
images:
  photo:
    src: ../../assets/photo/night.jpg
    alt: Mountain ridge under a night sky
    caption: Ridge, night
    position: center 70%
  pixel:
    src: ../../assets/pixel/night.png
    alt: Pixelated mountain ridge under a night sky
    caption: Night, 120×74 px
  illustration:
    src: ../../assets/illustration/tundra.jpg
    alt: "Pixel art: a wide valley with a snow-capped volcano"
    caption: Volcano
    position: 80% 35%
    zoom: 2.2
  illustrationPixel:
    src: ../../assets/pixel/tundra.png
    alt: "Pixel detail: a snow-capped volcano above the clouds"
    caption: Volcano, 256×171 px
    position: 80% 34%
    zoom: 2.6
---

## The problem

Search engines were designed for a person typing a few words and reading ten results. Agents search differently. They send many precise queries in bursts, often in parallel, refine them as they go, and mix full text, vectors and structured filters. They read results as input for the next step, so a result has to be exact and fit in a token budget.

Coding agents show the pattern clearly. The leading ones search code with `grep`, `glob` and `read` rather than embeddings, and search takes a large share of their turns. Outside code, the same agents now need to search millions of files and documents that do not fit on a laptop.

## Where it comes from

At Topo I ran a people and company index of more than 400 million documents, first on Quickwit, which keeps its index on S3, then on Elasticsearch. I know how cheap S3-native search can be, and how much an engine designed for people costs to bend toward machine workloads.

## The market

I started with a market study rather than code. Vectors plus BM25 on object storage for AI apps is already a category, and Turbopuffer leads it. AWS now stores vectors in S3 directly, which pushes the price of plain vector storage toward the floor. A frontal clone would be squeezed from both sides.

The opening is the interface. No one sells the thing agents already know how to use, a file system with `ls`, `glob`, `grep` and `read`, plus semantic queries, as a product at the scale of S3.

## Positioning

> The index behind your agents' grep, at S3 scale.

Each agent session gets a workspace that is searchable immediately, can be forked, and answers regex, BM25 and semantic queries. It is stored on S3, exposed with the shell and MCP semantics models already use, and billed per session and per fan-out.

## What could differentiate it

| Axis | What the customer gets | Role |
| --- | --- | --- |
| Agent-native interface | File-system commands with exact grep semantics, plus semantic search, over millions of files | Core of the offer |
| Open format, local and cloud | The same index read by a library inside the agent's sandbox and by the managed service | Core of the offer |
| Ranking learned from traces | The engine learns which results agents actually opened and used, per tenant | Moat to build from day one |
| Ephemeral, forkable workspaces | An index per session, branch or commit, copy-on-write, with fast cold starts | Required |
| Native fan-out | Dozens of sub-queries in one call, deduplicated, billed as one | Launch feature |
| Token-sized answers | Excerpts sized to a token budget, with structure and stable cursors | Launch feature |
| Lowest price | Cheaper than the leader | Avoid as a pitch |

## The trap

My starting thesis was that coding agents make new infrastructure cheap to build. That is true for everyone: competitors, customers who build in-house, and a leader that ships every month. So the moat will not be the engine. It has to be the open format and its ecosystem, distribution through agent platforms, and owning one precise workload.

## What would make it a yes

Reading the study as an investor would: strong timing, a clear wedge, defensibility still to build. Before going further I want three design partners committed in writing, a benchmark on a real agent workload that beats grep and the leader on cold latency and tokens, and someone on the team who has shipped a search or storage engine.
