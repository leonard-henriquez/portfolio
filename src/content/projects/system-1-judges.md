---
title: System 1 judges
status: exploring
start: 2026
role: Method
order: 9
summary: "Fast, calibrated scoring: a judgment split into dozens of yes/no questions, answered as probabilities by a decision model in one call and aggregated in code. First use case: outbound emails."
focus: Fast, calibrated LLM scoring
results:
  - "~65 atomic rules"
  - "2,755 reference templates"
  - "One model call per email"
tags: [evals, calibration]
excerpt: "A slow model writes the rubric once, as narrow yes/no questions with prewritten fixes. A fast decision model answers all of them in one call, as calibrated probabilities, and code aggregates: gates cap the score, and each failed rule points at its sentence and returns its fix."
images:
  photo:
    src: ../../assets/photo/dunes.jpg
    alt: Ochre dunes under a pale sun
    position: center
  pixel:
    src: ../../assets/pixel/dunes.png
    alt: Pixelated ochre dunes under a pale sun
  illustration:
    src: ../../assets/illustration/trail.jpg
    alt: "Pixel art: a hiker walks a rocky trail toward a sunset over the mountains"
    position: 30% 60%
    zoom: 1.8
---

## The problem

An agent improves only as fast as its feedback. The usual LLM-as-a-judge asks a frontier model for a rating and a rationale. That takes seconds per draft, costs too much to run inside a loop, and is poorly calibrated. Such judges also show position, verbosity and self-enhancement biases ([Zheng et al., 2023](https://arxiv.org/abs/2306.05685)).

My first use case was a writing agent for outbound sales emails. It rewrites a draft until it passes, so the judge is called many times per email. It has to answer in under a second, cost a fraction of a cent, and say exactly what to fix.

## The idea

Separate System 2 from System 1, in Kahneman's sense. A slow model does the expensive thinking once: it writes the rubric as narrow, checkable questions, each with a prewritten fix. A fast decision model answers those questions on every draft, as probabilities. Code does the arithmetic.

## Method

1. Decompose
2. Route
3. Ask once
4. Score with probabilities
5. Aggregate in code
6. Calibrate

- **Decompose.** About 65 atomic rules in families: gates, deliverability, subject line, opening, personalization, value, call to action, tone, structure, follow-ups. One rule checks one requirement, as in TICK, where checklists raised judge–human exact agreement from 46.4% to 52.2% over direct scoring ([Cook et al., 2024](https://arxiv.org/abs/2410.03608)).
- **Route.** Anything code can measure exactly stays in code: length, links, empty variables, spam words, the ratio of "you" to "I", readability. Only judgment calls go to the model.
- **Ask once.** All judgment questions for an email go in one request to Jev, TypeSafe's decision model, which returns one probability per yes/no question. Adding questions barely changes latency, so splitting into many calls only adds cost.
- **Probabilities, not ratings.** A calibrated P(yes) is already a continuous score, so rules are yes/no questions with precise true/false criteria rather than 1-to-5 scales. G-Eval weights scores by output probabilities for the same reason ([Liu et al., 2023](https://arxiv.org/abs/2303.16634)).
- **Aggregate in code.** A failed gate caps the score whatever the other rules say. Answers in the uncertain band are flagged, not counted as failures. The email is split into indexed sentences, so each failed rule points at its sentence and returns its fix, with no second model call.
- **Calibrate.** 2,755 real templates ranked through pairwise comparisons serve as the reference. Reliability diagrams and expected calibration error check that a 0.8 means 80% ([Guo et al., 2017](https://arxiv.org/abs/1706.04599)).

## Writing good questions

The craft is in the questions. A good rule names something observable. Not "is the personalization good?", but "if you replace the company name with a competitor's, is the first sentence still true?". Each rule is a small object: an ID, a family, code or model, the question and its criteria, a weight, a gate flag, when it applies (language, sequence step, seniority), and the fix.

The feedback the writing agent receives is short on purpose: the top three fixes, ranked by weight times the chance of failure. With forty fixes at once, the agent over-corrects and the loop oscillates. The loop stops when the score passes the threshold or stops improving, and keeps the best version rather than the last.

## Why it transfers

The pattern fits anywhere an agent needs a reward signal in a tight loop: code review, support replies, extraction checks. A slow model writes the rubric, a fast calibrated model applies it, code aggregates. Emails are the first use case, not the point.

## Side lab: training a small decision model

To understand how a model like Jev works, I am reproducing the idea at small scale on a laptop. A small open-weight encoder reads the state and all questions in one sequence; an attention mask lets each question see the state but not the other questions, so many decisions come out of a single forward pass. Separate heads handle choices, yes/no and ordinal answers. Training starts supervised, then moves to reinforcement learning rewarded on calibration, compared against a reward on accuracy alone to show how that makes a model overconfident.

## Limits

- Calibration claimed by a vendor has to be measured on your own labelled set before you trust a threshold.
- Sixty-five rules are correlated. Their weights should be fitted to the reference ranking, not set by hand.
- A writing agent that optimizes a judge will find its blind spots. A held-out set ranked by people keeps it honest.
