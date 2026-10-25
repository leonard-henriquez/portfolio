---
title: Version control for agents
status: exploring
start: 2026
role: Research & design
order: 6
summary: One trunk where every change lands signed by the agent that made it, conflicts resolve as they happen, and any agent’s work can be rolled back. A layer over plain Git, not a replacement.
focus: Git, made for many agents writing at once
stack: [Git, SQLite]
tags: [version control, coding agents]
excerpt: "Git strains when several agents share a codebase: branches diverge in minutes and interleaved work can't be undone cleanly. The design started as a new system, an operation log with a CRDT as state, and moved to a layer over Git: an operation log beside the commits, a CRDT-style merge driver and dependency-aware rollback."
images:
  photo:
    src: ../../assets/photo/valley.jpg
    alt: Green valley in fog
    position: center 70%
  pixel:
    src: ../../assets/pixel/valley.png
    alt: Pixelated green valley in fog
  illustration:
    src: ../../assets/illustration/tundra.jpg
    alt: "Pixel art: a hiker overlooking a wide valley, a river and a volcano"
    position: 30% 60%
    zoom: 1.8
---

## The problem

Git was designed for people working on separate branches who merge now and then. Put several coding agents on the same codebase and that model strains. Branches diverge within minutes, merges arrive late and full of conflicts, and once the work of several agents is interleaved there is no clean way to undo what one of them did.

The question I wanted to answer: what would version control look like if it were designed for many agents writing at once, with a person supervising?

## The idea

One trunk, no long-lived branches. Each change is atomic, lands on the main line immediately, and is signed by the agent that made it. Conflicts are resolved as they happen rather than at merge time. And any agent's contribution can be withdrawn after the fact, even when it sits between other agents' edits.

> "Roll back everything agent B did in the last hour" should be one command.

## From a new system to a layer over Git

The first design was a new system: an append-only log of operations instead of a graph of snapshots, with a CRDT as the materialized state. Rolling back an agent meant replaying the log without its operations. It was clean, and it meant rebuilding everything Git and its ecosystem already do well: transport, remotes, hosting, pull requests, CI.

So the design moved to a layer over Git, in the spirit of Jujutsu and git-branchless. Git keeps storage, history and collaboration. The layer adds agent semantics.

## Design choices

- **Plain Git underneath.** Remotes, GitHub, pull requests and CI keep working. A team can adopt it without changing tools, and the repo stays a normal Git repository.
- **An operation log beside the commits.** A local log in SQLite records each agent's operations and their causal dependencies. Agent identity and metadata travel with each commit as trailers and git notes.
- **A CRDT-style merge driver.** A custom merge driver, registered in `.gitattributes`, merges concurrent agent edits line by line instead of using Git's default three-way merge.
- **Dependency-aware rollback.** Undoing an agent walks the causal graph, reverts its commits in reverse order, and flags the later edits that depended on them for review.

## Trade-offs

- **Two sources of truth.** The Git history and the operation log must stay in sync, which is a source of bugs to design against from day one.
- **Reverts add history.** Rolling back creates new commits rather than erasing old ones. Rewriting history would be cleaner but breaks shared branches.
- **Line-level, not character-level.** Git stores files and lines, so the merge works at that grain. For agents that write blocks of code, that covers most real cases.

## Status

Concept and architecture. The layer approach turns a multi-year rewrite into something one engineer can ship as a first usable version, and anyone can try it without risk because the repo underneath is still Git.
