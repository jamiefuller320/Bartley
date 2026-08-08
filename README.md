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
- Surfaces automatic evaluation findings (strengths, watch points, priorities), pairing **latest-year scores** with **DfE 3-year averages** (and local rolling means for equity gaps) for smoothing
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

### Manual data entry (KS1 + SIP)

Open **`/data-entry`** to insert:

- Feeder **KS1 / phonics** percentages (saved as `src/data/feeder-asp-overlay.json`)
- **SIP priorities** and numeric chart ambitions (saved as `src/data/sip-targets.json`)

Because the site is a static GitHub Pages export, the form downloads JSON for you to commit into the repo. After updating the KS1 overlay, run:

```bash
npm run refresh-feeders
```

The current Bartley SIP on GovernorHub is linked from the page:
`https://app.governorhub.com/document/69691cd1ffcc4db7df83f5f4/view`

### Refresh data from DfE

```bash
npm run refresh-data
```

Writes an updated snapshot to `src/data/bartley-2024-25.json`.

## Governor analysis

Open `/analysis` for a written governing-board briefing generated from the published data, including:

- Overall attainment, subject pattern, equity and progress findings
- Strategic questions for school leaders, grouped by theme
- Caveats about cohort size, COVID gaps and data limits

Rich multi-year subject comparisons use the official **Compare school performance KS2 CSV downloads**:

- Available in-app: **2015/16–2018/19** and **2022/23–2024/25**
- Not available in performance tables: **2019/20–2021/22** (COVID cancellation / not published)
- 2014/15 and earlier use a different assessment framework, so they are excluded for like-for-like comparison

Refresh the CSP extract:

```bash
python3 scripts/extract-csp-history.py
```

The Explore Education Statistics API institution dataset only goes back to 2022/23 and leaves many subject expected-standard fields blank (`z`) for earlier years in that pack — the CSP downloads are the fuller source for subject-level history.

## Stack

Next.js (static export) · TypeScript · Tailwind CSS · Recharts · GitHub Pages
