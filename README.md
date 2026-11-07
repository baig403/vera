# Vera

A Shariah-compliant stock screener. Vera applies AAOIFI-style two-layer screening to globally listed equities and shows the arithmetic behind every verdict.

**Live:** https://vera-nine-neon.vercel.app

---

## Why this exists

Investors who want to screen equities against Islamic finance principles generally have two options: pay for a subscription screener, or trust a static list somebody else compiled. Neither tells you *why* a company passed or failed, and neither moves when the balance sheet does.

Vera shows its working. Every verdict comes with the ratios that produced it, the thresholds they were measured against, and the data they were computed from — so the output is auditable rather than taken on trust.

## Screening methodology

Screening runs in two layers. A company must clear both.

### Layer 1 — Business activity

Failed outright if its FMP sector or industry classification falls in an excluded category: alcohol, tobacco, gambling, weapons and defence, adult entertainment, pork and non-halal meat, or conventional interest-based finance.

Matching is deliberately conservative. Only FMP's structured `sector` and `industry` fields are checked — free-text company descriptions are excluded, because substring matching against marketing copy produces false positives. Explicit negations are also honoured, so an industry classified "Beverages - Non-Alcoholic" does not fail the alcohol screen.

### Layer 2 — Financial ratios

Measured per AAOIFI Shari'ah Standard No. 21. Both 30% tests use **market capitalisation** as the denominator, as the standard specifies.

| Ratio | Threshold | Formula |
|---|---|---|
| Interest-bearing debt | < 30% | Total interest-bearing debt ÷ market capitalisation |
| Interest-bearing investments | < 30% | (Cash + short-term investments) ÷ market capitalisation |
| Prohibited income | < 5% | Interest and other prohibited income ÷ total revenue |

A result within 10% of its threshold is returned as **DOUBTFUL** rather than a clean pass, because a screen that reports a borderline case as a confident verdict is misleading. The band is proportional rather than a flat number of points — a fixed 5-point band would swallow the entire 5% income test and mark 0% as borderline.

Where a ratio cannot be computed from the available data, Vera returns **INSUFFICIENT DATA**. It never treats a missing denominator as a zero, because "we don't know" rendered as "0%, comfortably compliant" is the most dangerous output a screener can produce.

Vera also computes a **purification ratio** — prohibited income as a share of total revenue — for the portion of returns a holder may wish to purify.

### Advisory check

Standard 21 sets no accounts-receivable ratio. It does raise a related concern: a company whose assets are essentially all cash and receivables falls under sarf and debt-sale rules rather than ordinary equity rules. Vera surfaces an illiquid-assets check for that case, reported separately and clearly labelled as advisory. It does not change the verdict, and it is not presented as an AAOIFI test.

### Known limitations

- Market capitalisation is point-in-time. Standard 21 prescribes no averaging window, so a company near a threshold can change verdict on price movement alone. Dow Jones Islamic smooths over 24 months and S&P Shariah over 36; Vera follows the standard and does not smooth.
- Prohibited income is approximated from reported interest income. A company earning prohibited revenue through an operating segment rather than interest will not be caught by this ratio — only by the business-activity layer.
- Coverage is strongest for US-listed equities. Some tickers require a paid data-provider plan.

> Vera is a research tool, not religious guidance. Screening standards differ between AAOIFI, the major Islamic index providers, and individual scholars. Consult a qualified scholar for rulings.

## Features

- Screen any listed ticker with full ratio breakdown
- Side-by-side comparison of multiple tickers
- Watchlist and portfolio tracking (requires sign-in)
- Methodology page documenting every threshold and its source
- Installable as a PWA
- 24-hour local cache so repeat lookups don't burn API quota

## Stack

React 19 · Vite · Tailwind CSS 4 · React Router · Supabase (auth and persistence) · Chart.js · Three.js / React Three Fiber · GSAP · Financial Modeling Prep API

## Running locally

```bash
git clone https://github.com/baig403/vera.git
cd vera
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with:

```
VITE_FMP_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

An FMP key is available free at [financialmodelingprep.com](https://site.financialmodelingprep.com/developer/docs). The free tier is rate-limited; Vera throttles requests to 1.5s apart and caches responses for 24 hours to stay inside it.

## Author

Abdullah Baig — Sustainability and Financial Management, University of Waterloo

## License

MIT — see [LICENSE](LICENSE).
