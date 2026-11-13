---
title: "Code review is a queue now: a capacity model for teams that ship with agents"
description: Once agents write most of the code, review is the capacity constraint. A queueing model of a few overloaded reviewers, the six levers it ranks, and where it breaks.
date: 2026-11-13
---

By September 2026, more than 40% of pull requests on GitHub started as an agent's first draft, up from 17% in March, by GitHub's own count ([GitHub Octoverse](https://github.blog/news-insights/octoverse/octoverse-commits-pushes-reach-new-highs-in-2026-as-developers-build-with-agents/)). Across 655 companies, agents added 26% more merged pull requests, while the time from review request to approval grew by 56% (Chen and Stratton, a [2026 working paper](https://fion.ac/jellyfish.pdf) built on data from Jellyfish, an engineering-analytics vendor).

Most teams react in one of two ways: they ask reviewers to go faster, or they put an AI reviewer on every pull request. Both treat review as a quality ritual that needs more effort. I think the better model is operational. **Once agents write most of the code, review becomes the capacity constraint of the delivery system, and it behaves like a queue served by a few overloaded experts.** Below, I build that model from the evidence, derive six levers from it, give the artifacts to put them in place, and end with where the model breaks. The model ranks the levers. It does not forecast your waits.

## The scarce resource is a few experts, and they bend instead of breaking

More code is not more delivery. Across more than 500,000 developers, successive AI tools raised commits by a cumulative 240% but releases by only 30%, a pattern the authors call consistent with a "weak link": gains attenuated by human bottlenecks further down the production chain ([Demirer et al., NBER 2026](https://www.nber.org/papers/w35275)).

Where that step is review, it is served by very few people. In the Chen and Stratton data, 83% of reviews go to a reviewer who already knows the code; assigning reviewers at random would give 17%. The real server of the queue is the handful of people who understand a given part of the system, often two or three, usually seniors who are also designing, unblocking and operating it.

People do not behave like the fixed-speed servers of textbook queues. Operations researchers measured this in hospitals: as load rose, staff sped up, partly by discharging patients earlier; under sustained overload the speed-up faded and mortality rose ([KC and Terwiesch, 2009](https://pubsonline.informs.org/doi/10.1287/mnsc.1090.1037)). The review data below shows the same two responses: reviewers under load first get faster by getting shallower, and waits grow where they don't. Expect both in your own numbers. Part of the 56% rise in approval time is the queue growing; larger changes and extra rounds account for the rest. A wait that stays flat while volume rises is not reassurance by itself. It may be the other response, and the next section gives the test.

## Overloaded reviewers shed depth before the queue grows

The clearest evidence comes from one company that asked its engineers to double their pull requests ([CMU and Stanford, 2026](https://arxiv.org/abs/2607.01904)). Across 802 developers, the share of pull requests reviewed by a human fell from 89% to 68%. The share that received substantive review fell from 39% to 21%. Approvals with no comment per reviewer doubled. The revert rate stayed flat. This is one firm under an explicit volume mandate, so read it as a mechanism rather than an effect size. A 2026 experiment with 385 participants adds the cognitive half: as complexity rose, reviewers accepted more incorrect revisions, especially those labelled as AI-generated ([FSE 2026](https://conf.researchr.org/details/fse-2026/fse-2026-research-papers/111/The-Interaction-of-Complexity-and-Provenance-in-Code-Review-Decisions-Evidence-from-)).

The flat revert rate is the trap. Reverts count defects caught quickly, and defects were never most of what review was spent on. At Microsoft, only 14% of 570 classified review comments concerned defects ([Bacchelli and Bird, ICSE 2013](https://web.eecs.umich.edu/~weimerw/2018-481/readings/codereview.pdf)); a comment count is not a value count, but the larger categories were code improvements (29%: better practices, dead code, readability) and understanding the change. Doing review raises the number of files a developer knows about by 66% to 150% ([Rigby and Bird, ESEC/FSE 2013](https://cabird.com/pdfs/rigby2013convergent.pdf)). When depth is shed, the loss surfaces months later as a system fewer people understand, while latency and revert dashboards stay green.

Shallower review on low-stakes, reversible changes can be the right trade. The problem is that overload makes the trade for you, uniformly, on the changes that matter as much as on the ones that don't. Two observables tell you which regime you are in:

- **Queueing regime:** the time a change waits before its first review rises with volume.
- **Depth-shedding regime:** waits stay flat while **human minutes per change**, normalised by change size or risk tier, fall, comment-free approvals rise, and a random sample of approved changes, re-reviewed carefully after merge, turns up more problems than it used to.

The last signal matters because minutes per change can also fall for good reasons, such as better evidence arriving with each change. Only the re-review sample tells a faster review from a thinner one, so it is worth specifying:

- **Who:** someone qualified on the area who did not do the original review, and who does not see its comments. Where an area has a single qualified reviewer, borrow the nearest neighbour and accept a noisier reading; that area is also where Lever 2 should start.
- **What counts:** a problem the re-reviewer would have blocked on. A careful second reader with hindsight always finds something, so the level means little. Measure a baseline first and watch the trend.
- **How many:** about 200 per comparison period to detect a doubling of the miss rate, say from 10% to 20%. Fifteen a week gets there in a quarter, after a first quarter spent on the baseline. If a careful re-review takes twenty minutes, that is five hours a week across the whole organisation.

It consumes the scarce resource, which is why most teams skip it. It is also the only instrument on the dashboard that measures depth.

## Review wait is set by your seniors' total load

This section covers the queueing regime. Kingman's approximation gives the wait *before review starts* as roughly ρ/(1 − ρ) × (cₐ² + cₛ²)/2 times the review itself, where ρ is the share of the reviewer's time that is busy and cₐ, cₛ are the coefficients of variation of the gaps between arrivals and of review times: how irregular they are. The table uses the textbook baseline of random arrivals and exponential review times (both c = 1). Notice two things: each extra point of utilisation costs more than the last (going from 70% to 80% adds 1.7× the review time, going from 90% to 95% adds 10×), and pooling three areas flattens the curve dramatically.

| Utilisation ρ | Wait before review starts: one reviewer per area | Three areas' queues merged, three interchangeable reviewers |
|---:|---:|---:|
| 70% | 2.3× the review time | 0.55× |
| 80% | 4× | 1.1× |
| 90% | 9× | 2.7× |
| 95% | 19× | 6× |

*Mean waits for the standard one-server and three-server queues (M/M/1, M/M/3), same utilisation per reviewer in both columns. Agent arrivals are bursty (overnight runs, fleet-wide changes) and pull request sizes are heavy-tailed, so real cₐ and cₛ exceed 1 and raise every number, roughly in proportion to (cₐ² + cₛ²)/2: review times twice as irregular as the baseline multiply the first column by 2.5. The table shows the shape of the curve, not a forecast: it assumes review time stays fixed, which is exactly what depth shedding breaks.*

The table hides the most important variable for a senior engineer: review is not their only job. Take a senior who is 60% busy with their own work (design, incidents, their own changes) and 20% busy reviewing, with reviews and own tasks of similar length. Three things set how long a review waits.

**Total load.** If reviews are served first-come-first-served alongside everything else, the relevant utilisation is 80%, not 20%: a review waits about 4× its own duration instead of 0.25×. That factor of 16 has nothing to do with review. Taking an on-call rotation or a standing meeting load off your busiest reviewers is a review-latency intervention, but only if the freed hours are reserved for review: a senior's own backlog will otherwise absorb them.

**Priority.** Seniors usually finish what they are doing before picking up a review, and pick up their own work before the review queue. Queueing theory has a formula for exactly that case, a non-preemptive queue with two priority classes (Cobham's formula): the low-priority class waits R / ((1 − ρ₁)(1 − ρ₁ − ρ₂)), where ρ₁ is own-work load, ρ₂ review load, and R the average unfinished work a review finds in progress when it arrives, counted as zero when the senior is idle. In this example that is about 10× the review time: another 2.5× on top of total load. The model also gives the reverse lever: make review the high-priority class and the wait falls to about 1× the review time, a tenfold gain with zero change in load. The absolute figures depend on how irregular task lengths are; the ratios do not. That is the logic behind Google's norm that one business day is the maximum time to respond to a review, and that a reviewer not in the middle of focused work should respond shortly after a request comes in ([Google engineering practices](https://google.github.io/eng-practices/review/reviewer/speed.html)). The price is exact, not vague: load-weighted waiting is conserved, only moved. With tasks of equal length, every hour reviews stop waiting is an hour own work starts waiting, and the senior's own tasks go from waiting 2× their length to 5×. The swap pays wherever a waiting review blocks more value than a waiting design doc, which is most places where agents are producing code. Make that trade deliberately, per area.

**Pickup policy.** Priority assumes the senior checks the queue every time they finish a task. Many instead review in sessions every G hours, and then a change arriving at a random time waits G/2 for the next session, plus a little more behind the changes that arrived with it. One session a day adds about four working hours; four fixed short sessions add one. Irregular sessions raise the average wait itself, not only its spread: by a factor of (1 + c²), where c is the coefficient of variation of the gaps. More sessions cost context switches into deep work. What decides the rule is how long the senior's own tasks run. With short tasks, picking up reviews between them is fast. With two-hour design blocks and own work first, the same model has a 30-minute review waiting one to two working days. Review-first pickup or four fixed sessions both bring that down to an hour or two, and sessions are the rule that does not depend on the senior noticing the queue. For most seniors that means fixed review windows, with reviews taken first in each window. The rule changes when a review starts, not how long it deserves: watch minutes per change when you introduce it, because a window that is too short turns a waiting problem into a depth problem.

**Pooling lowers the total amount of waiting at the same load.** Priority redistributes it, lowering the average wait per item only when the items served first are the shorter ones, and pickup policy adds a term of its own. In the table, three single-reviewer areas at 90% utilisation wait 9×; the same three reviewers able to cover each other's areas wait 2.7×. Full interchangeability is unrealistic, since most reviews go to the familiar reviewer for good reasons. It is also unnecessary. Manufacturing research found that limited flexibility, with each plant able to build one extra product and plants and products linked into a single chain, captures most of the benefit of full flexibility ([Jordan and Graves, 1995](https://pubsonline.informs.org/doi/10.1287/mnsc.41.4.577)); call-centre research found the same for agents trained on just two skills in the right combinations ([Wallace and Whitt, 2005](https://pubsonline.informs.org/doi/10.1287/msom.1050.0086)). Both results come from large systems; for a team of three reviewers, read them as a direction, not a number. For review, that means a second qualified reviewer on every area, arranged so that areas overlap in a chain. Qualified is the operative word. A slower second reviewer is still worth using when the queue is long: queueing theory's "slow server problem" says to hold work for the fast server only at low load ([Rubinovitch, 1985](https://doi.org/10.1017/S0021900200029132)). A shallow one is a different problem, outside the queueing model: it adds throughput by removing the check.

## Every lever changes one term of the queue

The model gives six levers. The first two were derived above and act on the reviewers: the first costs a decision and some of the seniors' own throughput, the second costs teaching time. The other four act on the changes, and each has a section below; Lever 2 gets one after them, because AI erodes it. Read the table for what each lever changes and how it fails, because the failure mode is what a rollout has to guard against:

| Lever | What it changes | Cheapest form | How it fails |
|---|---|---|---|
| 1. Priority and pickup | Wait per change, at the same load | Review first, in fixed windows; interrupts taken off the busiest reviewers | Own work slows with no one deciding it should |
| 2. Grow the pool | Total waiting, at the same load | A second qualified reviewer per area, chained | "Qualified" in name only |
| 3. Route by risk, and refuse | How many changes need a human | Fixed path rules plus a classifier on the change; fast rejection | Rules missing for irreversible changes; auto-lane never audited |
| 4. Evidence travels with the change | Human minutes per change | Revert-failing test, stated gaps, a recording of the feature, small stacked pull requests | Evidence produced and graded by the author |
| 5. Stop rework loops | How often work comes back to a human | Deterministic rules, a contract for the AI reviewer, flake quarantine | AI reviewer that blocks on taste |
| 6. Count only real review | Whether the capacity you see exists | Author ≠ verifier, approval bound to a commit | Agent approval counted as a person's |

## Lever 3: send fewer changes to a human

The unit of risk is the change: what it touches, how far its effects reach, and whether it can be undone. The Claude Code team routes each change to zero, one or two human reviewers with a classifier, under a simple rule: "The change sets the tier, not the author" ([Claude Code team, 2026](https://claude.dev/blog/solving-code-review-at-anthropic/)).

Most teams start by auto-merging the obviously safe paths: docs, tests, dependency bumps. In a pure review queue at 95% utilisation, removing 4% of the load would nearly halve the wait. In practice the safe changes themselves stop waiting, but the queue everyone else stands in barely moves, and the total-load model says why: trivial changes are a few percent of pull requests and a smaller share of review minutes, and review is only part of a senior's load. Even if the safe paths were a full percentage point of a senior's load, which is generous, the wait at 80% total utilisation would shorten by about 6%.

The team reports agree, with a caveat that applies to all of them: they are self-reported, before-and-after, from teams that chose to publish. Miter estimated that only about 5% of its pull requests fell into the always-safe categories ([Miter, 2026](https://www.miter.com/life-at-miter/changing-our-mind-on-ai-code-reviews/)). At Corridor, auto-approving the mechanically safe changes barely moved the median. What moved it was an AI reviewer approving ordinary pull requests behind required checks (CODEOWNERS on sensitive paths, a security scan, an approval that goes stale on any new push): median time to merge went from about 21 hours to under 3, and reverts from about 1.2% in the seven weeks before to about 0.7%, on nearly double the weekly volume ([Corridor, 2026](https://www.corridor.dev/blog/making-code-review-optional)). These numbers are consistent with risk routing not increasing quickly caught defects. Reverts depend on someone noticing, and fewer humans were reading, so they say nothing about depth: the re-review sample belongs on the same dashboard.

A routing system has three parts, and teams usually build only the second:

1. **Floors.** Fixed path rules, in CODEOWNERS, that no score can override: authentication, permissions, migrations, CI configuration, customer data, money. Reversibility can stand in for a reviewer only where it exists: at Meta, an author can clear a diff above the 95th percentile of risk with either an expert's approval or a rollback mitigation ([Paraspatki et al., FSE Companion 2026](https://dl.acm.org/doi/pdf/10.1145/3803437.3805220)). A flag can be turned off. A payment, a data leak or a destructive migration cannot.
2. **A classifier for everything above the floors.** Start with cheap signals (paths, size, whether a shared contract or dependency changed), and add an LLM judge for the ambiguous middle.
3. **An audit of the automatic lane.** Each week, have a human review a random sample of auto-merged changes after the fact. That sample is your estimate of the false-negative rate, and the only defence against a classifier that drifts. Size it for the rate you need to exclude: zero misses in 300 samples means below about 1%, and one miss below about 1.6%. At 25 a week that is a quarter of sampling.

The lever has a sharper form that teams forget: **refusing work**. LLVM's AI policy calls a contribution whose review cost exceeds its value "extractive": maintainers ask the author to justify why it is worth reviewing, label it `extractive`, and can escalate to have the thread locked ([LLVM](https://llvm.org/docs/AIToolPolicy.html)). Internally, an unwanted agent pull request closed by a rule in thirty seconds costs less than one routed anywhere. A cap on work in progress is the same lever applied earlier, and it helps only if it throttles generation: work waiting in an agent's branch goes stale just the same.

Routing also removes the small changes on which juniors used to learn a codebase; keep a post-merge reading stream of auto-lane changes for them.

## Lever 4: make evidence the price of entry

An unverified pull request transfers its cost to the reviewer, who becomes the first person to actually understand it. The fix is to move the burden of proof to the author, before the change enters the queue, so the reviewer judges evidence and intent instead of re-deriving correctness from lines:

- **A test that fails if the change is reverted**, bundled with the change ([Willison, 2025](https://simonwillison.net/2025/Dec/18/code-proven-to-work/)).
- **An explicit statement of what could not be built or tested**, as the Linux kernel's guidance asks of AI assistants that find and fix bugs ([kernel.org](https://docs.kernel.org/process/coding-assistants.html)).
- **Mechanical gates run before review.** At Stripe, more than 1,300 agent pull requests are merged each week; each reaches a human only after local lint and at most two CI runs, and goes back to its human operator if CI is still red after the second ([Stripe, 2026](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2)).
- **A recording of the feature running an acceptance scenario written before the code.** A test attests only what its author chose to assert; a recording shows whether the feature does what was intended, and takes a minute to check. Cursor's cloud agents produce videos, screenshots and logs alongside their pull requests, and those agents create more than 30% of the pull requests Cursor merges ([Cursor, 2026](https://cursor.com/blog/agent-computer-use)).

Size is evidence too. The median pull request grew from 68 to 122 lines between mid-2025 and mid-2026 ([Greptile, 2026](https://www.greptile.com/reports/state-of-ai-coding)), while careful review tops out around 200–400 lines per session ([SmartBear and Cisco](https://static1.smartbear.co/support/media/resources/cc/book/code-review-cisco-case-study.pdf)). A size cap trims the long tail of review times, which is what cₛ in Kingman's formula measures. Splitting does not reduce the work; it lets a reviewer read each piece carefully. The decision has to be made before generation, in the plan.

Human minutes buy the most on that plan. Fred Hebert's team at Honeycomb tried reviewing the plan and the prompt as well as the code; by his account velocity held and knowledge sharing improved, and the team now keeps the full process for the changes that warrant it ([Honeycomb, 2026](https://www.honeycomb.io/blog/embracing-code-review-bottleneck)). The trap is to rebuild the volume problem one floor up: one spec-driven tool turned a small bug into four user stories and sixteen acceptance criteria ([Böckeler, 2025](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)).

When the human does read the diff, **the order of reading** decides whether those minutes add anything. In a controlled study with 29 developers, an automated review flagged 42% of the injected issues; reviewers kept 89% of what it flagged in their own final review and concentrated on those lines. The median share of issues found stayed at 50% with or without the AI, and reviews took no less time ([Tufano et al., ICSE 2025](https://arxiv.org/html/2411.11401v3)). The study is small and used GPT-4, and anchoring will cost less as AI coverage rises. Until coverage is near complete, an AI review read first narrows human attention instead of adding to it. The human pass should start with intent and structure, then turn to what the AI did *not* flag. AI is more useful before that pass than after it: a change summary, a map of what the change touches, a diff of the tests shown first.

## Lever 5: stop work from coming back to a human

If each review pass sends a change back with probability p, each change visits the reviewer 1/(1 − p) times on average. Second passes are usually shorter, so this overstates the load, but the shape holds: at p = 0.3, every change costs about 1.4 visits, and because those visits are load, their effect on waiting is more than proportional. A loop between an AI reviewer and an authoring agent costs CI time and tokens, not senior minutes. A loop that returns to a human costs the scarce resource. The goal is to push correction into the machine loop, and to stop that loop from generating work of its own.

**An AI reviewer writes the next patch.** In a loop of agents, every remark becomes work, because the agent always complies. The Claude Code team saw one pull request run more than 50 review rounds overnight, and about 59% of the code flagged repeatedly predated the first pass. A set of convergence changes, including a three-round cap, raised the share of pull requests that pass after one review-and-fix round from 65% to 78% ([Claude Code team, 2026](https://claude.dev/blog/solving-code-review-at-anthropic/)). I would put this contract in any AI reviewer's instructions. Notice that it makes a block cost evidence rather than opinion, and that the loop ends by itself:

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

**A recurring comment is a bug in the system.** An agent does not learn between sessions; feedback that is not encoded will arrive again. The durable answer is a lint rule, a test or a line in AGENTS.md, with an error message that tells the agent how to fix the problem, placed at the earliest point where the agent can still fix it alone. At Spotify, no pull request opens if a verifier fails when the agent tries to finish ([Spotify, 2025](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3)). Judge each check by the human handoff it removes, not by the warnings it emits.

**Flaky CI is a rework generator.** A human learns which reds to ignore. An agent takes every red seriously, retries, and eventually "fixes" the test or the change: at Elastic, an agent tended to repair failing builds by reverting the dependency upgrade, and its prompt now tells it to prefer a failed build over a version downgrade ([Elastic, 2025](https://www.elastic.co/search-labs/blog/ci-pipelines-claude-ai-agent)). Give agents a quarantine list they can read, a retry budget of two, and the rule that each retry must bring new information.

## Lever 6: count only review that really happened

The easiest way to raise review throughput is to let the author verify its own work. It removes the check and keeps the green mark.

When an agent writes both the code and its tests, the visible tests are the reward it optimises. ImpossibleBench gave models coding tasks whose tests contradict their specification: on the SWE-bench variants, GPT-5 exploited the tests in 54% to 76% of cases, and Claude models did so mainly by modifying the tests ([ImpossibleBench, 2025](https://arxiv.org/html/2510.20270v1)). The most useful result is the cheapest: giving the model an explicit option to stop and flag the contradiction cut GPT-5's rate from 54% to 9%. **Making failure a legitimate, easy exit costs one line in a prompt**, and most agent harnesses still reward finishing over reporting. Beyond that, keep a check out of the author's reach: read the diff of the tests first, put tests and agent instructions under CODEOWNERS, review with a fresh context that did not write the code.

An agent keeps pushing after approval, so an approval must attest to a specific commit, not to a pull request. The Claude Code team requires a new approval after any agent push and does not count an agent's approval as a person's; GitHub prevents the person who asked a Copilot agent for a change from approving it ([GitHub Docs](https://docs.github.com/en/copilot/concepts/agents/coding-agent/risks-and-mitigations)). This collides with Lever 5: if every push triggers a full re-review, machine-side loops become human work again. Re-approve the interdiff, the changes since the last approval, and batch post-approval pushes before asking.

An AI reviewer you have not evaluated is unverified capacity too. Changing its prompt, model or vendor silently changes your safety net. The Claude Code team turns past pull requests that caused incidents into an evaluation set the reviewer runs against daily, and classifies how authors respond to each finding: fixed, wrong, intended, unimportant. Validate the reviewer on your own reverts and incidents, not on how often it agrees with people.

Finally, the human on the pull request must be an author, not an operator. On agent pull requests, 25.9% of human review comments are instructions addressed to the agent, against 1.6% on human pull requests ([agent PR study, 2026](https://arxiv.org/html/2605.02273)). A short template helps, because each heading forces the human to state something only an accountable author can:

```markdown
## What the agent did
## What was verified, and how (link the run, test or recording)
## Where a reviewer should look first
## What I could not verify, or am unsure about
```

## Lever 2 depends on a number AI erodes: qualified reviewers per area

In a randomised trial with 52 developers learning a new library, those using AI scored 50% on a follow-up quiz against 67% without it, with the largest gap in debugging, the skill a reviewer needs most. The seven who used the AI only to ask conceptual questions scored 65% ([Anthropic, 2026](https://www.anthropic.com/research/AI-assistance-coding-skills)).

Growing reviewers has a price: every hour a senior spends teaching raises today's utilisation. The model says the trade is worth it at high load. On an area whose one reviewer is 90% busy, a second qualified reviewer with half their time free cuts the wait before review from 9× to about 1× the review time. Even an equally loaded neighbour cuts it to about 4×, provided each review goes to whichever of the two has less work in hand. Only the reviews need to be shared; each person's own work can stay theirs. The cheapest forms are plan reviews used as teaching, a junior paired with a senior on the human-reviewed lane, "explain first" passes on unfamiliar code, and a three-line note on why any new dependency or shared contract exists.

## What changes at 100 engineers and more

Small teams can run all of this from one CODEOWNERS file. Larger organisations hit three extra problems:

- **Ownership of the rules.** Floors and the classifier prompt are a shared control, so they belong to a platform or developer-experience team, versioned and reviewed like code. Each product team owns its area's pool and cadence.
- **Compliance.** SOC 2's change-management criterion expects changes to be authorised, tested and approved before deployment; it does not specify that a human reads every diff, though auditors usually expect the approver to be someone other than the author. Your auditor will want the routing policy, the floors, the commit-bound approvals and the auto-lane audit documented as the control. Agree on it with them before rollout.
- **Measurement at scale.** Self-logging does not survive at 120 engineers. Sample instead: a bot on merge asks the reviewers of a random 5% of pull requests how many minutes they spent. One click, a few hundred answers a quarter: enough to see a shift of 20% to 30% across the organisation, since review minutes are heavy-tailed. Compare medians, and sample more heavily on the tiers you care about.

## Measure the queue, not the throughput

Counting pull requests measures the stage AI inflates mechanically. Each row below pairs a quantity from the model with the warning sign that should trigger action; the post-merge re-review sample is the one most teams lack.

| Metric | How to get it | Warning sign |
|---|---|---|
| Wait before first review (p50, p90, working hours) | Review-request and first-review timestamps | Rising with volume: utilisation too high |
| Arrivals vs completions per week | Pull requests opened vs closed (merged or not) | Arrivals persistently above completions: the queue is growing |
| Human minutes per change, by size or tier | Sampled survey on merge | Falling within a tier while volume rises: faster or thinner review. A rise after routing is expected, since the easy changes leave the human lane |
| Post-merge re-review findings | Blind re-review of a random sample of approved changes | Rising against its own baseline: depth is being shed |
| Qualified reviewers per area | Who left substantive reviews in each area over 90 days, not only approvals | One name per area: no pooling |
| Human rounds per pull request | Review events, human only | Rising: work keeps coming back. Falling while volume rises: reviewers have stopped sending work back |
| Abandoned pull requests | Closed unmerged after waiting | Rising: the queue sheds work silently |
| Auto-lane audit misses, reverts, change-caused incidents | Weekly sample, incident tracker | Rising against a baseline measured before any change |

Little's law gives a sanity check: while the open count is stable, average time in a stage equals the average number of pull requests sitting in it divided by the number leaving it per day. Apply it to each stage (awaiting review, in rework, awaiting CI) and you see where inventory sits. Your own baseline beats any industry benchmark.

## Where the model breaks

**It is an open queue, and your team is not.** The formulas assume changes arrive regardless of delay and reviewers work at a fixed rate. In practice authors throttle, stale work is abandoned, reviewers shed depth, and a senior always has a backlog, so utilisation is partly a choice. Agent demand is also elastic: shorten the wait and more work gets started, so the levers may buy throughput instead of shorter waits unless generation is capped. Above 100% utilisation there is no steady wait at all: depth, abandonment or generation has to give, and the only choice is which. Read the multipliers as a ranking of levers, not as predictions of your waits.

**It optimises averages, and some risks are not averages.** An irreversible consequence does not trade against waiting time, which is why floors sit outside the routing logic.

**Review may not be your constraint.** Releases can be capped by release trains, QA, product decisions or demand. Improving a step that is not the bottleneck buys no throughput, as Goldratt's theory of constraints says.

**Some teams dissolve the queue instead of managing it.** Pair or mob programming has no review queue. Post-merge review behind feature flags takes review off the critical path. StrongDM forbids human code review entirely ([StrongDM, 2026](https://factory.strongdm.ai/)). The capacity model does not settle that debate. It makes the cost of each position explicit.

**Independent reviewers are rarely independent.** Errors of large models are correlated, even across providers and architectures ([Kim et al., ICML 2025](https://arxiv.org/abs/2506.07962v1)). Treat AI review as one more detector with unknown overlap, never as a second person.

## Where to start

The order matters, because each step makes the next one measurable:

1. **Check that review is where inventory accumulates.** Then measure two weeks of baseline for the wait, flow and rounds rows of the table above, and start the slower ones running: the re-review sample, reviewers per area, incidents.
2. **Fix priority and pickup before buying anything** (Lever 1): fixed review windows, a review-first norm on the busiest areas, and interrupt load taken off the most-requested reviewers.
3. **Write the floors** in CODEOWNERS, route everything above them by what the change touches, audit the automatic lane weekly, and close unwanted agent work fast (Lever 3).
4. **Make evidence the price of entry** (Lever 4), starting with the four-heading template.
5. **Put the AI reviewer under contract** (Levers 5 and 6), with an evaluation set built from your own incidents.
6. **Grow the pool** (Lever 2): a second qualified reviewer for every area that has one, chained so areas overlap. It is the only lever on the reviewer side that lowers total waiting at the same load, and the slowest. It comes last in this list only because its results do: start pairing in the first week and expect the effect within a quarter.

A team that treats senior attention as unmetered spends it invisibly: first on waiting, then on shallower review, and finally on a system fewer people understand. Measured, prioritised and routed, the same attention goes much further.

*I help engineering teams set this up: measuring the review queue, designing the routing and floors, and putting AI reviewers under a contract tuned on their own incidents. If that is your problem, [let's talk](https://www.linkedin.com/in/leonard-henriquez/).*
