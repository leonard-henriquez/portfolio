---
title: Agent Control Plane
status: building
start: 2026
role: Author
order: 5
summary: "A control plane for background coding agents: any harness, any sandbox, self-hosted by small teams. Launching a task is decoupled from where it runs. It grows out of the background-agent platform I built at Topo."
focus: Open-source orchestration for background coding agents
stack: [TypeScript, Postgres]
tags: [open source]
images:
  photo:
    src: ../../assets/photo/valley.jpg
    alt: Green valley in fog
    caption: Valley, fog
    position: center 70%
  pixel:
    src: ../../assets/pixel/valley.png
    alt: Pixelated green valley in fog
    caption: Valley, 120×74 px
  illustration:
    src: ../../assets/illustration/lake.jpg
    alt: "Pixel art: a hiker looks at a turquoise lake below snowy peaks"
    caption: Lake
    position: 35% 25%
    zoom: 1.8
  illustrationPixel:
    src: ../../assets/pixel/lake.png
    alt: "Pixel detail: a turquoise lake below snowy peaks"
    caption: Lake, 256×171 px
    position: 80% 70%
    zoom: 2.4
---

## The problem

A small team that works with coding agents soon runs many sessions in parallel, and wants them off the laptop: in the cloud, reachable from a phone, still running when the lid closes. The tools that offer this each bundle one harness, one sandbox provider and one hosted backend, often with usage-based pricing on top.

That is a bad trade for a team that already pays for model subscriptions, already has a cloud account, and changes harness every few months because the best one keeps changing.

## Where it comes from

At Topo I built our own background-agent platform: Temporal as the control plane, OpenCode as the agent server, sandboxed environments, and an always-on machine for headless agents. It worked, and it was the base of [how the team shipped](/projects/self-driving-engineering/).

Before generalizing it, I benchmarked the orchestrators on the market against what a team like ours needs: sessions reachable from anywhere, bring-your-own subscription, our own sandbox provider, infrastructure we can host or expose ourselves, and room to customize. None covered the set. Each one was built around a product decision that a team cannot undo: its harness, its runtime or its cloud.

## The approach

Decouple launching a task from where it runs. The control plane schedules, tracks and supervises agent sessions. Harnesses, execution environments and clients plug in through interfaces. Small composable plugins extend it without forking.

1. Clients: web, desktop, mobile, API
2. Control plane: tasks, sessions, policies
3. Harness: any coding agent
4. Sandbox: any provider or your own

## Design choices

- **Built for background agents.** Sessions run for a long time and outlive the client that started them. Durable execution sits behind an interface, with Postgres as the default backend so self-hosting needs nothing exotic.
- **Teams in the core.** Multi-user from the first version. Hooks, policies and secrets belong to the team, not to each laptop.
- **Plugins over forks.** Composable plugins and API endpoints let a team add its own loops and checks without maintaining a fork.
- **Reuse over reinvention.** Existing open-source runners and session protocols where they fit. The value is in the plane, not in another agent.
- **Open core.** A self-hostable core under an open license, with a hosted offer later for teams that would rather not run it.

## Product loops on top

A control plane knows every task, every session and its cost. That makes it the right place for the loops that turned out to matter most at Topo:

- tasks started from product signals, such as an issue tracker or analytics events;
- preview URLs for each session, with optional database branching;
- proof videos that show a feature working, attached to the change;
- cost-per-task benchmarks on a team's real issues, so model and harness choices rest on data.

## Who it is for

Small engineering teams that want an agnostic, self-hostable system in their own infrastructure, and that would rather own the plane than rent a bundle. The project is in active development.
