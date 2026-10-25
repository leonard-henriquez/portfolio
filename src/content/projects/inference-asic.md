---
title: Low-cost inference ASIC
status: study
start: 2026
role: Feasibility study
order: 10
summary: How low can the cost per million tokens go on a mature 12 nm node, with LPDDR and an SRAM cache instead of HBM?
focus: Inference ASIC study, lowest cost per token
results:
  - "~12 nm node"
  - "No HBM, no CoWoS"
stack: [LPDDR, SRAM, INT4/FP4, vLLM, SGLang]
tags: [ASIC, inference, feasibility study]
images:
  photo:
    src: ../../assets/photo/ridges.jpg
    alt: Sun behind hazy peaks
    caption: Sun, haze
    position: right 30%
  pixel:
    src: ../../assets/pixel/ridges.png
    alt: Pixelated sun behind hazy peaks
    caption: Haze, 120×74 px
    position: right
  illustration:
    src: ../../assets/illustration/trail.jpg
    alt: "Pixel art: the sun setting between rocky peaks"
    caption: Sunset
    position: 74% 42%
    zoom: 2.4
  illustrationPixel:
    src: ../../assets/pixel/trail.png
    alt: "Pixel detail: the sun setting between rocky peaks"
    caption: Sunset, 256×171 px
    position: 73% 42%
    zoom: 3
excerpt: "A fabless Transformer ASIC with no HBM and no CoWoS, which makes up for the missing bandwidth with heavy batching and low-precision formats."
---

## The question

How low can the cost per million tokens go on silicon anyone can still buy? Most inference chips race for latency. A large share of AI workloads does not need it: asynchronous agents, synthetic data generation, large-scale retrieval jobs. For those, throughput per dollar is the only number that matters.

> Build the truck, not the race car.

## The thesis

A fabless ASIC specialized for Transformer inference, designed for the lowest cost per token rather than the lowest latency. Every architectural choice follows one thread: supply chain resilience. The real bottlenecks in AI chips today are high-bandwidth memory and advanced packaging, not silicon. A chip that needs neither can be sourced from several suppliers at every step.

| Choice | Instead of | Why |
| --- | --- | --- |
| LPDDR or GDDR, with an SRAM cache tier | HBM, or SRAM only | Standard memory with many suppliers. SRAM-only designs optimize for latency and run short of capacity on mature nodes. |
| Mature node, around 12 nm | Leading-edge nodes | Lower mask and wafer costs, more foundry options. |
| Standard packaging | CoWoS-class advanced packaging | Avoids the tightest bottleneck in the supply chain. |
| Minimal licensed IP | Large third-party IP blocks | Keeps the design portable between foundries. |
| Narrow native software stack | CUDA compatibility | CUDA's moat is software. A backend for vLLM and SGLang covering about ten open model families is enough for the target workloads. |

## Making up for bandwidth

Without HBM, memory bandwidth is the constraint. The design compensates in three ways: heavy batching, which the target workloads allow; low-precision formats such as INT4 and FP4; and memory scheduling decided by the compiler. A deterministic, compiler-scheduled architecture also moves complexity from hardware into software, which matters because verification is roughly half to sixty percent of the labor in a chip project. Staying on the software side as long as possible is the cheapest way to reduce that effort.

## The risks I accepted

- **Architectural obsolescence.** A Transformer-specialized chip takes about three years to design. Compiler programmability mitigates it but does not remove it.
- **Latency that will not compete.** By design. The chip is for batch work.
- **An unproven cost model.** The cost per token has to hold on real mixture-of-experts workloads, not only dense models.

## What the study concluded

I ran a full feasibility study: technical feasibility, design cost and commercial viability. The architecture holds together on paper. The venture, as I would have started it, did not. It needs a co-founder who has already shipped silicon, which is a co-founder problem and not a hiring one. It needs an anchor customer, ideally a model maker willing to co-design. And it needs the cost model tested against real mixture-of-experts workloads before raising money.

The study also changed my view of where the leverage is. Reducing the cost of using compute moves the market more than reducing the cost of producing it. That pushed my later work toward the software layers of inference: how agents spend tokens, and how to route them.

## What I took from it

I came to this with no background in semiconductors and built the domain from first principles: tape-out economics, memory hierarchies, packaging, verification flows from performance models to FPGA prototypes. The method transfers. Start from the constraint that actually binds, here memory and packaging supply, and let every other choice follow from it.
