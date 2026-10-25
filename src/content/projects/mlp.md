---
title: "MLP: neural networks from scratch"
shortTitle: MLP
status: released
start: 2012
end: 2026
role: Solo project
order: 11
summary: "A neural network written three times, in 2012, 2015 and 2026, now a small C++ library with no dependencies that reads handwritten digits with 97.4% accuracy on MNIST, live in the terminal."
focus: Neural networks from scratch, C++, no dependencies
dek: "I wrote my first neural network in 2012, rewrote it during an internship at Jalgos in 2015, and rebuilt it from scratch in 2026 as a small C++ library with no dependencies."
excerpt: "It trains a perceptron, learns XOR with a hidden layer, and reads handwritten digits with 97.4% accuracy on MNIST, live in the terminal. Every line of the maths is written by hand and checked by tests, and all three versions live in the same repository."
results:
  - 97.4% accuracy on MNIST
  - Gradients match finite differences to 10⁻⁷
  - Zero third-party libraries
stack: [C++98, Make]
tags: [Neural networks, MNIST]
links:
  - label: GitHub
    href: https://github.com/leonard-henriquez/MLP
images:
  photo:
    src: ../../assets/photo/night.jpg
    alt: Stars above a mountain ridge at night
    caption: Stars, night
    position: center 25%
  pixel:
    src: ../../assets/pixel/night.png
    alt: Pixelated stars above a mountain ridge at night
    caption: Stars, 120×74 px
    position: center 25%
  illustration:
    src: ../../assets/illustration/clouds.jpg
    alt: "Pixel art: a sea of clouds below a mountain slope"
    caption: Clouds
    position: 30% 65%
    zoom: 2
  illustrationPixel:
    src: ../../assets/pixel/clouds.png
    alt: "Pixel detail: a sea of clouds below a mountain slope"
    caption: Clouds, 256×171 px
    position: 30% 65%
    zoom: 2.4
---

## Three versions, one repository

| Version | What it was | Where it stopped |
| --- | --- | --- |
| 2012 · Prototypes | Code::Blocks, in French. One neuron, perceptron rule, AND, OR and NOR truth tables | Linking neurons together |
| 2015 · Jalgos | A Qt interface, then a console program. MNIST on Eigen and MKL, multithreading, batch mode | 30 commits in five weeks |
| 2026 · Rewrite | C++98, no dependencies. Perceptron to multilayer network, tested | 97.4% on MNIST, live terminal demos |

Each version kept what the previous one taught and dropped the rest. The repository holds all three: the 2012 code and the 2015 code are each one tag away from the current one.

## 2012: one neuron at a time

The first version was a set of Code::Blocks projects written in French: `SimpleNeurone`, `Neurons`, `Perceptron`, `NeuronalClass`, and a Qt window that never got past its skeleton. The goal was to understand a single neuron before stacking them.

A single neuron was trained with the perceptron rule on AND, OR and NOR, read from truth tables in a small text format of my own (`exemples 4; entrees 2; 1/1/1; ...`). The next step, linking neurons together through pointers, never compiled.

Those truth tables are still in the repository, unchanged since April 2012, and the current library still reads them.

## 2015: scaling up at Jalgos

Three years later, during a summer internship at Jalgos, I picked the idea up again with a real dataset: MNIST, 60,000 handwritten digits. The repository started there, on July 13, 2015, and its 30 commits from that summer are untouched.

It began as a Qt interface with dialogs to load MNIST and run a network. Two weeks in, I dropped the interface for a console program:

- matrix maths on Eigen, with Intel MKL and multithreading;
- a batch mode, a validation set to measure generalisation, and an adaptive learning rate;
- networks saved to and loaded from files, and a test mode;
- a branch benchmarking iterative against recursive computation.

It leaned on two large libraries I had not written. Baptiste Henriquez contributed the man page, the last commit of that summer.

## 2026: the rewrite, with no dependencies

Coming back to it, I wanted what the 2015 version lacked: every line of the maths written by hand, with no library underneath, small enough to read and covered by tests. The 2015 code was removed from the main branch and kept under the `2015-jalgos` tag; the rewrite started from scratch, keeping only the 2012 truth tables.

It is plain C++98 and a Makefile, nothing else:

- a `Perceptron`, then `Layer` and `Network` classes trained by stochastic gradient descent;
- step, sigmoid, tanh and linear activations, chosen per layer;
- an MNIST reader, PGM image loading, and a network file format that round-trips exactly;
- a portable random generator, so a seed gives the same network on every machine;
- unit tests, including a check of every gradient against finite differences;
- a terminal interface that shows the networks learning, frame by frame.

## How it learns

Each neuron computes a weighted sum of its inputs plus a bias, then applies its activation: y = f(w · x + b). Training shows the network one example at a time and nudges every weight against the gradient of the squared error.

1. **Forward pass.** Each layer computes its outputs and keeps its inputs and weighted sums s for the way back.
2. **Backward pass.** The output layer starts from dE/dy = y − t. Each layer turns the gradient it receives into a delta per neuron, passes the gradient on to the layer before, then updates its own weights:

```text
δⱼ    = ∂E/∂yⱼ · f′(sⱼ)
∂E/∂xᵢ = Σⱼ δⱼ · wⱼᵢ
wⱼᵢ   ← wⱼᵢ − η · δⱼ · xᵢ
```

The step I trust least is the one I wrote myself, so the tests check it. For a 3-4-3-2 network, they nudge every weight by 10⁻⁶, measure how the error moves, and compare with the update backpropagation made. They agree to 10⁻⁷ on every weight.

## Results

A 784-100-10 network, measured on the 10,000 MNIST test images it never trains on (`bin/mnist_train` with default settings, seed 1). Before training: 10.1%, chance.

| Epoch | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Test accuracy | 93.9% | 95.7% | 96.2% | 96.6% | 97.0% | 97.3% | 97.2% | 97.4% | 97.5% | 97.4% |

Most of the gain comes in the first epoch; from the sixth on, accuracy stays between 97.2% and 97.5%. The hardest digits are 8 (94.9%), most often read as 3, and 7 (96.0%), most often read as 2.

## Try it

It needs a C++ compiler and `make`, nothing else. From the repository root:

```sh
make && make test             # build, then run the unit tests
bin/tui                       # interactive demos in the terminal
scripts/download_mnist.sh     # 11 MB, needed for the MNIST demos
```

The terminal interface has three demos:

| Demo | What you watch |
| --- | --- |
| Logic gates | A perceptron and a 2-3-1 network learn AND, OR, NOR and XOR side by side, with the error curve and a map of each network's output redrawn as it trains. The perceptron gives up on XOR; the hidden layer solves it in about 4,000 epochs. |
| MNIST training | A 784-100-10 network trains live on 60,000 digits at about 10,000 images per second, with the current image, the ten outputs and the test accuracy climbing. |
| MNIST test | Browse the 10,000 test digits, jump to the next mistake, or try the hand-drawn digits shipped in the repository. |

Your own handwriting works too: draw a digit, convert it with `magick my-digit.png my-digit.pgm`, train a network once (`bin/mnist_train`, about a minute), and run `bin/recognize data/mnist/mnist.mlp my-digit.pgm`. Any size works, black on white or white on black: the image is cropped, scaled to 20×20 and centred by its centre of mass, the way MNIST itself was built.

## Trade-offs, chosen on purpose

| Choice | What it costs |
| --- | --- |
| No libraries: every matrix loop written by hand | Slower than Eigen or BLAS, but every operation is readable in a few lines |
| C++98 only | No `auto` or smart pointers, but it builds with any compiler of the last twenty years |
| One example at a time (online gradient descent) | No batching or GPU, but backpropagation reads exactly like the maths |
| Plain-text formats for datasets and networks | Larger files, but a trained network can be opened and read |
| A terminal interface built on ANSI escape codes, not ncurses | More code to handle keys and resizing, and still zero dependencies |

## Status

Released. The library, the command line programs and the terminal demos are on [GitHub](https://github.com/leonard-henriquez/MLP), with the 2012 and 2015 versions one tag away: [`2012-prototypes`](https://github.com/leonard-henriquez/MLP/tree/2012-prototypes) and [`2015-jalgos`](https://github.com/leonard-henriquez/MLP/tree/2015-jalgos).
