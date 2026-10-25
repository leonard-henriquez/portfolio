---
title: Self-driving engineering
status: released
start: 2025
end: 2026
role: Architecture & rollout, at Topo
order: 2
summary: "Rebuilt how a five-person team releases software around coding agents: a harness that lets agents install, run, test and observe the whole product, strict CI gates, and a path from customer feedback to a preview, a demo video and a one-click release."
focus: Releasing software around coding agents
results:
  - "Merged PRs a month 80 → 318"
  - "Bugs per PR −63%"
  - "CI failures 15.7% → 2.4%"
  - "Feedback to production < 10 h at p80"
stack: [Claude Code, Codex, Cursor, OpenCode, Temporal, GitHub Actions]
excerpt: "Coding agents could write code faster than we could read it, so I invested in what surrounds them: reproducible environments, instructions in the repo, observability agents can query, checks moved left and auto-fix loops. Each proposed change came with a preview URL and a recorded demo, so review moved from reading diffs to checking behavior."
images:
  photo:
    src: ../../assets/photo/sea.jpg
    alt: Calm sea at sunrise with a distant headland
    position: center
  pixel:
    src: ../../assets/pixel/sea.png
    alt: Pixelated calm sea at sunrise with a distant headland
  illustration:
    src: ../../assets/illustration/clouds.jpg
    alt: "Pixel art: a hiker resting on a grassy slope above a sea of clouds"
    position: 60% 40%
    zoom: 1.8
---

## The problem

Topo's engineering team was five people serving a product that was growing fast. Hiring more reviewers would not have kept up. Customer feedback took too long to turn into shipped code, and human code review had become the bottleneck.

Coding agents could write code faster than we could read it. The question was how to let them do more of the work without letting quality slide. My answer was to stop treating the agent as the product and invest in what surrounds it: the environment it runs in, the checks it must pass, and the proof it must bring back.

## Two connected systems

### A self-driving codebase

The goal was simple to state: an agent can install, run, test and observe the whole product on its own, then correct its own work against fast automated checks.

- **Reproducible environments.** One command brings up the full stack, locally or in a sandbox, so an agent never has to guess how to run something.
- **Instructions in the repo.** `AGENTS.md` files describe conventions where the code lives, so every harness (Claude Code, Codex, Cursor) reads the same rules.
- **Observability agents can read.** Logs, traces and errors an agent can query, plus browser-based testing, so it can see what its change did instead of assuming.
- **Feedback moved left.** Fast mechanical checks run in hooks before a commit. AI review in CI only covers what tools cannot check. Strict CI gates became the definition of done.
- **Auto-fix loops.** When CI fails, an agent reads the logs and pushes a fix through GitHub Actions. A daily triage job does the same for production errors from Sentry and Datadog.

### From customer feedback to production

The second system closes the loop with customers. Feedback goes in one end, and an engineer gets a change they can judge by its behavior at the other.

1. Customer feedback
2. Checked against product direction
3. Agent builds the change in a sandbox
4. Preview, screenshots, demo video
5. Engineer inspects
6. One-click release

At p80, feedback reached production in under ten hours.

Background agents ran on our own infrastructure: Temporal as the control plane, OpenCode as the agent server, sandboxed runs, and an always-on machine for headless agents. Each proposed change came with a preview URL and a recorded demo, so routine human code review became optional. Review did not disappear. It moved from reading diffs to checking behavior.

## Results

With the same team, merged pull requests went from about 80 to 318 a month. Bugs per pull request fell by 63%, and the share of failing CI runs dropped from 15.7% to 2.4%. More code and fewer bugs came from the same change: agents got feedback early and often instead of humans catching problems late.

## What I learned

- **The harness does the work.** Model upgrades helped, but environments, checks and instructions made the difference between an agent that guesses and one that verifies.
- **Autonomy is earned with feedback.** Every check an agent can run on itself is a review a human no longer needs to do. Strict gates gave us more freedom, not less.
- **Route models, don't trim steps.** When I analysed a month of background-agent sessions, cost grew linearly with the number of steps for any given model, but the cost per step varied about 25 times between models. Long sessions only looked like they compounded because they were mostly run on the most expensive model. Choosing the model per task is the lever.

This work is the starting point of two later projects: the [Agent Control Plane](/projects/agent-control-plane/), which generalizes the background-agent platform, and the [Company Brain](/projects/company-brain/), which gives agents the business context the code does not hold.
