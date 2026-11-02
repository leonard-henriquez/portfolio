# Article figures

Regenerates the six SVG figures used by `/articles/ai-code-integration-review/` from frozen, aggregate Topo CSVs, restricted to the columns used by the figures and their denominators. No live credentials or per-person records are involved. The article's appendix documents the populations, dates and interpretation limits; August 2026 is partial through the 27th.

```sh
pnpm install --frozen-lockfile
python3 -m venv /tmp/portfolio-figures
/tmp/portfolio-figures/bin/pip install -r scripts/article-assets/requirements.txt
MPLCONFIGDIR=/tmp/portfolio-matplotlib /tmp/portfolio-figures/bin/python scripts/article-assets/render_figures.py
```

The generator uses the exact Space Grotesk and Space Mono WOFF2 files installed by the portfolio's Fontsource dependencies. Temporary static TTFs provide Matplotlib's font metrics; the original WOFF2s are embedded in each SVG so standalone files and HTML images do not depend on fonts installed on the reader's machine. Arrow symbols absent from the Latin subset use a symbol fallback. The font licenses ship in `public/articles/ai-code-integration-review/fonts/`.

SVG output goes to `public/articles/ai-code-integration-review/`. PNGs and SVG copies for local editorial review go to `writing/ai-code-review/figures/`. `calculations.json` records the opening comparison. SVG timestamps and identifier seeds are fixed to avoid unrelated diffs when regenerated in the same environment.

The sixth figure is conceptual. It illustrates the single-head migration invariant and is not a trace of a production incident. Regeneration does not execute database migrations or modify the Topo repository.
