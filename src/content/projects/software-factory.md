---
title: Software Factory
status: building
start: 2026
role: Founder
order: 4
summary: Turns websites and apps without APIs into read-and-write MCP tools for agents. A pipeline captures how a site behaves, distills it, generates the connector, runs it, and heals it when the site changes.
focus: Websites without APIs, turned into MCP tools for agents
stack: [TypeScript, MCP]
images:
  photo:
    src: ../../assets/photo/sea.jpg
    alt: Calm sea at sunrise with a distant headland
    caption: Sea, 06:40
    position: center
  pixel:
    src: ../../assets/pixel/sea.png
    alt: Pixelated sea at sunrise
    caption: Sea, 120×74 px
  illustration:
    src: ../../assets/illustration/clouds.jpg
    alt: "Pixel art: a hiker resting on a grassy slope above a sea of clouds"
    caption: Clouds
    position: 10% 50%
    zoom: 2.2
  illustrationPixel:
    src: ../../assets/pixel/clouds.png
    alt: "Pixel detail: a hiker resting above the clouds"
    caption: Clouds, 256×171 px
    position: 9% 49%
    zoom: 3
---

## The problem

Agents can only act where there is an API. Many of the tools people work in every day have none, or only a read-only slice: social networks, vertical SaaS, internal portals, legacy back offices. Agent builders end up writing fragile scrapers by hand, one site at a time, and fixing them every time the site changes.

The Software Factory treats the process of building those connectors as the product. Give it a site, and it produces a typed, tested tool that agents can call over MCP, for writes as well as reads, and repairs it when the site changes.

## Three products in one

"Software factory" covers three things with different lifecycles. Mixing them up is the first architectural risk: you end up with a runtime that generates code, or a factory that has to run in production.

- **The factory.** Development tooling run by coding agents: capture, distillation, generation, evals, repair. It lives in the monorepo and CI and is never on the path of a customer request.
- **The catalog.** Versioned connector packages, one per target site, produced by the factory and reviewed by a person. Each connector is readable code, not an opaque generated blob.
- **The runtime.** The multi-tenant platform that executes capabilities: sessions, rate budgets, execution tiers, secrets, observability, and the MCP and REST surface customers see. No model inference on the critical path.

## The pipeline

1. Capture
2. Redact secrets
3. Distill
4. Generate
5. Replay evals
6. Run
7. Heal

The only arrow that goes back is drift: when a site changes, healing re-enters the pipeline at capture.

**Capture** records network traffic and UI actions in the same session, and correlates them. One recording feeds two implementations of each capability: a fast HTTP path and a slower browser path. The fallback stops being a separate project and becomes a by-product of capture.

**Redaction** is a wall. Session cookies, authorization headers and tokens are replaced by named placeholders on disk before anything else reads the capture. A model never sees a real secret.

**Distillation** is where a model helps. An agent reads the redacted recording and writes a structured spec for each capability: input and output schemas, the chain of calls and how IDs flow between them, required headers, and a normalizer that maps the site's formats to the output schema.

**Generation** is not done by a model. Templates turn the spec into code, so the output is deterministic, reviewable and diffable between versions. The model writes the spec; the generator writes the code.

**Replay evals** are the gate. Offline replays of recorded fixtures run on every commit, online canaries replay read capabilities against the live site a few times a day, and contract tests check that the generated MCP tool accepts and returns exactly what the schema says.

## One contract per capability

A capability is a business intent ("post a comment"), not an endpoint. Every connector is a list of capabilities that follow one small, strict contract. The MCP tool, the SDK and the CLI are all derived from it.

```ts
export const postComment = defineCapability({
  id: "forum.post_comment",
  version: 2,
  input:  z.object({ thread_id: z.string(), body: z.string().max(2000) }),
  output: z.object({ comment_id: z.string() }),
  effect: "write_reversible",   // read | write_reversible | write_irreversible
  auth: "client_session",       // whose account runs it
  rate_class: "comment",        // per-connector budgets
  idempotency: "input_hash",
  dry_run: true,
  impls: { http: ..., browser: ... },
  fixtures: "./fixtures/post-comment/*.json",
  drift_signals: ["schema_mismatch", "http_403", "challenge_page"],
});
```

Three fields carry most runtime decisions. `effect` sets the defaults: reads retry freely, reversible writes need an idempotency key, and irreversible writes ask the calling agent to confirm. `auth` decides whose session runs the call, and a capability never mixes the two, so responsibility is clear per call. `rate_class` points to the connector's pacing policy; a call over budget fails fast with a typed error and a retry time instead of hanging. Errors map to one shared taxonomy (drift, auth expired, rate limited, not found, business rule) that a client agent can act on.

## Running and healing

The runtime is meant to be the most boring part of the system. A router picks the cheapest execution tier the policy allows: plain HTTP, a request issued from inside a live browser session, or full UI automation. A typed error drops the call one tier and counts toward a drift threshold. Temporal holds it together: one workflow per session, one activity per capability call, one workflow per drift incident.

Healing produces pull requests, not hot patches. A drift incident switches the capability to its fallback, re-captures, regenerates, replays the evals and opens a PR. A person merges at first; auto-merge comes once the evals have passed three times in a row.

## How I measure the factory

The first connector is a one-off whatever you do. The factory is proven when the second one takes less than two days and the third less than one. That metric decides every trade-off in the first phase.

It also shapes where the edge is. The best-known targets are the hardest and the most crowded market. A factory's structural advantage shows on the long tail: business portals, vertical SaaS and internal tools that nobody maintains a connector for.

## An agent-first repository

The project is itself built by agents. An orchestrator agent keeps its context for planning and delegates work to sub-agents. The repo follows the same rules as [Self-driving engineering](/projects/self-driving-engineering/): end-to-end tests on real scenarios to reproduce bugs, observability the agents can query, parallel worktrees, shift-left hooks, and a skills system improved through loop engineering.
