---
title: Durable execution on S3
status: exploring
start: 2026
role: Research & design
order: 7
summary: "What Temporal would look like if S3 were the database: durability on the server, thin clients in any language, primitives for agents that run for hours."
focus: Object-storage-native alternative to Temporal
results:
  - "≈100 ms durability overhead per step"
  - "No database cluster to run"
stack: [S3, R2, GCS, MinIO]
tags: [durable execution]
excerpt: "Event sourcing on object storage: each workflow's history is an append-only series of log segments in the bucket, written with conditional writes, so S3 is the coordination layer and self-hosting is one binary and one bucket. Durability moves to the server, clients become thin, and the primitives are shaped around agents that run for hours."
images:
  photo:
    src: ../../assets/photo/dunes.jpg
    alt: Ochre dunes under a pale sun
    caption: Dunes, noon
    position: center
  pixel:
    src: ../../assets/pixel/dunes.png
    alt: Pixelated ochre dunes under a pale sun
    caption: Dunes, 120×74 px
  illustration:
    src: ../../assets/illustration/tundra.jpg
    alt: "Pixel art: a hiker overlooking a wide valley, a river and a volcano"
    caption: Valley
    position: 80% 70%
    zoom: 2
  illustrationPixel:
    src: ../../assets/pixel/tundra.png
    alt: "Pixel detail: a river winding through a wide valley"
    caption: Valley, 256×171 px
    position: 82% 72%
    zoom: 2.4
---

## The problem

Durable execution is what keeps a long agent run alive through crashes, deploys and flaky APIs. I have relied on it in production at Topo with Temporal, and I would not build agents without it. But today's engines carry real weight. Temporal needs a database cluster and usually Elasticsearch next to it. Hatchet needs Postgres and a message queue, DBOS needs Postgres. And much of the durability logic lives in thick client SDKs, which makes every new language expensive to support.

The question: what would Temporal look like if S3 were the database?

## The thesis

Object storage is already the most durable store most teams have. It is strongly consistent, it supports conditional writes, it scales without operations work, and it costs almost nothing at rest. The same idea already reshaped other categories: WarpStream did it for streaming, Quickwit for search. Nobody had done it for durable execution.

## Architecture

1. Workers run your code
2. Long-poll a single server binary
3. Server appends events to S3
4. State rebuilt by replay

- **The log is the database.** Everything is event sourcing. Each workflow's history is an append-only series of small log segments in the bucket; its current state is derived by replaying them, from the last checkpoint.
- **Conditional writes as consensus.** Segments are written with `If-None-Match`, so two writers can never create the same one. Partition ownership uses leases stored as objects and renewed with `If-Match`. No Raft, no Paxos: S3 is the coordination layer. A single node is enough; more nodes add capacity, not durability.
- **Payloads stay out of the log.** Large step results go to the bucket as separate objects, and the log keeps a reference. Segments stay small, recovery stays fast, and history has no size limit.
- **Any S3-compatible store.** AWS, R2, GCS, MinIO, Tigris. Self-hosting is one binary and one bucket.

## Trade-offs, chosen on purpose

| What you gain | What you accept |
| --- | --- |
| No database to run | About 100 ms per step instead of a few milliseconds |
| Cost that follows usage | Throughput bounded by object-store write rates |
| One binary to deploy | Slower recovery after a restart than a hot standby |
| Portability across clouds | No SQL queries over history |

For agents these costs barely register. A step that calls a model or an external API already takes hundreds of milliseconds or more, so 100 ms of durability overhead disappears in the noise. The target is teams that want durability without operating a cluster, the same relation WarpStream has to Kafka.

## The second iteration: built for agents

A first version of the design followed Temporal's model closely. The second one changes two things.

**Durability moves to the server.** The client becomes a thin contract: receive a task, report a result, heartbeat. That makes a new language SDK a small piece of work rather than a port of a complex runtime.

**The primitives are shaped around agents**, coding agents and business agents, rather than batch jobs. The candidates I am designing for:

- steps that run for hours, with heartbeats and safe resumption;
- waiting for a person for days without holding resources;
- large contexts and artifacts passed between steps by reference;
- streaming partial output to a user interface while the run stays durable.

## Status

Research and design, with an open-source release as the goal. The [Agent Control Plane](/projects/agent-control-plane/) keeps its durable execution behind an interface for exactly this reason.
