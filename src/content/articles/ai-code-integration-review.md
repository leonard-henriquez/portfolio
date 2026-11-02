---
title: Rethinking Code Integration and Review in the Age of AI
description: What our Topo workflow taught me about producing evidence, keeping agents responsible through CI, and deciding where human judgment belongs.
date: 2026-11-02
---

At Topo, merged pull requests grew from about 80 to 318 per month between two three-month windows in 2025 and 2026. Our measure of opening-to-merge delay stayed close to five hours. We were integrating much more code, but that did not tell us how much human attention each change still required.

A coding agent can finish an implementation in minutes, then spend hours between CI failures, automated review comments, corrections and another request for approval. Sometimes a developer writes no code and still supervises the entire process. Sometimes a change merges quickly and creates work for whoever is on call next week.

**I think the next step in AI-assisted engineering is to make the evidence needed to integrate a change cheaper to produce and easier to judge.** Faster generation helps. The harder work is deciding what must be true before integration, arranging feedback so the agent can establish it, and recognizing the decisions that still need a person.

At Topo, that meant investing in the environment around coding agents: runnable services, fast checks, repairable diagnostics, automated review and previews. This article develops the reasoning behind that work. It follows a migration control from detection to acceptance, uses our historical data to examine what improved, and develops the experiment I would run next. Our data do not establish a causal productivity gain or quantify human time saved.

## 1. More merged code is a useful result, with an incomplete explanation

Topo is a B2B sales automation product. The repository in this analysis combines a Python backend and a TypeScript frontend, with generated API clients, database migrations and background workflows. A change can be valid within one package and still break the product at a boundary. I use PR for pull request and CI for continuous integration: the automated checks that run on proposed repository changes.

The main historical extract covers March 2024 through August 27, 2026: 4,842 commits, 3,494 merged PRs and 19 code snapshots. A later extraction used for PR survival sees 4,129 opened PRs and 3,535 merges. These are different snapshots, so I keep their denominators separate. The charts below use the monthly series supplied with the analysis; the methodology appendix identifies the files and windows.

For the throughput comparison, I use May–July 2025 and June–August 2026. Merged PRs per month rise from 80.3 to 318.3. Over those same windows, the mean of the monthly median PR-open-to-merge delays moves from 4.99 to 4.52 hours. August is partial. The number of active PR-author accounts also rises from four to seven or eight. These are repository-level changes, not a fourfold increase in productivity for a fixed team.

The two panels deliberately use different units. One measures output volume; the other measures elapsed time. Neither is a stopwatch on the reviewer.

<figure>
  <a href="/articles/ai-code-integration-review/01-throughput-and-delay.svg" target="_blank" rel="noopener" title="Open full-size figure">
    <img src="/articles/ai-code-integration-review/01-throughput-and-delay.svg" alt="Merged PRs increase while the monthly median opening-to-merge delay remains variable, with three-month averages around five and four and a half hours." width="864" height="590.4" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 1. Topo integrated more PRs without a comparable reduction in opening-to-merge delay. Monthly observations, May 2025–August 2026; August through the 27th. The annotated comparisons are arithmetic means of three monthly values, including means of medians for delay. Author population and task mix changed.</figcaption>
</figure>

The distinction matters beyond our team. In the October 2026 revision of *AI Writes Faster Than Humans Can Review*, He and colleagues study 802 developers and 196,212 PRs at one company. PR throughput per developer eventually doubled, while load per reviewer also doubled. Their observational design cannot provide the certainty of random assignment, and PR throughput remains a proxy for productivity. But the result gives a concrete reason to examine what happens after code generation.[^review-load]

Other evidence makes universal claims harder. METR's early-2025 randomized study of 16 experienced maintainers completing 246 tasks found that access to the tools tested increased completion time by 19%, despite participants believing they were faster. In its February 2026 update, METR reported that selection effects and concurrent agent use made newer estimates unreliable. The old result is not a verdict on every subsequent tool; the update is not proof of a specific new speedup.[^metr]

I read these studies as a warning about the question we ask. “Can the agent write this?” and “Does this workflow help the team deliver useful software?” have different answers, units and experimental designs. DORA's analysis of AI-assisted development similarly identifies verification overhead and an association between higher AI adoption, higher throughput and greater delivery instability.[^dora]

Our own data are useful because they let us inspect parts of the workflow. They are not sufficient to explain the entire improvement. Models, tooling, contributors, tasks and review conventions changed together.

## 2. Human attention can move without disappearing

The natural place to look for AI's cost is the review screen. It is also an incomplete place to look.

A developer spends attention specifying the task, noticing that the agent misunderstood it, recovering a broken environment, deciding whether a finding matters, examining the result, and later investigating a regression. If we remove a manual approval but add frequent supervision, we have changed the shape of the work. We have not necessarily reduced it.

I would account for attention across five activities: task preparation, supervision during execution, review and integration decisions, post-merge repair, and maintenance of the automation itself. For a defined cohort of tasks, the relevant numerator includes the human effort spent on failed and abandoned attempts as well as successful ones. The denominator should be accepted outcomes, with task type and quality requirements held visible.

That accounting is a proposal, not a number we can reconstruct from GitHub. A PR can sit open overnight with no one working on it. A developer can spend ten concentrated minutes explaining an invariant to an agent without creating a commit. A ticket can remain open for three days and take twenty minutes to fix.

The difference also changes what to optimize. Waiting time affects how long a customer waits and how much unfinished work accumulates. Active attention limits how many tasks a person can supervise. Interruptions make that attention more fragmented. Machine cost constrains how much checking and retrying we can afford. These variables interact, but substituting one for another hides the trade-off.

Consider a small illustrative workload: a team can integrate ten changes a day with its current review capacity. Increasing generation from eight to sixteen ready changes a day creates six additional candidates each day unless integration capacity or task selection changes. Launching more agents is then likely to produce a larger queue. This is arithmetic under an assumed fixed capacity, not a measurement from Topo.

The queue creates secondary work. Branches become stale. A reviewer has more context to reconstruct. The authoring agent must reconcile changes made while it waited. Evidence gathered against yesterday's base may need refreshing. The team can spend its new generation capacity keeping old candidates current.

This suggests a practical control: limit work in progress at the integration boundary. Keep agents responsible for bringing existing changes to a decision before starting unlimited new work. Track age in the queue, the number of ready candidates and repeated invalidation of checks. There is little value in keeping every agent busy if the extra activity mainly produces more work for the same constrained reviewer.

## 3. Fast feedback changes who can resolve a problem

Moving a check earlier is often described as a latency optimization. The more interesting effect is that it can change who does the work.

When an agent sees a useful diagnostic while it is editing the relevant code, it can often correct the issue inside the same task. When the same issue is first discovered by a person in final review, it creates a handoff: explanation, another agent session or human edit, another push, another CI run, another decision.

At Topo, we moved mechanical feedback into earlier stages. The historical inventory shows Ruff in CI in January 2025, a per-file agent linting script in July 2025, broader agent hook integration in February 2026, and further pre-commit and pre-push coverage through the summer. Biome and the Go-based TypeScript checker were part of making feedback practical inside the agent's working loop. We do not have before-and-after timings that isolate either tool's contribution.

The inventory below shows where configured controls existed. Repeated placements are intentional: local feedback makes corrections cheaper, while CI enforces requirements when a local hook is absent or bypassed.

<figure>
  <a href="/articles/ai-code-integration-review/02-check-placement.svg" target="_blank" rel="noopener" title="Open full-size figure">
    <img src="/articles/ai-code-integration-review/02-check-placement.svg" alt="The inventory of configured checks expands from CI into agent guards, post-edit hooks, pre-commit and pre-push checks." width="864" height="489.6" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 2. By the Q3 2026 snapshot, 26 configured check placements were positioned before CI: eight pre-tool guards, eight post-tool checks, five pre-commit and five pre-push checks. Counts describe placement, not unique rules, execution frequency or quality coverage. One rule can appear at several stages.</figcaption>
</figure>

“Earlier” still needs a boundary. Suppose an agent changes an API definition and then its generated client. Halfway through, the repository is inconsistent by design. A full cross-package check after the first file may produce an actionable-looking error about work the agent has not finished. If the agent responds by undoing the first edit, feedback has made the task harder.

The right boundary is the earliest coherent state at which a check can answer a useful question. File-local formatting can run after an edit. A type check may need a completed group of edits. A compatibility check needs both sides of an interface. A migration integration check needs the proposed migration and the current base.

The stages differ in what they know:

| Point in the workflow | Useful question | Typical response |
| --- | --- | --- |
| Before a tool action | Is this operation allowed on this class of file or resource? | Prevent an invalid operation and name the supported path |
| After a coherent edit | Did this edit introduce a local mechanical error? | Return a focused diagnostic or deterministic fix |
| After a task step | Do the affected components still agree? | Run affected tests, types and dependency checks |
| Before review | Does the complete change satisfy the task and known constraints? | Inspect the diff, verify behavior and attach evidence |
| Before integration | Does this candidate work with the changes already accepted? | Check the combined candidate and reject stale evidence |

A faster checker only helps if its answer reaches the agent in a usable form. A thousand-line log can contain the exact error and still be a poor interface. The diagnostic should identify the violated invariant, the relevant artifact and the supported way to investigate or repair it.

Google's work on static analysis calls attention to effective false positives: technically valid but unhelpful findings also consume trust and attention. That distinction becomes especially useful when the recipient can respond by automatically changing code.[^static-analysis]

This is also where existing engineering infrastructure pays twice. A reproducible setup and a stable test command help both people and agents. Spotify's Honk initially inserted agent-generated transformations into an existing fleet-management platform. It did not need to replace repository targeting, PR creation and integration just because the source of a patch changed.[^spotify-one]

## 4. A detector and a blocking reviewer have different error costs

An early detector can say, “This might violate an invariant; investigate.” A blocking reviewer says, “This change must not proceed until this is resolved.” Those are different products, even if both call the same model.

An early warning can be useful with modest precision when the authoring agent can dismiss a false alarm cheaply. That tolerance has a limit: a convincing but incorrect warning can make the agent modify correct code. A final blocker has a larger potential footprint. It may trigger a new patch, fresh validation, another review and a human arbitration request.

**The cost of a finding depends on the action it causes.** Counting findings without observing those actions is an incomplete evaluation of the reviewer.

For an early detector, I want to know whether the author and detector together reach the right result more reliably or with less attention. For a gate, I want to know whether its blocking findings identify material defects worth delaying integration. In both cases, missed defects matter. The acceptable trade-off depends on the affected system, the quality of the evidence and the reversibility of the next step.

Our historical CI data show why those meanings must remain separate. An earlier aggregate mixed ordinary workflow failures, AI-review rejections and cancelled executions. The resulting line looked like a single measure of broken code. We decomposed the runs by workflow category and excluded cancellations and skips from that calculation.

In October 2025, the core test, lint, type and related validation category recorded 267 failures across 2,193 runs: 12.18%. In August 2026, it recorded 310 failures across 11,756 runs: 2.64%. The frequently quoted 15.6% → 2.4% series excludes AI review but still includes housekeeping and preview workflows. It answers a broader question.

The AI-review workflow follows a different curve. In April 2026 it failed 675 of 1,202 runs, or 56.16%, while core CI failed 6.69%. A failed AI-review run could mean a finding, an incomplete review or no verdict. It is not a distinct buggy PR, and a high failure rate does not establish that the findings were correct.

The following chart keeps these three populations visible, with the same percentage scale:

<figure>
  <a href="/articles/ai-code-integration-review/03-ci-decomposition.svg" target="_blank" rel="noopener" title="Open full-size figure">
    <img src="/articles/ai-code-integration-review/03-ci-decomposition.svg" alt="Core CI failure rates fall while AI-review failure rates spike; other workflow failures form a third, distinct series." width="864" height="504" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 3. A single CI failure rate concealed different processes. Core validation, semantic review and other automation have separate denominators. October starts on the 8th; August ends on the 27th. These are workflow-run failure rates, not defect rates or reviewer precision.</figcaption>
</figure>

Our August repository snapshot also exposes a policy I would reconsider: both Important and Nit findings caused the review job to fail. This snapshot does not explain April's spike, and we could not verify historical merge enforcement. It does show the actual condition used by the job:

```bash
if [ "$IMPORTANT" -gt 0 ] || [ "$NIT" -gt 0 ]; then
  echo "::error::Code review found $IMPORTANT important issue(s) and $NIT nit(s). Please fix them before merging."
  exit 1
fi
```

*Source: `.github/workflows/ai-review.yml`, commit `4756dfd8c417`, lines 189–192. This describes the historical policy; it does not demonstrate the accuracy or value of either finding category.*

I would now make the blocking contract more selective. A blocker should describe the failure scenario, locate the relevant code, explain the consequence and provide evidence or a concrete verification path. Optional cleanup belongs outside the integration gate. A strict naming or formatting requirement, where justified, is usually better expressed as a mechanical rule with a clear fix.

The important refinement is to make the escalation earn its cost. A reviewer that catches more real problems but generates enough unnecessary patches can make the whole workflow worse. Without finding-level adjudication and downstream measurements, our block-rate chart cannot tell us where the historical gate sat on that trade-off.

Spotify offers a useful parallel. Its Honk verification loop adds an LLM judge to catch deviations from the original task, including unwanted changes to tests. The team reported that the judge vetoed about a quarter of sessions and that the agent corrected course about half the time. It also explicitly said it had not yet invested in evaluations for the judge. Those numbers describe behavior; they do not establish the judge's precision.[^spotify-feedback]

## 5. The agent should own the correction loop, with a clear stopping point

Opening a PR is a convenient artifact. It is not necessarily a completed task.

If the agent can run tools, inspect logs and edit code, the ordinary correction loop should remain inside its responsibility. It should watch the required checks, distinguish an actionable failure from an infrastructure problem, repair what it can and verify the repair. Otherwise a person becomes a message bus between systems that already expose machine-readable results.

Our Alembic migration guard illustrates the interface this needs. Alembic represents database schema changes as a revision graph. Two branches can each add a valid migration after the same parent. Each branch has one head in isolation, but combining them creates two heads. A text merge can succeed while the migration graph needs reconciliation.

Topo's guard checks that combined state. When it detects multiple heads, the PR comment tells the author how to produce a merge revision. This is the repair sequence embedded in the historical workflow, rather than a command invented for this article:

```bash
git fetch origin main
git merge origin/main
task db:merge
git add packages/backend/app/db/migrations/versions/
git commit -m "Merge Alembic heads"
git push
```

*Source: the comment body in `.github/workflows/migration-guard.yml`, commit `4756dfd8c417`. The command resolves revision-graph divergence in this repository; it does not establish that the migrations are operationally safe.*

The diagnostic removes one kind of ambiguity: the agent does not have to discover the team's preferred reconciliation procedure. It still needs to inspect conflicts, run the check again and examine any behavior the graph check cannot establish.

To make the invariant inspectable, I ran the archived Topo head checker against four small synthetic revision graphs. Branch A adds revision `a` after `base`; branch B adds `b` after the same `base`. The combined graph contains both. The reconciled graph adds `merge_ab`, whose parents are `a` and `b`. These are new demonstration fixtures, not a reconstructed production incident. Here is the actual checker output, with its exit status:

```text
branch_a   exit=0  heads=a
branch_b   exit=0  heads=b
combined   exit=1  heads=a,b
reconciled exit=0  heads=merge_ab
```

*A successful branch check does not establish the combined invariant. Reproduction: `scripts/demonstrate_migration_guard.py`, using the archived `alembic_heads.py` at commit `4756dfd8c417`. Exit 0 means the fixture has at most one head; it is not a migration-safety verdict.*

The final line is where judgment becomes important again. A migration can have one head and still hold a table lock, run an expensive backfill or break compatibility with an older application. The graph repair creates the conditions for further verification; it does not complete that verification.

The workflow also documents why it does not silently commit a repair using `GITHUB_TOKEN`: in that configuration, the push would not start fresh workflow runs, leaving the new head without the required checks. Fixing the graph while invalidating the evidence around it would be an incomplete repair.

A correction loop also needs to preserve the task. Elastic describes an agent trying to fix a failing dependency upgrade by removing the upgrade. The build could become green while the requested work disappeared. The team introduced an explicit constraint against that escape route. The lesson extends to deleting tests, weakening assertions or changing the review policy merely to obtain a passing result.[^elastic]

Repeated attempts should therefore be evaluated for progress, not just activity. Did the agent obtain new evidence? Did it resolve a distinct failure? Is the patch converging, or oscillating between incompatible reviewer suggestions? Batch independent findings when possible. Do not treat an infrastructure outage as a reason to rewrite application code.

Stripe's Minions are an instructive operating point: local linting is designed to run in under five seconds, and the system allows at most two CI rounds. Its reported output still goes through human review. This is a bounded autonomous authoring loop, with a deliberately retained human acceptance decision. Two rounds is Stripe's trade-off, not a universal limit.[^stripe]

For our own workflow, I would distinguish a repair budget from a validation retry budget. An incomplete check is not evidence that another code edit is needed. A repeated invariant failure after the same attempted repair is not evidence that another identical attempt will help. The migration case makes these decisions concrete.

## 6. Integration evidence belongs to a candidate, not a branch name

The migration example exposes a broader issue: a passing result has a scope.

Suppose two agents work on separate branches. One changes an API response. The other changes the frontend that reads it. Both pass their own tests against their respective bases. Neither result establishes that their combined version works. The patches can merge cleanly and still disagree about the interface.

The unit of acceptance is the candidate that will actually be integrated: the relevant code revisions plus the environment in which their claims were checked. For a web application, that can include frontend and backend builds, database schema, fixtures, configuration and dependencies. A screenshot from one frontend connected to another agent's backend is weak evidence, even if the page looks correct.

The diagram follows the migration case from separate branches to a checked combination. Notice where new evidence becomes necessary:

<figure>
  <a href="/articles/ai-code-integration-review/06-candidate-evidence.svg" target="_blank" rel="noopener" title="Open full-size figure">
    <img src="/articles/ai-code-integration-review/06-candidate-evidence.svg" alt="Two independently valid migration branches combine into a candidate with two heads; the combined candidate is checked, repaired and checked again before acceptance." width="864" height="518.4" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 4. Evidence is attached to the combined candidate. A new base, patch or relevant environment change can invalidate it. This is a conceptual explanation of the invariant, not a measured trace of one Topo incident.</figcaption>
</figure>

Topo's migration control implements part of this idea in a narrow domain. Its script creates a detached temporary worktree, merges the current base into the PR head and inspects the resulting revision graph. A companion workflow re-evaluates open migration PRs when a migration lands on `main`. The latter matters because evidence can become stale without the PR branch changing at all.

This guard is useful evidence of how the invariant was encoded. I would not claim that asynchronous status invalidation alone eliminates every race between concurrent merges. The stronger integration requirement is to validate and accept the same combined candidate through a mechanism that controls ordering.

GitHub's merge queue addresses this at the repository level by testing a candidate containing the latest base and changes ahead in the queue. Its documentation also makes an operational requirement explicit: GitHub Actions workflows used for required checks must handle the `merge_group` event. A green check from an ordinary PR run is not automatically a check of the queued combination.[^merge-queue]

Runtime evidence has a similar lifetime. A preview should identify the candidate and remain stable during verification. If the underlying database or backend changes halfway through a browser test, the test no longer has one unambiguous subject. If the agent changes code after recording a demo, the recording belongs to an earlier candidate.

A queue, isolated environments, reproducible fixtures and results keyed to immutable revisions are a concrete starting point. Additional coordination earns its place when shared services or dependent changes prevent those mechanisms from producing trustworthy evidence.

For the migration example, I would make the following state transitions explicit. They describe a proposed operating policy, beyond what the historical guard alone establishes:

| What the system observes | What the agent does next | What reaches a human |
| --- | --- | --- |
| Reproducible split graph on a known combined candidate | Apply the supported reconciliation procedure, inspect the resulting diff and rerun the graph check | Escalate if the same failure remains after that repair, or conflicts require choosing migration semantics |
| Check times out or produces no complete result | Retry validation within an infrastructure budget; preserve the distinction between unknown and failed | The missing result and attempts made, if the budget is exhausted; no invented code defect |
| A new migration lands on the base | Construct the new combined candidate and refresh the affected evidence | Escalate if repeated invalidation prevents convergence; serialize the candidate instead of endlessly rebasing |
| Graph passes, but backfill cost or compatibility remains unknown | Keep the result as evidence about the graph only; collect the missing operational evidence | The specific unresolved risk, the candidate tested and the rollout or recovery decision needed |

The stopping rule is about information: a retry should produce evidence that was unavailable before, or test a materially different repair. A fixed maximum still protects cost and latency, but the exact number should come from the workload. “Try again” is not a progress signal.

The same reasoning constrains rollback. If agent B builds on an interface added by agent A, removing A's contribution is not necessarily a safe selective undo. The removal creates another candidate, whose dependencies and behavior must be checked. Attribution tells us who produced a change; it does not prove that the change can be removed independently.

## 7. Route human review by impact and uncertainty

A reviewer returning no findings means it found no findings. A routing policy has to answer a different question: is the available evidence sufficient for the next action?

The distinction becomes clearer with three changes of similar diff size. A documentation fix may be easy to inspect and reverse. A small modification to an authorization filter may affect every tenant. A short database migration may hold a lock on a large table. Line count tells us little about those consequences.

I would route using potential impact, reversibility, observability and uncertainty. Impact asks who or what can be affected. Reversibility asks whether rollback repairs the consequence, rather than merely restores old code. Observability asks how quickly we would notice a bad outcome. Uncertainty asks whether the system has enough context and suitable checks to support the decision.

These factors should not all disappear into a weighted score. Strong tests for formatting cannot compensate for an unresolved tenant-isolation concern. A familiar file path cannot make an irreversible data transformation harmless. Some conditions need explicit exclusions from the automated path.

The table describes a proposed policy, not a claim that all these controls were deployed at Topo:

| Change | Evidence that can support integration | Reason to involve a person |
| --- | --- | --- |
| Generated client refresh | Reproducible generation, clean contract diff, affected consumer checks | Unexpected API behavior or unexplained generated changes |
| Isolated presentation fix | Relevant visual and interaction checks, accessible preview, simple rollback | Ambiguous product intent or shared interaction behavior |
| Authorization or tenant filtering | Negative tests, call-path analysis, explicit scope | High consequence of an omitted case; domain judgment remains necessary |
| Database migration | Combined revision-graph check, realistic migration test, compatibility plan | Locking, backfill cost, irreversible transformation or unclear recovery |
| Review or CI policy change | Independently checked policy diff and regression cases | The patch changes the mechanism judging the patch |

That last row has a concrete counterpart in our historical reviewer. When a PR edited `ai-review.yml`, the workflow could exit successfully without a verdict because the review action would not run against the changed workflow file. This was an explicit exception, not a verified incident. It illustrates why a successful job status and a completed review must be represented separately, and why changes to the acceptance mechanism need an independent review path.

Automation should be allowed to abstain. Missing context is a reason to ask for judgment, not to invent reassurance. A timeout or incomplete review should be represented as missing evidence, separately from a defect finding.

The person should receive the unresolved decision in a usable form. “Review this PR” asks them to discover the question. “The schema check passes, but this backfill has not been tested at production-like volume” identifies it. The latter still requires work, but it directs attention toward the uncertainty that matters.

Audit a sample of the automated path as well as the escalations. Looking only at PRs sent to humans teaches us about known uncertainty. It cannot reveal the mistakes the router confidently sent elsewhere. Samples should cover change classes and evolve when the codebase, models or policies change.

Topo's report places the end of routine human approval around July 2026. The exact enforcement date is not independently established: the branch-protection endpoint was unavailable to the extraction. That transition is part of our experience, but the data do not justify turning it into a universal recommendation to remove human review.

## 8. Review also keeps people able to understand the system

Reducing review to defect detection leaves out one of its functions: people learn what the system is becoming.

A team can automate local correctness checks while gradually losing the ability to explain why a feature exists, which constraint shaped an interface, or which customer depends on an awkward behavior. The cost becomes visible later, during an incident or a redesign, when nobody can reconstruct the decision from the patch alone.

This is a reason to be precise about what kind of review we reduce. Formatting, generated-file drift and repeatable invariants are good candidates for automation. Architecture choices, ambiguous requirements and changes to shared contracts often benefit from conversation before the implementation becomes expensive to discard.

Sean Goedecke's argument for structural review is useful here: good reviewers consider the solution that could have been built, including whether an existing subsystem would make much of the new code unnecessary. A correct diff can still be the wrong amount of software.[^structural-review]

A preview helps judge observable behavior. It does not by itself expose an unnecessary background-job framework, a duplicated business rule or a new dependency that will make future work harder. The appropriate review surface depends on the question: interaction in the browser, invariants in tests, compatibility in a combined environment, design in the surrounding code and the alternatives considered.

That is why I would preserve explicit human ownership even when routine approvals become optional. Someone needs to understand the change's purpose, the important design decision and the residual risk. Ownership need not mean reading every generated line. It should mean being able to explain the change and decide what to do if the evidence is wrong.

There is also a training consequence. Experienced engineers draw on prior incidents and design mistakes to recognize weak assumptions. If juniors only receive completed patches and seniors only see exceptional failures, the team may lose ordinary opportunities to build that judgment. Design discussions, occasional deep reviews and incident walkthroughs are work worth preserving rather than silently eliminating from the calendar.

Birgitta Böckeler separates immediate development friction, effects on team flow and long-term maintainability. The last category has the slowest feedback and can escape both tests and short productivity studies. It is a useful reminder that a workflow can look efficient within a sprint while making subsequent changes harder.[^developer-skills]

## 9. Recurring interventions should improve the system

When a developer must repeatedly explain the same invariant, the intervention is also information about the workflow.

The useful question is when enough information existed to prevent or resolve the problem. If the answer was available before the edit, improve task context or the tool interface. If it emerged in a coherent diff, add a suitable check there. If it depended on another branch, improve candidate validation. If it required business judgment, preserve the human decision and record the context for the next similar case.

This avoids turning every failure into another paragraph of instructions. Instructions are useful for guidance, but a mechanical invariant often belongs in executable tooling. The migration graph is a good example: a command can answer whether the combined graph has multiple heads more directly than a model can remember and reason through every revision.

OpenAI's harness-engineering account combines executable repository constraints with comparatively few blocking merge gates. I find that combination more useful than a universal claim for either strict or permissive review: encode the recurring invariants, then make the acceptance policy fit the cost of a mistake and of waiting.[^harness]

The record of an intervention should connect the task, candidate, diagnostic, attempted repairs, human action and final outcome. Keep the versions of the model, instructions, tools and policy. A transcript from one session is not enough when a person intervenes hours later or repairs a defect after merge.

Before changing the workflow, write a hypothesis that can be wrong. For the migration guard, one could be: “Giving the agent the repository's merge-revision procedure will reduce human repair requests on divergent-head cases without changing the meaning of existing migrations.” This is a proposed experiment; the historical data do not contain its treatment effect.

The corresponding evaluation needs more than the failure that inspired it. Include a genuine split graph, a valid linear graph, a non-migration change, a pre-existing merge revision and a case where reconciling the graph does not resolve an unsafe migration. Otherwise the system can learn to propose `task db:merge` whenever it sees the word “migration.”

A control has a maintenance cost too. It can become stale when the architecture changes, suppress a valid new pattern or bury useful diagnostics beneath accumulated rules. Assign an owner, keep regression cases, and remove rules whose justification no longer holds. Accumulating instructions indefinitely is another way to spend future attention without noticing it.

## 10. Test the detector, the repair and the whole workflow separately

A check can improve at finding issues and still make the system worse. It might increase false alarms, induce unnecessary edits or push the agent into a long correction loop. Three evaluations help separate those effects.

First, run the detector on historical repository states with known outcomes. This measures whether the new check catches the intended issue and leaves valid cases alone. Include cases where a proposed warning would have been wrong or irrelevant. Evaluate blocking findings with adjudicated labels and severity, not merely agreement with the old reviewer.

Second, resume an agent from a checkpoint where the new feedback would have appeared. Can the agent use it? Does it make the appropriate repair, preserve the task and establish the relevant invariant? A correct diagnostic with an unusable repair path is a tooling failure even if the detector receives full credit.

Third, rerun the task with the old and new workflows. This includes differences in behavior that the checkpoint experiment cannot see: whether the agent chooses a different plan, writes tests earlier, avoids an entire class of mistakes or spends more time satisfying controls than completing the task.

These tests need fresh execution after the path changes. Once a new diagnostic causes a different edit, later recorded tool responses may no longer be valid. Replaying the old “tests passed” result against a new patch would manufacture evidence. Historical replay is useful for detection; counterfactual continuation requires an environment that reflects the new actions.

Use equivalent starting states and explicit budgets. Keep the model and infrastructure fixed when trying to isolate a workflow change. Run multiple trials, since one fortunate trajectory is weak evidence of reliability. Reserve tasks for validation, including later cases that were unavailable while designing the rule.

Anthropic's evaluation guidance distinguishes a transcript from the outcome it describes and recommends combining suitable graders with repeated trials. A coding agent saying that it fixed a bug is not the same as the resulting system satisfying the acceptance test.[^agent-evals]

Infrastructure belongs in the experimental record. In one Anthropic study, changing resource allocations while holding model, harness and task set constant produced a six-percentage-point spread across the extreme configurations on Terminal-Bench 2.0. A workflow comparison that quietly gives one arm more memory, faster services or looser timeouts is testing more than the advertised change.[^infra-noise]

A different model as reviewer can add another perspective, but does not guarantee independent evidence. Models can share blind spots, the same mistaken specification or the same incomplete context. A test derived from a real failure, an executable interface contract and a domain expert's review may reveal different classes of error. Diversity is valuable when it changes what can be observed, not merely the name on the verdict.

For our migration control, the next experiment can be quite specific. The unit is a migration task from a frozen starting state, including tasks that never produce a PR. Compare three diagnostic conditions while keeping the graph checker, agent, environment and acceptance requirements fixed:

| Experimental condition | Feedback available to the agent | What it helps isolate |
| --- | --- | --- |
| Reduced diagnostic | The checker result and detected heads | Whether the agent discovers the repair without procedural guidance |
| Existing Topo diagnostic | The result plus the repository's actual reconciliation commands | The value of a supported repair path |
| Candidate-aware diagnostic | The same repair path plus the tested base/head revisions, evidence invalidation and explicit operational unknowns | Whether additional context prevents stale or overconfident acceptance |

The reduced diagnostic is an experimental ablation, not a claim about an earlier Topo implementation. Run repeated trials on matched tasks, randomize their order and reset the environment between them. For human-assisted trials, account for reviewers learning the solution: separate matched cases or otherwise control that learning instead of treating repeated work as independent.

The outcome is an accepted change that satisfies the task, preserves migration semantics, passes required checks on the current candidate and has its operational questions resolved by the appropriate owner. Record erroneous merge revisions, unnecessary edits, escalations and abandoned tasks. Count the human time for setup, coaching, decisions and later repair, while reporting machine cost and elapsed delay separately. An improvement that creates fewer human requests by silently accepting an unsafe migration fails the experiment.

Historical cases can establish whether the control recognizes known failure modes. Fresh tasks and a defined follow-up period are needed to learn whether it removes work. Choose the study size from observed variability and the smallest worthwhile change, rather than declaring a few successful demonstrations sufficient.

After offline evaluation, observe the control on real work before allowing it to block, then activate it on a limited scope. Keep the previous version available. The comparison should be able to reject the extra diagnostic context if it adds more confusion or maintenance than it removes.

## 11. Our most attractive autonomy metric leaves important work invisible

One Topo series initially looks like an answer to the attention question. Among eligible merged AI PRs, the share with no human commit after the last identified agent commit rose from 34.21% in November 2025 to 90.05% in August 2026. The eligible populations were 76 and 382 PRs.

That is a useful code-contribution signal. It does not mean 90% of tasks succeeded on the first attempt or required no human involvement. An agent may have retried CI repeatedly. A person may have coached it throughout, reviewed the diff, edited earlier in the sequence or decided that the result was acceptable. None of those actions necessarily creates a human commit after the final agent commit.

The chart therefore names exactly what is visible, and puts the monthly population underneath it:

<figure>
  <a href="/articles/ai-code-integration-review/04-human-commit-proxy.svg" target="_blank" rel="noopener" title="Open full-size figure">
    <img src="/articles/ai-code-integration-review/04-human-commit-proxy.svg" alt="The share of eligible merged AI PRs without a later human commit rises from 34.2% to 90.1%, alongside an increase in the eligible population from 76 to 382." width="864" height="576" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 5. This measures the absence of a human commit after the last identified agent commit, conditional on a PR being merged and eligible for attribution. It does not measure absence of human attention. July&#x27;s value was 77.43%; August&#x27;s 90.05% was not evidence available before the July review-policy change.</figcaption>
</figure>

Conditioning on merges introduces another blind spot. In the later extraction, 587 of 4,129 opened PRs were closed without merging and seven remained open. Some closures may reflect replacement, changed priorities or duplicate work rather than wasted effort. They still belong in an account of what the workflow attempted. Sessions that never created a PR remain invisible altogether.

The same caution applies to the quality trend. The Linear ticket series falls from 79 tickets in November 2025 to 48 in August 2026. Dividing by merged PRs gives 44.13 and 12.34 tickets per 100 PRs. The normalized line declines much more sharply because the PR denominator also grows.

Plotting both prevents a larger output denominator from doing all the explanatory work:

<figure>
  <a href="/articles/ai-code-integration-review/05-tickets-and-denominator.svg" target="_blank" rel="noopener" title="Open full-size figure">
    <img src="/articles/ai-code-integration-review/05-tickets-and-denominator.svg" alt="Monthly recorded bug-ticket counts and bug tickets per 100 merged PRs both decline between the endpoints, with a sharper decline in the normalized series." width="864" height="576" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 6. Ticket counts and tickets per 100 PRs answer different questions. The ticket set is an imperfect union of Ticketing-team issues and Bug-labeled issues. Its composition changes over time. August is partial, and defects may be reported after the change that introduced them. This is not a deployment-linked change failure rate; further collection limits are in the appendix.</figcaption>
</figure>

The original report also modeled downstream feedback time by combining observed monthly rates with assumptions about review and CI-cycle durations. That model is useful for exploring assumptions. It cannot support a claim about engineer-hours saved: ticket-resolution durations are calendar time, assumed review durations are not measured effort, and overlapping delays do not necessarily sum to a change's critical path. I leave that graph out of the measured results here.

These gaps explain the measurement choices in the migration experiment. Repository events tell us which artifacts changed and when. Intervention records tell us which decisions consumed a person's attention. A follow-up window tells us whether the apparent saving survived contact with the deployed system. The three views complement one another; none can substitute for the others.

## 12. The unsolved questions now concern acceptance

Several costs remain unmeasured: engineering time spent building the harness, inference and sandbox costs, the effort of maintaining rules, active review attention, and long-term architectural effects. The post-July observation window is short. We do not have a severity-linked production incident dataset that could establish whether relaxing routine human approval preserved the same risk level.

The operating context matters as well. If a team rarely waits for review, improving its reviewer may not address its bottleneck. If the product is hard to run, reproducible environments may matter more than another model. If correctness depends on undocumented business knowledge, making that knowledge explicit may be the most valuable work. High-impact or hard-to-reverse systems need evidence appropriate to their consequences.

The migration experiment would let us decide something concrete: whether a richer diagnostic reduces total human work compared with the repair procedure we already have. It could also reveal that the existing commands are enough, that environment failures dominate the cost, or that most interventions concern operational decisions the graph checker cannot make. Each result would change where I invest next.

The larger direction is to make routine correctness easier to establish while preserving deliberate judgment about purpose, design and risk. Every accepted change should have evidence that refers to the version being accepted. Every repeated human intervention is a candidate for a better tool or a better boundary. And every claim of autonomy should say which human work was actually measured.

## Appendix: how to reproduce and interpret the figures

The bundled chart script reads aggregate CSVs copied from the late-August Topo analysis. It does not query live services or use individual contributor names. SVG and PNG versions share the same calculations.

| Figure | Input | Calculation and boundary |
| --- | --- | --- |
| 1 | `monthly_prs.csv` | Monthly merged count and PR-open-to-merge median; compare means for May–July 2025 and June–August 2026. Historical column name `median_lead_time_hours` is misleading; these timestamps begin at PR creation. |
| 2 | `shift_left_quarterly.csv` | Quarterly inventories of configured checks, excluding the ambiguous human-review convention count. Placements are not unique controls. |
| 3 | `ci_breakdown_monthly.csv` | Failures / retained workflow runs within each category. Cancelled, skipped and empty conclusions excluded by the source extraction; run mix changes over time. |
| 4 | Conceptual | An illustration of candidate validity and evidence freshness, without empirical timing or probability claims. |
| 5 | `monthly_loop_quality.csv` | Reported no-later-human-commit percentage and eligible population. The CSV calls it `first_pass_merge_rate_pct`; this article deliberately uses the narrower definition. |
| 6 | `linear_bugs_monthly.csv` | Recorded tickets and tickets / merged PRs × 100; use only the reliable window beginning November 2025. |

The branch naming and commit-attribution methods are imperfect indicators of AI participation. The code artifacts quoted above were checked against commit `4756dfd8c417`, dated August 28, 2026. Their existence establishes what the repository encoded, not the rate at which every developer used the checks or the effectiveness of each control. The four-graph demonstration uses synthetic fixtures and the actual archived head checker; it does not execute database migrations or test the entire CI workflow.

The ticket extraction includes duplicates, cancelled tickets and some non-bugs. Earlier months rely more on Bug labels, while later months are dominated by the Ticketing team; that changing collection process limits comparability. Tickets are not causally linked to individual PRs, and recent changes have less time for defects to be reported.

The original reports call several proxies DORA metrics. I do not reuse their performance-band classifications here: a merge is not necessarily a production deployment, a recorded bug is not linked to a particular failed deployment, and time to merge a hotfix is not directly measured service-restoration time.

## References

[^review-load]: Hao He et al., [*AI Writes Faster Than Humans Can Review: A Longitudinal Study of an Enterprise 2x Mandate*, v2](https://arxiv.org/abs/2607.01904v2), revised October 27, 2026. Observational study of one enterprise; PR throughput is a productivity proxy.

[^metr]: METR, [*Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity*](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), July 10, 2025; and [*We Are Changing Our Developer Productivity Experiment Design*](https://metr.org/blog/2026-02-24-uplift-update/), February 24, 2026. Different tool periods and different measurement limitations.

[^dora]: Jessica Baolin and Nathen Harvey, [*Balancing AI tensions: Moving from AI adoption to effective SDLC use*](https://dora.dev/insights/balancing-ai-tensions/), March 10, 2026. Discusses the 2025 DORA findings and qualitative workflow evidence.

[^static-analysis]: Caitlin Sadowski, [*Static Analysis*, Chapter 20 of Software Engineering at Google](https://abseil.io/resources/swe-book/html/ch20.html). Actionable checks, workflow integration and effective false positives.

[^spotify-one]: Spotify Engineering, [*1,500+ PRs Later: Spotify's Journey with Our Background Coding Agent*](https://engineering.atspotify.com/2025/11/spotifys-background-coding-agent-part-1), November 2025. Retrieved from my Signal library.

[^spotify-feedback]: Max Charas and Marc Bruggmann, [*Background Coding Agents: Predictable Results Through Strong Feedback Loops*](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3), December 9, 2025. Follow-up to the article saved in Signal; reported veto and correction rates are not judge-accuracy measurements.

[^elastic]: Pablo Pérez Hidalgo, [*CI/CD pipelines with agentic AI: How to create self-correcting monorepos*](https://www.elastic.co/search-labs/blog/ci-pipelines-claude-ai-agent), September 2025. Retrieved from Signal; concrete example of preserving task intent during repair.

[^stripe]: Alistair Gray, [*Minions: Stripe's one-shot, end-to-end coding agents*](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents), February 9, 2026. Retrieved from Signal and checked at the publisher; human review remains part of the described process.

[^merge-queue]: GitHub, [*Managing a merge queue*](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue). Documentation checked November 2, 2026.

[^structural-review]: Sean Goedecke, [*If you are good at code review, you will be good at using AI agents*](https://www.seangoedecke.com/ai-agents-and-code-review/), September 20, 2025. Retrieved from Signal; a practitioner's argument for structural judgment.

[^developer-skills]: Birgitta Böckeler, [*The role of developer skills in agentic coding*](https://martinfowler.com/articles/exploring-gen-ai/13-role-of-developer-skills.html). Retrieved from Signal; practitioner observations across several time horizons.

[^harness]: OpenAI, [*Harness engineering: leveraging Codex in an agent-first world*](https://openai.com/index/harness-engineering/). Retrieved from Signal; an experience report with explicit limits on generalization.

[^agent-evals]: Anthropic, [*Demystifying evals for AI agents*](https://www.anthropic.com/research/demystifying-evals-for-ai-agents), January 2026. Retrieved from Signal; outcomes, transcripts, trials and grading.

[^infra-noise]: Gian Segato, Anthropic, [*Quantifying infrastructure noise in agentic coding evals*](https://www.anthropic.com/research/infrastructure-noise), February 5, 2026. Retrieved from Signal and checked at the publisher; the six-point spread refers to the extreme tested resource configurations.
