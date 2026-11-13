---
title: "Agents write the code. The same few people review it."
description: Once agents write most of the code, review is the capacity constraint. A queueing model of a few overloaded reviewers, six levers, and why the pull request itself is being redesigned.
date: 2026-11-13
---

By September 2026, more than 40% of pull requests on GitHub started as an agent's first draft, up from 17% in March.[^octoverse] Across 655 companies, agents added 26% more merged pull requests, while the time from review request to approval grew by 56%.[^chen]

Most teams respond by asking reviewers to go faster, or by putting an AI reviewer on every pull request. Both treat review as a ritual that needs more effort. **Review is now the capacity constraint of delivery, and it behaves like a queue served by a few overloaded experts.** I build that model below, derive six levers from it, say where it breaks, and end on why the pull request itself is starting to be redesigned. The model ranks levers. It does not forecast your waits.

## A few experts serve the queue, and they shed depth before it grows

More code is not more delivery. Across more than 500,000 developers, successive AI tools raised commits by a cumulative 240% but releases by only 30%, a pattern the authors call consistent with a "weak link": human bottlenecks further down the chain.[^demirer] Where that link is review, very few people serve it: 83% of reviews go to a reviewer who already knows the code, against 17% under random assignment.[^chen] The queue's real server is the handful of seniors who understand each part of the system, and who also design, unblock and operate it.

Overloaded people do not behave like textbook servers. They speed up first. Hospital staff under load discharge patients earlier, until the speed-up fades and mortality rises.[^kc] Reviewers do the same. One company asked 802 developers to double their pull requests: the share reviewed by a human fell from 89% to 68%, the share with substantive review from 39% to 21%, and comment-free approvals per reviewer doubled. The revert rate stayed flat.[^cmu] It is one firm under a volume mandate, so read it as a mechanism, not an effect size. In a separate experiment, reviewers accepted more incorrect revisions as complexity rose, especially when the code was labelled AI-generated.[^fse]

The flat revert rate is the trap. Reverts count defects caught quickly, and defects were never most of what review did: at Microsoft, only 14% of review comments concerned defects,[^bacchelli] and reviewing raises the number of files a developer knows by 66% to 150%.[^rigby] Shed depth surfaces months later, as a system fewer people understand, while latency and revert dashboards stay green.

So a flat wait under rising volume is not reassurance. Two observables tell you which regime you are in:

- **Queueing:** the wait before first review rises with volume.
- **Depth shedding:** waits stay flat while **human minutes per change**, by size or risk tier, fall, comment-free approvals rise, and a re-review of approved changes finds more than it used to.

Minutes per change can also fall for good reasons, so only the re-review tells a faster review from a thinner one. Run it this way:

- **Who:** someone qualified on the area who did not do the original review and cannot see its comments.
- **What counts:** a problem they would have blocked on. A second reader with hindsight always finds something, so measure a baseline first and watch the trend.
- **How many:** about 200 per period to detect a miss rate doubling from 10% to 20%. Fifteen a week gets there in a quarter, for about five hours a week at twenty minutes each.

It spends the scarce resource, which is why teams skip it. It is the only instrument on the dashboard that measures depth.

## Review wait is set by your seniors' total load

In the queueing regime, the wait before review starts is roughly ρ/(1 − ρ) × (cₐ² + cₛ²)/2 times the review itself (Kingman's approximation), where ρ is the busy share of the reviewer's time and cₐ, cₛ measure how irregular arrivals and review times are. With the textbook baseline (both c = 1), each point of utilisation costs more than the last, and pooling flattens the curve:

| Utilisation ρ | One reviewer per area | Three areas merged, three interchangeable reviewers |
|---:|---:|---:|
| 70% | 2.3× the review time | 0.55× |
| 80% | 4× | 1.1× |
| 90% | 9× | 2.7× |
| 95% | 19× | 6× |

*Wait before review starts, same utilisation per reviewer in both columns. Agent arrivals are bursty and change sizes heavy-tailed, so real numbers are higher: review times twice as irregular multiply the first column by 2.5. This is the shape of the curve, not a forecast.*

The table hides the main variable: review is not a senior's only job. Take one who is 60% busy with their own work and 20% busy reviewing, with tasks of similar length.

**Total load.** Served first-come-first-served, a review sees 80% utilisation, not 20%: it waits 4× its own duration instead of 0.25×. That factor of 16 has nothing to do with review. Taking on-call or standing meetings off your busiest reviewers shortens review latency, provided the freed hours are reserved for review.

**Priority.** Seniors usually finish their task, then take their own work before the review queue. For that case (Cobham's formula for two priority classes), reviews wait about 10× their duration. Make review the first class and the wait falls to about 1×: a tenfold gain at the same load, and the logic behind Google's one-business-day norm.[^google] The price is exact: the senior's own tasks go from waiting 2× their length to 5×. Waiting is moved, not removed. The swap pays wherever a waiting review blocks more than a waiting design doc, which is most places where agents write the code.

**Pickup.** Seniors who review in sessions every G hours add G/2 of wait: four working hours for one session a day, one hour for four. Irregular sessions cost more, by a factor of (1 + c²). With two-hour design blocks and own work first, a 30-minute review waits one to two working days; fixed windows, with reviews taken first in each, bring that to an hour or two without relying on the senior noticing the queue. A window changes when a review starts, not how long it deserves: watch minutes per change when you introduce it.

**Pooling.** It is the one reviewer-side lever that lowers total waiting at the same load: three single-reviewer areas at 90% wait 9×, the same three covering each other 2.7×. Full interchangeability is unrealistic and unnecessary. In manufacturing, plants able to build one extra product each, linked in a chain, capture most of the benefit of full flexibility,[^jordan] and call centres see the same with two skills per agent.[^wallace] For review: a second qualified reviewer per area, with areas overlapping in a chain. A slower second reviewer is still worth using when the queue is long.[^rubinovitch] A shallow one adds throughput by removing the check.

## Six levers, each changing one term of the queue

Read the last column first: the failure mode is what a rollout has to guard against.

| Lever | What it changes | Cheapest form | How it fails |
|---|---|---|---|
| 1. Priority and pickup | Wait per change, at the same load | Review first, in fixed windows; interrupts off the busiest reviewers | Own work slows with no one deciding it should |
| 2. Grow the pool | Total waiting, at the same load | A second qualified reviewer per area, chained | "Qualified" in name only |
| 3. Route by risk, and refuse | How many changes need a human | Fixed path rules, a classifier on the change, fast rejection | No floor for irreversible changes; auto-lane never audited |
| 4. Evidence travels with the change | Human minutes per change | Revert-failing test, stated gaps, a recording, small changes | Evidence produced and graded by the author |
| 5. Stop rework loops | How often work comes back to a human | A contract for the AI reviewer, encoded rules, flake quarantine | AI reviewer that blocks on taste |
| 6. Count only real review | Whether the capacity you see exists | Author ≠ verifier, approval bound to a commit | Agent approval counted as a person's |

Levers 1 and 2 are the previous section. The other four act on the changes.

## Lever 3: send fewer changes to a human

Risk belongs to the change: what it touches, how far it reaches, whether it can be undone. The Claude Code team routes each change to zero, one or two human reviewers with a classifier: "The change sets the tier, not the author."[^claudecode]

Most teams start by auto-merging the safe paths: docs, tests, dependency bumps. Those changes stop waiting, but the queue everyone else stands in barely moves. They are a few percent of pull requests, fewer of review minutes, and review is only part of a senior's load: even a full percentage point of load removed at 80% utilisation shortens the wait by about 6%. Team reports agree, with the caveat that they are self-reported and before-and-after. Miter estimated about 5% of its pull requests were always safe.[^miter] At Corridor, auto-approving safe changes barely moved the median; an AI reviewer approving ordinary pull requests behind required checks took median time to merge from about 21 hours to under 3, with reverts going from about 1.2% to 0.7% on nearly double the volume.[^corridor] Reverts say nothing about depth, so the re-review belongs on the same dashboard.

A routing system has three parts, and teams usually build only the second:

1. **Floors.** Path rules in CODEOWNERS that no score can override: authentication, permissions, migrations, CI configuration, customer data, money. Reversibility replaces a reviewer only where it exists: at Meta, a diff above the 95th risk percentile clears with an expert's approval or a rollback mitigation.[^meta] A flag can be turned off. A payment or a destructive migration cannot.
2. **A classifier above the floors.** Cheap signals first (paths, size, a changed contract or dependency), an LLM judge for the ambiguous middle.
3. **An audit of the automatic lane.** A weekly random sample, reviewed after the fact, is your estimate of the false-negative rate and the only defence against drift. Zero misses in 300 samples means below about 1%.

The sharper form is **refusing work**. LLVM's policy calls a contribution whose review cost exceeds its value "extractive": maintainers ask the author to justify it and label it.[^llvm] Internally, an unwanted agent pull request closed by a rule in thirty seconds costs less than one routed anywhere. A cap on work in progress is the same lever earlier, and helps only if it throttles generation: work waiting in an agent's branch goes stale just the same.

## Lever 4: make evidence the price of entry

An unverified pull request makes the reviewer the first person to understand it. Move the burden of proof to the author, so the reviewer judges evidence and intent instead of re-deriving correctness:

- **A test that fails if the change is reverted.**[^willison]
- **A statement of what could not be built or tested.**[^kernel]
- **Mechanical gates before any human.** Stripe merges more than 1,300 agent pull requests a week; each reaches a person only after local lint and at most two CI runs.[^stripe]
- **A recording of the feature running a scenario written before the code.** A test attests what its author chose to assert; a recording shows what the feature does, and takes a minute to check.[^cursor]
- **A size cap, decided in the plan.** Careful review tops out around 200–400 lines a session,[^smartbear] while the median pull request grew from 68 to 122 lines in a year.[^greptile]

Human minutes buy the most on the plan, before generation.[^honeycomb] The trap is rebuilding the volume problem one floor up: one spec-driven tool turned a small bug into four user stories and sixteen acceptance criteria.[^bockeler]

When a human does read the diff, **the order of reading** decides whether those minutes add anything. In a study with 29 developers, an automated review flagged 42% of injected issues; reviewers kept 89% of what it flagged and concentrated on those lines. The share of issues found stayed at 50% with or without it, and reviews took no less time.[^tufano] The study is small and used GPT-4, but until AI coverage is near complete, an AI review read first narrows attention instead of adding to it. Start with intent and structure, then look at what the AI did *not* flag.

## Lever 5: stop work from coming back to a human

If each pass sends a change back with probability p, it visits the reviewer 1/(1 − p) times: 1.4 visits at p = 0.3, and those visits are load. A loop between an AI reviewer and an authoring agent costs tokens. A loop back to a human costs the scarce resource.

**An AI reviewer writes the next patch**, because the agent always complies. The Claude Code team saw one pull request run more than 50 review rounds overnight, with about 59% of the repeatedly flagged code predating the first pass; convergence changes, including a three-round cap, raised first-round passes from 65% to 78%.[^claudecode] I would put this contract in any AI reviewer's instructions. A block costs evidence, not opinion, and the loop ends by itself:

```markdown
## Blocking findings
Block only if you can state all three:
1. Failure scenario: the input or sequence of events that breaks.
2. Consequence: what the user, data or system loses.
3. Verification: the test or command that demonstrates it.
Anything else is a suggestion, labelled as such, and never blocks.
Do not comment on lines this change did not touch.
After 3 rounds on the same pull request, stop and hand off to a human.
```

**A recurring comment is a bug in the system.** An agent does not learn between sessions, so encode the feedback as a lint rule, a test or a line in AGENTS.md, at the earliest point where the agent can still fix it alone. At Spotify, no pull request opens if a verifier fails when the agent tries to finish.[^spotify]

**Flaky CI is a rework generator.** A human learns which reds to ignore; an agent "fixes" them. At Elastic, an agent repaired failing builds by reverting the dependency upgrade, and its prompt now says to prefer a failed build.[^elastic] Give agents a readable quarantine list and a retry budget of two.

## Lever 6: count only review that really happened

The easiest way to raise throughput is to let the author verify its own work. It removes the check and keeps the green mark.

When an agent writes both code and tests, the tests are the reward it optimises. Given tasks whose tests contradict the specification, GPT-5 exploited the tests in 54% to 76% of cases; an explicit option to stop and flag the contradiction cut 54% to 9%.[^impossible] **A legitimate exit costs one line in a prompt**, and most harnesses still reward finishing over reporting. Beyond that, keep a check out of the author's reach: read the test diff first, put tests and agent instructions under CODEOWNERS, review from a context that did not write the code.

An agent keeps pushing after approval, so an approval must attest to a commit, not a pull request, and an agent's approval is not a person's: it belongs in the automatic lane, behind floors and an audit, never in place of a required human.[^claudecode][^github] That collides with Lever 5: if every push triggers a full re-review, machine loops become human work again. Re-approve the interdiff, the changes since the last approval, and batch pushes before asking.

An unevaluated AI reviewer is unverified capacity too: a new prompt, model or vendor silently changes your safety net. Test it daily on past pull requests that caused incidents,[^claudecode] not on how often it agrees with people.

Finally, the human on the pull request must be an author, not an operator: on agent pull requests, 25.9% of human review comments are instructions to the agent, against 1.6% elsewhere.[^operator] Each heading below forces a statement only an accountable author can make:

```markdown
## What the agent did
## What was verified, and how (link the run, test or recording)
## Where a reviewer should look first
## What I could not verify, or am unsure about
```

## Lever 2 depends on a number AI erodes

Pooling needs qualified reviewers, and AI use can stop people becoming one. In a randomised trial, developers learning a new library with AI scored 50% on a follow-up quiz against 67% without, with the largest gap in debugging.[^anthropic]

Teaching costs senior hours today, and the model says it pays at high load. On an area whose one reviewer is 90% busy, a second qualified reviewer with half their time free cuts the wait from 9× to about 1× the review time; an equally loaded neighbour still cuts it to about 4×. Only reviews need to be shared. The cheapest forms: plan reviews used as teaching, a junior paired with a senior on the human lane, a reading stream of auto-merged changes.

## Measure the queue, not the throughput

Pull request counts measure the stage AI inflates. Measure these against your own baseline:

| Metric | How to get it | Warning sign |
|---|---|---|
| Wait before first review (p50, p90) | Request and first-review timestamps | Rising with volume |
| Arrivals vs completions per week | Opened vs closed, merged or not | Arrivals persistently higher |
| Human minutes per change, by tier | One-click survey on a random 5% of merges | Falling within a tier while volume rises |
| Re-review findings | Blind re-review of a random sample | Rising against baseline: depth is being shed |
| Qualified reviewers per area | Who left substantive reviews over 90 days | One name per area |
| Human rounds per pull request | Human review events | Rising: work comes back. Falling as volume rises: nobody sends it back |
| Auto-lane misses, reverts, incidents | Weekly audit, incident tracker | Rising against baseline |

## The pull request itself is being redesigned

Everything above keeps the pull request and manages the queue in front of it. A growing number of teams and vendors think the unit is wrong.

**The diff arrives without its reasons.** Zed's DeltaDB records every edit between commits together with the agent conversation that produced it, and review happens in that thread: "Pull requests, review threads, and inline comments exist to reattach a discussion to code after the fact." Zed turned pull requests off on Delta's own repository and reports 570 changes landed by 33 people since.[^zed] Entire, founded by GitHub's former CEO Thomas Dohmke, stores the agent's session with each commit: "Git preserves what changed, but nothing about why."[^entire] In queue terms this is Lever 4 moved into version control: intent and evidence travel with the change by construction.

**Branches assume one writer at a time.** Claude Code and Codex can run each agent in its own worktree,[^worktrees] GitButler applies several branches to one working directory,[^gitbutler] and GitHub now lands a stack of pull requests through the merge queue as one group.[^stacks] These attack size and staleness: the longer a change waits, the more lands underneath it.

**Some teams remove the gate.** Pairing has no review queue, post-merge review behind feature flags takes review off the critical path, and StrongDM forbids human code review entirely.[^strongdm]

Three cautions. All of these tools still commit to git: at Zed, "a commit remains the checkpoint you push, pull, and build from." Every number is the vendor's own. And none of them makes attention cheaper: a thread carries more context than a diff, and someone qualified still has to read it. The model gives the question to ask of each: which term does it change? Arrivals, minutes per change, rework, or the number of people able to judge.

## Where the model breaks

- **Your team is not an open queue.** Authors throttle, stale work is abandoned, reviewers shed depth, and agent demand is elastic: shorten the wait and more work starts. Above 100% utilisation there is no steady wait at all; depth, abandonment or generation has to give. Read the multipliers as a ranking.
- **Some risks are not averages.** An irreversible consequence does not trade against waiting time, which is why floors sit outside the routing.
- **Review may not be your constraint.** Release trains, QA or product decisions can cap delivery. Check where inventory accumulates first.
- **AI reviewers are not independent.** Model errors correlate, even across providers.[^kim] Treat AI review as one more detector with unknown overlap, never as a second person.

## Where to start

1. **Check that review is where work piles up**, then baseline wait, flow and rounds for two weeks and start the re-review sample.
2. **Fix priority and pickup before buying anything** (Lever 1).
3. **Write the floors**, route above them, audit the automatic lane, close unwanted agent work fast (Lever 3).
4. **Make evidence the price of entry** (Lever 4), starting with the four-heading template.
5. **Put the AI reviewer under contract** (Levers 5 and 6), evaluated on your own incidents.
6. **Grow the pool** (Lever 2). It pays last, so start pairing in the first week.

A team that treats senior attention as unmetered spends it invisibly: first on waiting, then on shallower review, finally on a system fewer people understand.

*I help engineering teams set this up: measuring the review queue, designing the routing and floors, and putting AI reviewers under a contract tuned on their own incidents. If that is your problem, [let's talk](https://www.linkedin.com/in/leonard-henriquez/).*

[^octoverse]: GitHub, [Octoverse 2026](https://github.blog/news-insights/octoverse/octoverse-commits-pushes-reach-new-highs-in-2026-as-developers-build-with-agents/). GitHub's own count.
[^chen]: Chen and Stratton, [2026 working paper](https://fion.ac/jellyfish.pdf), built on data from Jellyfish, an engineering-analytics vendor.
[^demirer]: Demirer et al., [NBER working paper 35275](https://www.nber.org/papers/w35275), 2026.
[^kc]: KC and Terwiesch, [Management Science](https://pubsonline.informs.org/doi/10.1287/mnsc.1090.1037), 2009.
[^cmu]: CMU and Stanford, [arXiv 2607.01904](https://arxiv.org/abs/2607.01904), 2026.
[^fse]: [The Interaction of Complexity and Provenance in Code Review Decisions](https://conf.researchr.org/details/fse-2026/fse-2026-research-papers/111/The-Interaction-of-Complexity-and-Provenance-in-Code-Review-Decisions-Evidence-from-), FSE 2026, 385 participants.
[^bacchelli]: Bacchelli and Bird, [Expectations, outcomes, and challenges of modern code review](https://web.eecs.umich.edu/~weimerw/2018-481/readings/codereview.pdf), ICSE 2013. 78 of 570 classified comments.
[^rigby]: Rigby and Bird, [Convergent contemporary software peer review practices](https://cabird.com/pdfs/rigby2013convergent.pdf), ESEC/FSE 2013.
[^google]: Google, [Speed of code reviews](https://google.github.io/eng-practices/review/reviewer/speed.html).
[^jordan]: Jordan and Graves, [Management Science](https://pubsonline.informs.org/doi/10.1287/mnsc.41.4.577), 1995.
[^wallace]: Wallace and Whitt, [Manufacturing & Service Operations Management](https://pubsonline.informs.org/doi/10.1287/msom.1050.0086), 2005. Both results come from large systems; for three reviewers, read them as a direction.
[^rubinovitch]: Rubinovitch, [The slow server problem](https://doi.org/10.1017/S0021900200029132), 1985: hold work for the fast server only at low load.
[^claudecode]: Claude Code team, [How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/), 2026.
[^miter]: Miter, [Changing our mind on AI code reviews](https://www.miter.com/life-at-miter/changing-our-mind-on-ai-code-reviews/), 2026.
[^corridor]: Corridor, [Making code review optional](https://www.corridor.dev/blog/making-code-review-optional), 2026. Reverts compared with the seven weeks before.
[^meta]: Paraspatki et al., [FSE Companion 2026](https://dl.acm.org/doi/pdf/10.1145/3803437.3805220).
[^llvm]: [LLVM AI tool policy](https://llvm.org/docs/AIToolPolicy.html).
[^willison]: Willison, [Your job is to deliver code you have proven to work](https://simonwillison.net/2025/Dec/18/code-proven-to-work/), 2025.
[^kernel]: Linux kernel, [guidance for AI coding assistants](https://docs.kernel.org/process/coding-assistants.html), which asks this of assistants that find and fix bugs.
[^stripe]: Stripe, [Minions, part 2](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2), 2026. If CI is still red after the second run, the branch goes back to its human operator.
[^cursor]: Cursor's cloud agents produce videos, screenshots and logs alongside their pull requests: [Cursor](https://cursor.com/blog/agent-computer-use), 2026.
[^smartbear]: SmartBear, [code review at Cisco](https://static1.smartbear.co/support/media/resources/cc/book/code-review-cisco-case-study.pdf).
[^greptile]: Greptile, [State of AI coding](https://www.greptile.com/reports/state-of-ai-coding), 2026, on its own customer base.
[^honeycomb]: Honeycomb tried reviewing the plan and the prompt as well as the code; by Fred Hebert's account velocity held and knowledge sharing improved: [Honeycomb](https://www.honeycomb.io/blog/embracing-code-review-bottleneck), 2026.
[^bockeler]: Böckeler, [Exploring spec-driven development tools](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html), 2025.
[^tufano]: Tufano et al., [Deep learning-based code reviews: a paradigm shift or a double-edged sword?](https://arxiv.org/html/2411.11401v3), ICSE 2025.
[^spotify]: Spotify, [Feedback loops for background coding agents](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3), 2025.
[^elastic]: Elastic, [CI pipelines with an AI agent](https://www.elastic.co/search-labs/blog/ci-pipelines-claude-ai-agent), 2025.
[^impossible]: [ImpossibleBench](https://arxiv.org/html/2510.20270v1), 2025, on its SWE-bench variants.
[^github]: GitHub prevents the person who asked a Copilot agent for a change from approving it: [GitHub Docs](https://docs.github.com/en/copilot/concepts/agents/coding-agent/risks-and-mitigations).
[^operator]: [Agent pull request study](https://arxiv.org/html/2605.02273), 2026.
[^anthropic]: Anthropic, [AI assistance and coding skills](https://www.anthropic.com/research/AI-assistance-coding-skills), 2026. 52 developers.
[^kim]: Kim et al., [ICML 2025](https://arxiv.org/abs/2506.07962v1).
[^zed]: Nathan Sobo, Zed: [Software is made between commits](https://zed.dev/blog/introducing-deltadb) (June 2026), [Introducing Delta](https://zed.dev/blog/introducing-delta) (August 2026) and [Replace PRs with Delta](https://zed.dev/blog/delta-public-beta) (September 2026). Self-reported, on Delta's own repository.
[^entire]: Entire, [Hello Entire World](https://entire.com/blog/hello-entire-world), February 2026.
[^worktrees]: [Claude Code worktrees](https://code.claude.com/docs/en/worktrees); [Codex worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees).
[^gitbutler]: GitButler, [AI agents overview](https://docs.gitbutler.com/ai-agents/overview).
[^stacks]: GitHub, [Stacked pull requests generally available](https://github.blog/changelog/2026-10-06-stacked-pull-requests-generally-available), October 2026.
[^strongdm]: StrongDM, [Software factory](https://factory.strongdm.ai/), 2026.
