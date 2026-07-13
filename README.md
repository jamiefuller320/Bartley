# Bartley Insight

School performance **evaluation and visualisation** for [Bartley Church of England Junior School](https://www.compare-school-performance.service.gov.uk/school/116338/bartley-church-of-england-junior-school) (URN **116338**).

## Live site (GitHub Pages)

After this branch is merged to `main` and Pages is enabled:

**https://jamiefuller320.github.io/Bartley/**

### Enable GitHub Pages (one-time)

1. Open the repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**
3. Merge to `main` (or run the **Deploy GitHub Pages** workflow manually)

The workflow in `.github/workflows/deploy-pages.yml` builds a static export and publishes it.

## What it does

- Uses institution-level Key Stage 2 attainment from the **DfE Explore Education Statistics API** (the open data behind Compare school and college performance)
- Compares Bartley with **Hampshire** and **England**
- Surfaces automatic evaluation findings (strengths, watch points, priorities)
- Visualises attainment, higher standard, pupil-group gaps, cohort context, and last available progress scores

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Static build (same output as Pages)

```bash
npm run build          # local paths
npm run build:pages    # with /Bartley base path for GitHub Pages
npm start              # serves the `out/` folder
```

### Refresh data from DfE

```bash
npm run refresh-data
```

Writes an updated snapshot to `src/data/bartley-2024-25.json`.

## Data notes

- Primary public page: Compare school performance for URN 116338
- Machine-readable source: [Explore education statistics API](https://api.education.gov.uk/statistics/docs)
- Institution-level history currently available for **2022/23, 2023/24 and 2024/25**
- KS2 progress measures are limited for 2024–25 cohorts (no KS1 baseline due to COVID-19 disruption)
- GitHub Pages hosts a static UI; it does not run a server-side API

## Stack

Next.js (static export) · TypeScript · Tailwind CSS · Recharts · GitHub Pages
