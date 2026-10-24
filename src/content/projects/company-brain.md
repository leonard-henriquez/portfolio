---
title: Company Brain
status: released
start: 2026
role: Built at Topo, now a product spec
order: 3
summary: "A shared Markdown memory that the team and its agents both read and write. At Topo: a Go daemon syncing to S3, compare-and-swap writes, LLM-resolved merges and an MCP server. As a product: provenance, review and permissions for every fact."
focus: Shared memory for a team and its agents
stack: [Go, S3/R2, MCP, Temporal]
images:
  photo:
    src: ../../assets/photo/night.jpg
    alt: Mountain ridge under a night sky
    position: center 70%
  pixel:
    src: ../../assets/pixel/night.png
    alt: Pixelated mountain ridge under a night sky
  illustration:
    src: ../../assets/illustration/lake.jpg
    alt: "Pixel art: a hiker looks at a turquoise lake below snowy peaks"
    position: 60% 40%
    zoom: 1.8
---

## The problem

Topo's agents needed business context that no codebase holds: who the customers are, what was decided and why, what was said on calls, what worked last quarter. Wikis and RAG tools keep that knowledge in their own databases, behind an API. Coding agents work on files, so for them the knowledge might as well not exist.

The first spec made a Git repository of Markdown files the source of truth. It broke down quickly. The ingestion server would have had to clone the repo for every write. Raw material such as call transcripts grows without limit and ends up on every laptop. People and agents edit the same files at the same time, and a line-based merge is too coarse for that. When a design needs that many workarounds, the primitive is wrong.

## The approach

Keep Markdown files on disk as the source of truth, in the "LLM wiki" pattern: an `AGENTS.md` at the root, conventions for structure and frontmatter, and an MCP server so any agent can query and edit the brain. Replace Git as the sync layer with something built for continuous writes from many sources.

Scheduled jobs on Temporal ingest meeting transcripts and compact the brain overnight. Through loop engineering, agents turn what they learn on the job into knowledge and reusable skills that the next agent reads.

## How sync works

A small Go daemon watches the local folder and syncs it with an S3 or R2 bucket, so every teammate and every agent sees the same tree. Local state lives in SQLite. The write path is where the design choices are:

1. File saved locally
2. Hash compared, no-op if unchanged
3. Conditional PUT on the ETag
4. On conflict, three-way merge
5. LLM resolves the rest
6. Quarantine if still unsure

- **Compare-and-swap on object storage.** Each upload carries `If-Match` with the ETag the edit was based on. If someone wrote in between, S3 answers 412 and we know there was a concurrent edit instead of guessing. This replaces a rejected `git push`.
- **The ancestor is always recoverable.** With bucket versioning on, the version the local edit started from can be fetched by ID. That gives the common ancestor for a real three-way merge with `git merge-file`, and clean context for the model when the merge needs judgment.
- **Nobody's edit is lost silently.** When neither the merge nor the model resolves a conflict cleanly, the user's file is left untouched and the other version is written next to it as a `.conflict` file, with a notification. The same rule Syncthing follows.
- **Safe by construction.** Local writes go to a temporary file and are renamed atomically, so a crash never leaves a half-written note. Hash-based idempotence stops sync loops when an editor touches a file without changing it.
- **A full audit log.** Every resolution records the path, the three hashes, the result, who resolved it (merge, model or person) and the diff size, stored in the bucket. When an agent merges badly, you can trace it back.

The design is sized for what the brain really is: up to about a hundred users, with most files append-only. That is what makes a simple daemon on top of object storage enough, without a CRDT engine or a virtual file system.

## From internal tool to product

Running it at Topo showed what a team needs before it trusts a shared memory written partly by agents. The product version of the Company Brain adds three things to every fact: where it came from, who reviewed it, and who may read it. Provenance, review and permissions are what turn a pile of notes into something a team can rely on.
