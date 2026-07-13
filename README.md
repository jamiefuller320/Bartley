# Bartley Insight

School performance **evaluation and visualisation** for [Bartley Church of England Junior School](https://www.compare-school-performance.service.gov.uk/school/116338/bartley-church-of-england-junior-school) (URN **116338**).

## What it does

- Pulls institution-level Key Stage 2 attainment from the **DfE Explore Education Statistics API** (the open data behind Compare school and college performance)
- Compares Bartley with **Hampshire** and **England**
- Surfaces automatic evaluation findings (strengths, watch points, priorities)
- Visualises attainment, higher standard, pupil-group gaps, cohort context, and last available progress scores

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Live data endpoint

```bash
curl http://localhost:3000/api/school/116338
```

The UI ships with a curated 2024/25 snapshot in `src/data/bartley-2024-25.json`. The API route refreshes from DfE on demand.

## Data notes

- Primary public page: Compare school performance for URN 116338
- Machine-readable source: [Explore education statistics API](https://api.education.gov.uk/statistics/docs)
- KS2 progress measures are limited for 2024–25 cohorts (no KS1 baseline due to COVID-19 disruption)

## Stack

Next.js · TypeScript · Tailwind CSS · Recharts
