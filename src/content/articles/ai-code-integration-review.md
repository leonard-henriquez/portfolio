---
title: Rethinking Code Integration and Review in the Age of AI
description: How feedback transfers work to agents, why reviewers must be judged by the changes they cause, and when passing checks stop being evidence.
date: 2026-11-02
---

At Topo, monthly merged PRs rose from roughly 80 to 318. Opening-to-merge delay stayed close to five hours. We were integrating more changes without knowing how much human attention each one required.

That changed what I wanted from our tooling. An agent that writes a patch and leaves someone else to interpret failures, relay instructions and request another attempt has automated only part of the job. The developer can stop typing and still remain on the critical path of every change.

**The opportunity is to move routine corrections inside the agent's responsibility, then give people better questions to decide.** Doing that changes where checks belong, what a reviewer should optimize for, and what a passing result actually means.

<figure>
  <a href="/articles/ai-code-integration-review/01-throughput-and-delay.svg" target="_blank" rel="noopener" title="Open full-size figure">
    <img src="/articles/ai-code-integration-review/01-throughput-and-delay.svg" alt="Merged PRs increase while opening-to-merge delay remains around five hours across the two comparison windows." width="864" height="590.4" loading="lazy" decoding="async" />
  </a>
  <figcaption>More changes reached main; opening-to-merge delay changed much less. Repository-level observations, 2025–2026.</figcaption>
</figure>

## Early feedback transfers the correction

Moving a check earlier is usually described as saving time. Its more consequential effect is changing who fixes the problem.

A type error caught while the agent is editing can be resolved inside the task. The same error discovered in final review becomes a handoff: a person explains it, the author returns to the change, a new patch arrives, and someone decides whether it is now acceptable. The defect is identical. The coordination cost is not.

At Topo, we progressively moved mechanical checks from CI into the agent's editing loop, then into pre-commit and pre-push hooks. Ruff, Biome and faster TypeScript checking made it practical to return feedback while the relevant work was still in context. CI remained the enforcement boundary; the earlier checks gave the agent a chance to arrive there with the problem already solved.

<figure>
  <a href="/articles/ai-code-integration-review/02-check-placement.svg" target="_blank" rel="noopener" title="Open full-size figure">
    <img src="/articles/ai-code-integration-review/02-check-placement.svg" alt="Configured checks expand from CI into agent hooks, pre-commit and pre-push checks." width="864" height="489.6" loading="lazy" decoding="async" />
  </a>
  <figcaption>By Q3 2026, our configuration contained 26 check placements before CI. The same rule can appear at several stages.</figcaption>
</figure>

But “as early as possible” is the wrong target. Suppose an agent changes an API definition and then regenerates its client. Between those edits, the repository is inconsistent on purpose. A cross-package check that fires halfway through can persuade the agent to undo correct work because it cannot distinguish an unfinished change from a broken one.

The useful boundary is the **earliest coherent state**. Formatting can follow a file edit. A type check may need a group of edits. A contract check needs both sides of the interface. Choosing that boundary requires understanding the task, not just finding a faster place to run the same command.

The diagnostic matters just as much. “Multiple migration heads” identifies a problem. “Merge the current base, run the repository's merge-revision command, then recheck the combined graph” gives the agent a route through it. The first names the failure; the second makes the team's repair procedure available inside the task.

This is how a check can reduce review work without becoming a better detector: it lets the author resolve an existing class of problems before anyone else needs to reconstruct the context. I would judge a new hook by whether it removes that handoff, not by how many warnings it emits.

## A reviewer changes the codebase

An automated reviewer is often evaluated as if its output were a report. In an agent workflow, its output can become the next patch.

A plausible but incorrect finding may cause the authoring agent to rewrite correct code. A minor valid finding may trigger another implementation pass, another validation run and another human interruption. The reviewer has become part of the mechanism that changes the system. Its quality depends on those changes, not only on whether its comments sound reasonable.

That makes an early detector and a blocking reviewer different tools. An early detector can raise a suspicion that the author investigates cheaply. A blocker spends the cost of another correction cycle. Giving both the same prompt and threshold ignores the consequence of their answers.

Our own review policy made that trade-off visible. In an August snapshot, both important findings and nits caused the review job to fail:

```bash
if [ "$IMPORTANT" -gt 0 ] || [ "$NIT" -gt 0 ]; then
  echo "::error::Code review found $IMPORTANT important issue(s) and $NIT nit(s). Please fix them before merging."
  exit 1
fi
```

I would change that contract. A blocking finding should identify a failure scenario, its consequence and a way to verify it. Optional cleanup should not purchase another integration cycle. If a formatting convention really must be enforced, a deterministic rule with an automatic fix is a better interface than a model repeatedly negotiating it.

The history also shows why a busy reviewer can look more useful than it is. Core CI failures fell from about 12% to 3%, while AI-review failures exceeded half of runs in April. A failed review might contain a real finding or no complete verdict at all. The curve measures how often the workflow failed, not how much bad code it prevented.

<figure>
  <a href="/articles/ai-code-integration-review/03-ci-decomposition.svg" target="_blank" rel="noopener" title="Open full-size figure">
    <img src="/articles/ai-code-integration-review/03-ci-decomposition.svg" alt="Core CI and AI-review failures follow different trajectories." width="864" height="504" loading="lazy" decoding="async" />
  </a>
  <figcaption>Core CI&#x27;s observed failure rate fell; AI-review failures followed a different curve. Neither rate measures the value of the corrections it triggered.</figcaption>
</figure>

Google's work on static analysis describes “effective false positives”: findings that may be technically valid but are not useful enough to act on. Agents add another cost to that distinction. A human may ignore an unhelpful warning; an agent may diligently implement it.[^static-analysis]

The evaluation therefore needs to follow the finding into the next action. Does the agent make the right repair? Does it preserve the original requirement? Does the repair introduce a different defect? Does the exchange converge, or do the author and reviewer keep generating work for each other? This is also why agreement with a previous reviewer is a weak target: the previous reviewer may have been asking for the wrong changes.

Historical replay can test whether a reviewer notices a known issue. It cannot establish whether the resulting correction works. Once feedback causes the agent to edit a different line, the later test results in the original trace belong to a different program. Testing the intervention requires continuing execution from that point with the new patch. Reusing the recorded “tests passed” result would reward a repair that was never tested.[^agent-evals]

A more talkative reviewer is easy to build. A reviewer that leaves the system in a better state is the useful one.

## Passing checks expire

Our Alembic migration guard exposes a problem that becomes more common as agents work in parallel: two independently valid changes can combine into an invalid state.

Two branches each add a migration after the same parent. Each has one revision head. Merge the branches and the combined graph has two. There need not be a textual conflict, and neither branch's earlier result answers the question that now matters.

Running Topo's archived checker on four small synthetic graphs produces:

```text
branch_a   exit=0  heads=a
branch_b   exit=0  heads=b
combined   exit=1  heads=a,b
reconciled exit=0  heads=merge_ab
```

Our guard checks the combined graph in a temporary worktree. Its repair instructions tell the author to merge the current base and create a merge revision:

```bash
git fetch origin main
git merge origin/main
task db:merge
git add packages/backend/app/db/migrations/versions/
git commit -m "Merge Alembic heads"
git push
```

The less obvious part is the companion workflow: when a migration lands on `main`, it re-evaluates the other open migration PRs. **Evidence can become stale without the branch changing at all.** Tracking only the author's latest commit misses a dependency that moved underneath it.

<figure>
  <a href="/articles/ai-code-integration-review/06-candidate-evidence.svg" target="_blank" rel="noopener" title="Open full-size figure">
    <img src="/articles/ai-code-integration-review/06-candidate-evidence.svg" alt="Separate migration branches are combined, checked, repaired and verified again before acceptance." width="864" height="518.4" loading="lazy" decoding="async" />
  </a>
  <figcaption>A passing result belongs to the candidate that was checked. Changes to its base or environment can invalidate it.</figcaption>
</figure>

This extends beyond migration graphs. A frontend preview can show the right behavior while talking to the wrong backend. A browser test can start with one schema and finish after another agent changes the shared database. A recorded demo can remain convincing after the implementation it showed has been replaced.

The unit of acceptance is therefore a concrete candidate: code, base and relevant runtime state. Results need to identify that candidate. A preview must stay stable long enough to inspect it. When something relevant changes, the affected evidence needs refreshing.

GitHub's merge queue applies this principle to code by checking changes against the latest base and earlier queued changes.[^merge-queue] A shared database or mutable test service introduces the same problem outside Git's boundary. Adding more branch isolation does not solve a runtime that several agents can silently mutate.

This also puts a limit on selective rollback. If agent B uses an interface introduced by agent A, removing A's contribution does not restore a known-good state. It creates another combination. Attribution helps explain who changed what; dependency checks determine whether the removal is safe.

The migration graph is only one invariant. A single head says nothing about the lock duration of a backfill or compatibility with an older application. Keeping the evidence attached to a specific claim makes the next decision clearer: the graph is reconciled; the operational question still needs an answer.

## Retries must buy new information

Once the agent owns the correction loop, “keep trying until green” is an attractive stopping rule. It can also reward the agent for making the requested work disappear.

Elastic describes an agent that tried to fix a failing dependency upgrade by removing the upgrade. The build could pass while the task failed. Similar escape routes include deleting a test, weakening an assertion or changing the policy that rejects the patch.[^elastic]

Success has to include the original intent. The correction loop must preserve what the user asked for while satisfying the relevant constraints. Otherwise an automated reviewer and an automated author can cooperate perfectly on the wrong objective.

There is a second problem: retries that contain no new information. An infrastructure timeout is not a diagnosis of the code. A second identical repair attempt is not progress. Another rebase against a moving target may simply restart the same race.

For the migration case, those states lead to different actions:

| Observation | Useful next action |
| --- | --- |
| The combined graph has two heads | Apply the supported reconciliation and verify the new graph |
| The checker produced no result | Retry validation; do not invent a code defect |
| The base changed | Refresh the candidate and its affected checks |
| Repeated base changes prevent convergence | Serialize integration instead of endlessly repairing stale work |
| The graph passes; backfill behavior is unknown | Resolve the operational question with its owner |

This is why I would separate the budget for code repairs from the budget for validation retries. They consume different resources and answer different questions. A system that counts both as “attempts” cannot explain whether an agent is failing to fix the product or failing to obtain a usable test environment.

Stripe's Minions allow at most two CI rounds while keeping human review at the end. That is a concrete boundary around autonomous authoring, not an attempt to make the loop unbounded.[^stripe] The right number depends on the workload. The more general requirement is that another attempt should test a different repair or obtain evidence that was previously unavailable.

The same logic applies to concurrency. If acceptance is the bottleneck, launching more agents produces candidates that wait, become stale and need repair. Generation capacity starts paying for the upkeep of its own queue. Finishing existing work before starting more can then save more time than making the next implementation faster.

## Confidence cannot cancel consequences

A two-line tenant filter and a two-line presentation fix can have similar diffs, similar test counts and equally reassuring reviewer comments. Their consequences are very different. So are the recovery options: restoring old code may repair a visual regression, but it cannot undo data already disclosed to the wrong tenant.

This is where a single weighted risk score becomes dangerous. Strong evidence on easy dimensions can numerically compensate for an unresolved issue on a critical one. Ten passing formatting checks do not make an authorization assumption safer. Some conditions need an explicit human decision, regardless of the aggregate confidence.

Changes to the acceptance mechanism deserve particular care. In our historical workflow, a PR that edited `ai-review.yml` could receive a successful job status without a review verdict, because the review action would not run against the changed workflow file. A successful process exit and a completed review were different states. The component judging the patch could not provide the independent check that this class of patch required.

The useful escalation names the unresolved decision. “Review this PR” makes a person discover the question. “The migration graph passes, but this backfill has not been tested at production-like volume” directs attention to the evidence that is missing. For an authorization change, it may be whether the intended access rule is correct, not whether the implementation matches it.

That distinction should shape the handoff: what changed, what was verified, what remains unknown, and which consequence needs an owner. Missing evidence should remain visible as missing evidence. It should not be converted into either a reassuring verdict or a fabricated defect.

There is a less visible obligation on the automated path: occasionally inspect the work the router did *not* escalate. Reviewing only the difficult cases tells us how it handles acknowledged uncertainty. Its most consequential mistakes may be the changes it accepted confidently.

## Review the software you could avoid

The highest-value review comment may concern code that should never have been written.

A patch can satisfy its specification, pass its tests and look convincing in a preview while duplicating an existing subsystem. A new background-job framework may work perfectly and still be a worse choice than extending the one already in the repository. A reviewer confined to the diff is poorly placed to discover that alternative.

Sean Goedecke describes this as structural review: considering the solution that could have been built, including the design that makes much of the proposed change unnecessary.[^structural-review] As generating code gets cheaper, this judgment becomes more consequential. The cost of producing an unnecessary abstraction falls; its maintenance cost does not fall with it.

I would move this review earlier for changes that introduce a new dependency, a shared contract or another place where a business rule can live. The useful artifact is a short account of the alternatives and the constraint that ruled them out. Asking for that after a large implementation is finished makes discarding the work harder, even when producing it was cheap.

A preview answers questions about behavior. It is less useful for deciding whether two parts of the system now encode the same rule, or whether a new queue creates another consistency boundary. Those questions need the surrounding code and design context. Replacing every review surface with a demo would make some decisions easier and others harder to see.

Review also transfers that context between people. If agents make most changes and humans see only exceptional failures, the team can gradually lose its ability to explain the ordinary behavior of the system. This becomes expensive during an incident, when knowing *why* a rule exists matters more than being able to read its implementation. Böckeler's distinction between immediate development effects and long-term maintainability is useful here: the second can deteriorate while the first looks better.[^developer-skills]

The response is not to require somebody to read every generated line. It is to preserve ownership of important decisions. Someone should be able to explain why the change exists, which alternative was rejected and what would make the team reverse course. Selected design reviews and incident walkthroughs serve that purpose more directly than routine approvals that nobody learns from.

## Learn from the whole interruption

The useful unit of learning is the whole interruption: what the agent knew, what it tried, what the human supplied, and what happened next. That can reveal a missing command, an ill-timed check or an ambiguity that should remain a human decision. A collection of reviewer comments alone cannot distinguish them.

When a developer keeps explaining how to reconcile migration heads, that procedure can become a tool. When the mistake is detectable from the completed edit, it can become a check. When it depends on another branch, it belongs at integration. When it depends on customer intent, another mechanical rule will not resolve it.

The important question is where enough information first existed to make the right decision. That identifies both the intervention and its placement. Adding the same warning to a prompt, a hook and a reviewer may produce three interruptions without giving any of them the context needed to solve the problem.

But a new check should earn its place against valid work as well as the failure that inspired it. A migration guard needs to recognize a real split graph, leave a linear graph alone and avoid suggesting `task db:merge` for an unrelated migration problem. Otherwise it has merely automated a recurring misunderstanding.

## Autonomy can hide human work

By August 2026, about 90% of eligible merged AI PRs at Topo had no human commit after the last identified agent commit, up from about 34% in November. That is a substantial change in who edited the code. It is a much weaker statement about who did the work.

<figure>
  <a href="/articles/ai-code-integration-review/04-human-commit-proxy.svg" target="_blank" rel="noopener" title="Open full-size figure">
    <img src="/articles/ai-code-integration-review/04-human-commit-proxy.svg" alt="The share of merged AI PRs without a later human commit rises from about 34% to 90%." width="864" height="576" loading="lazy" decoding="async" />
  </a>
  <figcaption>Less late human editing. Coaching, review, earlier edits and acceptance decisions remain outside this measure.</figcaption>
</figure>

A developer can guide the agent through every difficult decision without making a commit. An agent can retry a patch many times before the final successful run. Calling either process “autonomous” because the last code change came from the agent hides the very work the system is supposed to remove.

It is possible to build a workflow that minimizes human commits while maximizing the number of times a person must pay attention. That is why I care more about recurring interruptions than authorship percentages. Which question brought someone back? Did they supply new domain judgment, or just repeat information another tool already knew? Would the next similar task need them again?

The broader research makes this concern concrete. He and colleagues observed PR throughput per developer and review load per reviewer both doubling in one enterprise.[^review-load] More output can arrive with more work for the people integrating it. Counting one side of that exchange makes the system look easier to operate than it is.

We do not yet have a direct measure of human attention saved at Topo. The next comparison I want is narrow: does giving an agent the supported repair path reduce human intervention while preserving the task and the acceptance requirements? If it does, we have removed a repeatable piece of work. If the same human corrections remain necessary, we have not removed that work.

That is the direction I want for the integration workflow: agents carry routine corrections through to verified results; people spend their attention on the assumptions and consequences the system cannot settle. The aim is to make each necessary human decision more informed, and each unnecessary one less likely to recur.

<details id="data-notes" class="article-notes">
<summary>Data and implementation notes</summary>

The figures use Topo's late-August 2026 extracts. August ends on the 27th. Models, contributors, tasks and tooling changed during the period; these observations do not isolate the productivity effect of any one intervention.

- **Throughput and delay:** `monthly_prs.csv`; May–July 2025 versus June–August 2026. Merged PRs average 80.3 and 318.3 per month. The delay comparison is the mean of monthly PR-open-to-merge medians: 4.99 and 4.52 hours. Active author accounts increased from four to seven or eight. These are not fixed-team productivity or active-review-time measurements.
- **Check placement:** `shift_left_quarterly.csv`; configured placements, not distinct rules or execution counts. Q3 2026 includes eight pre-tool guards, eight post-tool checks, five pre-commit and five pre-push checks.
- **CI:** `ci_breakdown_monthly.csv`; failures within each workflow category, excluding cancelled, skipped and empty conclusions. Core validation: 267/2,193 in October 2025 and 310/11,756 in August 2026. AI review: 675/1,202 in April. Incomplete reviews can fail the job. The August policy snapshot does not explain April's spike, and historical branch-protection enforcement was not verified.
- **Human commits:** `monthly_loop_quality.csv`; November's 34.21% covers 76 eligible merged PRs, August's 90.05% covers 382. Attribution is imperfect and excludes abandoned work. The source calls this `first_pass_merge_rate_pct`; it does not measure first-attempt success.
- **Implementation:** migration and review workflows were inspected at commit `4756dfd8c417`. The four-graph example executes the archived head checker on synthetic fixtures, not database migrations. The guard checks a combined graph and invalidates stale results; asynchronous invalidation alone does not eliminate concurrent-merge races.

The original dataset also contains bug-ticket trends. They are omitted from the main argument because ticket collection changed during the period and tickets are not linked to introducing deployments. The chart generator and selected inputs are in `scripts/article-assets/`; the raw research notes retain the other extracts.

</details>

## References

[^static-analysis]: Caitlin Sadowski, [*Static Analysis*, Software Engineering at Google](https://abseil.io/resources/swe-book/html/ch20.html).

[^agent-evals]: Anthropic, [*Demystifying evals for AI agents*](https://www.anthropic.com/research/demystifying-evals-for-ai-agents), January 2026.

[^merge-queue]: GitHub, [*Managing a merge queue*](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue).

[^elastic]: Pablo Pérez Hidalgo, Elastic, [*CI/CD pipelines with agentic AI: How to create self-correcting monorepos*](https://www.elastic.co/search-labs/blog/ci-pipelines-claude-ai-agent), September 2025.

[^stripe]: Alistair Gray, Stripe, [*Minions: Stripe's one-shot, end-to-end coding agents*](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents), February 2026.

[^structural-review]: Sean Goedecke, [*If you are good at code review, you will be good at using AI agents*](https://www.seangoedecke.com/ai-agents-and-code-review/), September 2025.

[^developer-skills]: Birgitta Böckeler, [*The role of developer skills in agentic coding*](https://martinfowler.com/articles/exploring-gen-ai/13-role-of-developer-skills.html).


[^review-load]: Hao He et al., [*AI Writes Faster Than Humans Can Review: A Longitudinal Study of an Enterprise 2x Mandate*, v2](https://arxiv.org/abs/2607.01904v2), October 2026. Observational study of one enterprise.
