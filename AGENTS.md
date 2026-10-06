# CFE Web - Home Energy Consumption Tracker

> **Mandatory: Document all changes in this file.** Every modification to the project (code, config, dependencies, scripts, docs) must be reflected in AGENTS.md — update the relevant section or add a new one. This file is the single source of truth for project knowledge.

## Mandatory: Use Codegraph

Before making any code change, **always run codegraph tools first** to understand the codebase context. Use `codegraph_context_for_task`, `codegraph_search_symbols`, `codegraph_find_callers`, `codegraph_find_callees`, `codegraph_trace_dependencies`, and `codegraph_get_impact_radius` to identify affected files, symbols, and dependencies. This is mandatory — never skip codegraph analysis before editing code.

**Codegraph is the preferred tool for codebase exploration.** Use codegraph tools instead of `read`, `grep`, or `glob` when searching for symbols, understanding dependencies, finding callers/callees, or exploring code structure. Only fall back to standard file tools (read, grep, glob) when the query cannot be satisfied by codegraph (e.g., searching for specific string literals, regex patterns in file contents, or file paths by name pattern).

---

## Project Overview

A React + Vite single-page application (SPA) for tracking household energy consumption, tariffs, and billing periods for Mexico's Federal Electricity Commission (CFE - Comisión Federal de Electricidad).

The application provides a dashboard for viewing consumption metrics, managing meter readings, households, tariffs with tiered pricing, and billing periods. It features user authentication with protected routes and automatic billing cost calculations (energy charges, distribution, transmission, service fees, IVA 16%, and DAP).

### Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend Framework** | React 19 |
| **Build Tool** | Vite 8 |
| **UI Library** | Ant Design 6 |
| **Routing** | React Router 7 |
| **Linting** | ESLint 9 (with react-hooks, react-refresh plugins) |
| **Container Runtime** | Nginx (nginx-unprivileged, Alpine-based) |
| **Node Runtime** | Node.js 22 (build stage) |
| **PWA** | vite-plugin-pwa 2 (Workbox `generateSW`) + @vite-pwa/assets-generator |

### Architecture

- **Multi-stage Docker build**: Node.js Alpine for building the Vite bundle, then Nginx Alpine for serving the static assets.
- **Security-hardened container**: Read-only filesystem, dropped capabilities, no-new-privileges, non-root user.
- **Backend API integration**: Communicates with a separate backend API for all data operations (auth, households, tariffs, meter readings, billing periods).

---

## Project Structure

```
public/                          # Static assets served from the root
├── favicon.svg / favicon.ico / icons.svg
├── pwa-64x64.png / pwa-192x192.png / pwa-512x512.png   # any-purpose PWA icons
├── maskable-icon-512x512.png    # maskable icon (safe zone) for Android
└── apple-touch-icon-180x180.png # iOS home-screen icon
src/
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI primitives
│   │   ├── FormActions.jsx       # Shared form submit/cancel buttons
│   │   ├── PageHero.jsx          # Compact hero header for config pages
│   │   ├── SectionCollapse.jsx   # Card-styled accordion for page sections
│   │   └── SuccessAlert.jsx      # Success feedback alert
│   ├── Dashboard/                # Dashboard feature components (container/presenter split)
│   │   ├── DashboardPageContainer.jsx   # Container: data fetching & state
│   │   ├── DashboardPage.jsx            # Presenter: renders dashboard layout
│   │   ├── DashboardHero.jsx            # Household/billing period selectors
│   │   ├── DashboardHighlight.jsx       # Key metric highlight row
│   │   ├── DashboardMetricsGrid.jsx     # Summary metrics grid (kWh cards)
│   │   ├── DashboardBillingBreakdown.jsx # Billing cost breakdown with CFE tier detail
│   │   └── BillingPeriodCostChart.jsx   # Chart of per-reading cost over time
│   ├── AddBillingPeriodForm.jsx
│   ├── AddHouseholdForm.jsx
│   ├── AddTariffForm.jsx
│   ├── AddTariffRangeForm.jsx
│   ├── AddTariffVersionForm.jsx
│   ├── ConsumptionForm.jsx
│   ├── ConsumptionTable.jsx
│   ├── Layout.jsx
│   ├── MeterReadingsChart.jsx
│   ├── MetricCard.jsx
│   ├── RequireAuth.jsx           # Auth guard for protected routes
│   ├── TariffRangesList.jsx
│   ├── TariffVersionsList.jsx
│   └── ThemeToggle.jsx           # Sun/moon theme toggle button
├── config/                       # Configuration
│   ├── apiConfig.js              # API endpoints, backend URL builder
│   └── consumptionMockConfig.js  # Mock data for dev
├── contexts/                     # React context providers
│   └── ThemeContext.jsx          # Theme state + localStorage persistence
├── hooks/                        # Custom React hooks
│   ├── useHouseholds.js          # Household list fetching with loading state
│   ├── useMeterReadingsPagination.js  # Paginated readings with "show all" toggle
│   └── useElementWidth.js        # ResizeObserver width tracking (chart label gating)
├── lib/                          # Core utilities
│   ├── apiClient.js              # HTTP request client
│   └── authStorage.js            # Token/session management
├── pages/                        # Route-level page components
│   ├── DashboardPage.jsx         # Renders DashboardPageContainer
│   ├── InsertarConsumoPage.jsx
│   ├── AddHouseholdPage.jsx
│   ├── AddTariffPage.jsx
│   ├── AddBillingPeriodPage.jsx
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
├── services/                     # API service layer
│   ├── authService.js
│   ├── consumoService.js         # Meter readings, billing periods, dashboard data
│   └── householdService.js
└── utils/                        # Helper functions
    ├── dateUtils.js
    ├── tierColors.js            # Centralized CFE tier + tax colors for breakdown & charts
    ├── chartLayout.js           # Shared bar-label fitting heuristic for both charts
    └── billingPeriodUtils.js     # Local-date parsing, daysBetween/periodsOverlap, generateYearPeriods, getSuggestedNextPeriod
```

---

## Routes

| Path | Component | Auth Required | Description |
|------|-----------|:-------------:|-------------|
| `/login` | LoginPage | No | User authentication |
| `/register` | RegisterPage | No | User registration (requires API key) |
| `/` | DashboardPage | Yes | Main dashboard with consumption metrics |
| `/insertar-consumo` | InsertarConsumoPage | Yes | Add/edit meter readings |
| `/agregar-vivienda` | AddHouseholdPage | Yes | Create new household |
| `/agregar-tarifa` | AddTariffPage | Yes | Manage tariffs and tiered pricing ranges |
| `/agregar-periodo` | AddBillingPeriodPage | Yes | Create billing periods |
| `*` | Redirect to `/` | Yes | Catch-all redirect |

---

## API Integration

The app communicates with a backend API. Endpoints are defined in `src/config/apiConfig.js`:

- `/auth/login` — User authentication
- `/auth/refresh` — Rotate refresh token (`VITE_AUTH_REFRESH_ENDPOINT`, defaults to `/auth/refresh`)
- `/auth/register` — User registration (requires `VITE_REGISTER_API_KEY`)
- `/auth/me` — Get current user
- `/households` — CRUD for households
- `/tariffs` — Tariff management
- `/tariff-versions` — Tariff versioning with date ranges
- `/tariff-ranges` — Tiered pricing brackets (price per kWh by consumption)
- `/household-tariffs` — Household-tariff associations
- `/meter-readings` — Consumption data logging
- `/billing-periods` — Billing cycle management
- `/dashboards/billing-period/:id` — Billing cost breakdown
- `/dashboards/household/:householdId/meter-readings` — Per-reading history with cumulative `billing_period_cost` (feeds `chart.readings`; see Dashboard History Source)

### Backend URL Configuration

Configure via environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_PROTOCOL` | `http` | Backend protocol |
| `VITE_BACKEND_HOST` | `localhost` | Backend host |
| `VITE_BACKEND_PORT` | _(empty)_ | Backend port (defaults to empty → no `:port` in URL; set to `3001` via `.env`) |
| `VITE_BACKEND_BASE_PATH` | `` | Backend base path (config normalizes a leading `/`; commonly set to `/api` via `.env`) |
| `VITE_REGISTER_API_KEY` | _(empty)_ | API key required for registration |
| `VITE_AUTH_REFRESH_ENDPOINT` | `/auth/refresh` | Override for the refresh-token endpoint |

---

## Building and Running

### Prerequisites

- Node.js 18+ (Dockerfile uses Node.js 22)
- npm

### Local Development

```bash
# Install dependencies
npm install

# Start the Vite dev server (hot reload)
npm run dev

# Lint the codebase
npm run lint
```

### Production Build

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

### PWA (installable app)

`npm run build` also emits `dist/sw.js`, `dist/workbox-*.js` and `dist/manifest.webmanifest`. The service worker is **only active in production builds** — `npm run dev` does not register it (no `devOptions.enabled`) so development never serves stale caches. To test the installed experience locally:

```bash
npm run build
npm run preview   # service workers require a secure context; localhost qualifies
```

Chromium reports zero installability errors for the build; on Safari/iOS install via **Compartir → Añadir a pantalla de inicio**. Icons are generated from `public/favicon.svg` and must not be hand-edited — regenerate them with:

```bash
npx @vite-pwa/assets-generator --preset minimal public/favicon.svg
```

### Docker

```bash
# Build and run (requires .env file for environment variables)
docker compose up --build

# Application will be available at http://localhost:3011
```

The Docker setup uses a multi-stage build and serves the app via Nginx on port 3011. The container is security-hardened with a read-only filesystem, tmpfs mounts for `/tmp`, `/var/cache/nginx`, and `/var/run`, and dropped Linux capabilities.

---

## Development Conventions

- **ESLint**: Configured with `@eslint/js`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`. Unused variables prefixed with `A-Z` or `_` are allowed (e.g., unused React state setters).
- **JSX**: Uses the modern JSX transform (React 19). No explicit `React` import needed.
- **Component Style**: Functional components with React hooks. UI uses Ant Design components with a custom theme (primary color `#3b82f6`, IBM Plex Sans font).
- **Module System**: ES modules (`"type": "module"` in package.json).
- **Container/Presenter Pattern**: The Dashboard feature follows a strict container/presenter split. `DashboardPageContainer` owns all data fetching and state; `DashboardPage` (presenter) receives everything via props and only renders UI. Apply this pattern to any new feature components that need async data.
- **CSS Modules**: Component-specific styles use CSS Modules (`*.module.css` co-located next to each component file).

---

## Key Design Notes

- **Responsive Shell (Layout)**: `Layout` drives the app shell. `isMobile = screens.lg === false` via Ant Design `Grid.useBreakpoint()` — the shell breakpoint is the Ant Design `lg` breakpoint (**992px**). Requiring an explicit `false` (instead of `!screens.lg`) keeps desktop from flashing the mobile bottom nav while `screens.lg` is still `undefined` on the first render; antd resolves the breakpoint in a layout effect, so the desktop shell that mobile renders for that measurement is replaced before paint. Below 992px the `Sider` is not rendered and navigation moves to a fixed bottom nav; at ≥992px the shell adds the collapsible dark `Sider` (240px wide, 80px collapsed) next to the sticky blur header, which renders at every width. `Layout.module.css` gates only header/content spacing behind `@media (min-width: 992px)`; on mobile the content area reserves `padding-bottom: calc(88px + var(--sab, 0px))` so the bar plus the iPhone home-indicator inset never cover content.
- **Mobile Bottom Nav + Más Drawer**: On mobile (<992px) `Layout` renders a fixed `<nav>` with three tabs — Dashboard (`/`), Lecturas (`/insertar-consumo`) and Más (`moreTab`, rendered after `primaryNavItems` since it is an action, not a route). Más opens a right-side Ant Design `Drawer` — rendered only while `isMobile` — with Viviendas (`/agregar-vivienda`), Tarifas (`/agregar-tarifa`) and Periodos (`/agregar-periodo`) from `moreNavItems`, plus Logout; the desktop `Sider` renders `desktopNavItems`, the concatenation of both lists, and a shared `NavButton` renders the tabs and the drawer rows (`tab` / `drawer` variants). The active key prefix-matches `location.pathname` against `desktopNavItems` (`/` is the fallback and never participates in the match); drawer routes map to the Más tab (`isMoreRoute`). The Más tab carries `aria-current="page"` and `aria-expanded`; while the drawer is open the matching drawer row takes over `aria-current` so only one element marks the current page. The bar height is `60px + var(--sab, 0px)` and the active item gets a top indicator bar. The drawer closes on item selection, on route changes (state adjusted during render, so browser back/forward included) and when the breakpoint flips. Logout works from the drawer on mobile and from the header at ≥992px, where the More trigger does not render.
- **Admin Pages Mobile Layout**: The config pages (`/agregar-vivienda`, `/agregar-periodo`, `/agregar-tarifa`) render a compact `PageHero` (reduced padding and title size on mobile; its optional aside becomes a two-column hero at ≥1024px) plus a `SectionCollapse` accordion (card-styled wrapper over Ant Design `Collapse`). All sections start collapsed to cut the total scroll on 360/390px screens; the tariff page controls `activeKey` so pressing "Rangos" on a version auto-opens the ranges section. Creation/result cards live inside their own section: `AddBillingPeriodPage` owns the "Generar periodos del año" button and its result (extracted from `AddBillingPeriodForm`, which now reports the selected household through `onHouseholdChange`). `SectionCard` was removed after losing its last consumer.
- **Tariff Tables on Mobile**: `TariffVersionsList` and `TariffRangesList` dropped `scroll.x` and use responsive columns so edit/delete actions stay reachable without a horizontal swipe: below `sm` the versions table shows a combined `Vigencia` column and the ranges table a combined `Rango` column, while `ID`, `Estado`, `Mínimo` and `Máximo` render from `sm` up. Below the Ant Design `md` breakpoint (`Grid.useBreakpoint()`, `screens.md === false`) the action buttons render icon-only with `aria-label`s and the tables use compact cell padding, so everything fits at 360/390px. Column widths are deliberately unset (`table-layout: auto`) so the browser fits the content.
- **Dark Mode Implementation**: Full dark mode support with manual toggle (no system preference tracking). `ThemeContext` in `src/contexts/ThemeContext.jsx` provides `theme` state ('light'|'dark') and `toggleTheme()` function, persisted to localStorage (default: 'light'). `ThemeToggle` component renders a sun/moon icon button (Ant Design `SunOutlined`/`MoonOutlined`) with `aria-label="Cambiar tema"`. The toggle appears in the Layout header (desktop: next to logout button; mobile: before logout button) and in the top-right corner of LoginPage and RegisterPage (via `.themeToggle` class). `main.jsx` wraps the app in `ThemeProvider` and uses `useTheme()` to dynamically switch Ant Design's algorithm (`theme.darkAlgorithm` vs `theme.defaultAlgorithm`), with separate component token overrides for Layout (sider, header, body backgrounds) and Menu in each mode. CSS variables in `src/index.css` define dark mode values for `html[data-theme="dark"]` (backgrounds, text colors, borders, shadows). All CSS modules use `:global(html[data-theme="dark"])` selectors instead of `@media (prefers-color-scheme: dark)` to ensure theme changes apply immediately without page reload. All hardcoded colors (rgba whites, slate grays) in dashboard components, charts, tables, cards, and admin pages have been replaced with CSS variables (`--color-border`, `--color-surface`, `--color-text`) or theme-aware values so every route stays legible in both themes at 360px and 768px. **Chart components** (`BillingPeriodCostChart`, `MeterReadingsChart`) read `useTheme()` and apply theme-aware colors to G2 axis labels (`labelFill`/`titleFill`), bar label `fill`, and legend `itemLabelFill`, because `@ant-design/plots` v2 renders its own SVG and does not inherit AntD's `darkAlgorithm`. The shell (header, bottom nav, drawer) and auth pages (Login, Register) are fully styled for both themes. The sidebar keeps its dark palette (`theme="dark"` on Ant Design Sider/Menu) in both modes.
- **Ant Design Theme**: Custom theme tokens are defined in `src/main.jsx` including primary/success/error colors, border radius, and component-specific overrides (Button height, Card border radius, Layout colors, Menu styling for the sidebar). The theme algorithm switches between light and dark based on `ThemeContext` state.
- **Auth Flow**: Uses `RequireAuth` component as a route guard. Auth tokens are managed via `src/lib/authStorage.js`.
- **Mock Data**: `src/config/consumptionMockConfig.js` provides sample data for development, including mock billing rates (Energy: $1.34/kWh, Distribution: $0.38/kWh, Transmission: $0.11/kWh, Service: $39.50, IVA: 16%).
- **Meter Readings Pagination**: `useMeterReadingsPagination` provides paginated display of billing-period readings with an optional "show all" toggle that lazy-fetches all readings for the selected household. Items are sorted descending (newest first) client-side.
- **Responsive Reading History**: Below 768px the `Tabla` tab of `ConsumptionTable` renders the reading history as cards (fecha, kWh, nota, Editar) and hides the Ant Design table; from 768px up the table renders and the cards are hidden. Both views stay in the DOM and switch through `ConsumptionTable.module.css` media queries, so the first paint already matches the viewport without a JS breakpoint-measure flash (an `Empty` replaces the list when there are no readings). Because the table paginates its own `dataSource`, the cards are sliced client-side with the same `paginationConfig` (`current`/`pageSize`) and the standalone mobile `Pagination` receives `total` explicitly (it has no dataSource) plus only `current`/`pageSize`/`onChange`, in `simple` mode — no size changer, quick jumper or total text. The card-header page-size `Select` (`.pageSizeSelect`) is hidden below 768px, so phones paginate 10 per page or use the "Mostrar todo" toggle. Removing `size="small"` from that pager also lets it inherit the theme's 44px pagination `itemSize` (antd's small variant would shrink it to `controlHeightSM`). With no `onUpdateItem` (e.g. `/insertar-consumo`) the cards omit Editar; with it, Editar opens the same edit modal and save flow as the table. The table no longer sets `scroll={{ x: 720 }}`: its four columns fit the card at every width where the table is shown (≥768px), so the forced width only produced an inner horizontal scrollbar on tablets. `.ant-table-content` keeps `overflow-x: auto` as a safety net for future columns.
- **Mobile Touch & iOS Inputs**: Below the shell breakpoint (`@media (max-width: 991.98px)`) `index.css` raises every native control (`input`, `textarea`, `select`) to a 16px base, because iOS Safari auto-zooms the viewport when a focused control renders below that threshold; element selectors also reach Ant Design's internal inputs (Select search box, DatePicker, pagination pager), so no per-component override is needed. The same media block enforces the 44px touch minimum on antd's small controls — `.ant-btn-sm` gets `min-height: 44px` and icon-only buttons a square `min-width: 44px`, and the `.ant-pagination-mini` pager that `Table size="small"` renders in the tariff tables is clamped back from `controlHeightSM` (44 × 0.75 = 33px) — which complements the `controlHeight: 44` ConfigProvider token that already sizes default buttons, inputs, and pagination items (Popconfirm's default ok/cancel buttons are small, so they are covered too). `min-height`/`min-width` only clamp the generated sizes, so button padding and labels keep their layout. The same block raises Ant Design's `.ant-checkbox-wrapper` to a 44px row, covering the readings form's "La lectura es inicial" toggle, whose box plus label is only ~22px tall by default.
- **Dashboard Chart Tabs**: `ConsumptionTable` renders the consumption and billing-cost charts in Ant Design `Tabs` with `destroyInactiveTabPane` enabled to force remount/reflow when switching tabs, preventing desktop chart width shrink after tab toggles.
- **Dashboard Data Flow**: `DashboardPageContainer` orchestrates: household list (`useHouseholds`), billing period list, dashboard API data (`getDashboardConsumptions`), and meter reading pagination (`useMeterReadingsPagination`). A `latestRequestIdRef` guards against race conditions when the user switches households/periods quickly. When the household list fails to load (offline, API down) or comes back empty, the container stops the loading state and surfaces `householdsError` — or `No hay viviendas registradas.` — through the same error alert instead of leaving the skeleton spinning forever.
- **Race Condition Guard**: `DashboardPageContainer` uses a monotonically incrementing `latestRequestIdRef` to discard stale API responses when the user changes selections before the prior fetch completes.
- **CFE Billing Breakdown**: `DashboardBillingBreakdown` renders tier-based cost breakdown (Básico, Intermedio, Excedente tiers with color-coded tags) grouped by `tier_level` from the API's `tier_lines` array. Formatters use `Intl.NumberFormat` with `es-MX` locale.
- **Billing Period Cost Chart**: `BillingPeriodCostChart` renders a stacked column chart that breaks down cumulative cost per reading by CFE tier (`Básico`, `Intermedio`, `Intermedio2`, `Excedente`) plus `IVA` and `DAP`. Tier line data comes from `billing_period_cost.cfe_breakdown.tier_lines`; taxes come from `billing_period_cost.iva` / `dap`. The chart falls back to a single "Subtotal" bar when the API does not provide a tier breakdown. Uses the **@ant-design/plots v2 / G2 v5 API**: `stack: true` (maps to the `stackY` transform) plus `colorField: 'series'` and an explicit `scale.color` with `domain`/`range` computed from the data via `getSeriesColor` so each range has a distinct color. Bar thickness is controlled with `style.maxWidth` (72) / `style.minWidth` (24) — v1's `columnWidthRatio` is ignored by G2 v5. **Gotchas**: (1) v1-style options (`isStack: true`, top-level `color: (datum) => …` callback, `columnWidthRatio`) are silently ignored by G2 v5 — never reintroduce them; the color must come from the `colorField` channel, not a mark-level `color` prop. (2) Do NOT set `seriesField` — the G2 interval mark treats the `series` channel as a dodging band (each series gets its own thin, horizontally-offset sub-band, producing thin, misaligned bars). `stackY` groups by the `color` channel, so `colorField` alone is sufficient.
- **Tier Color Sharing**: Tier and tax colors are centralized in `src/utils/tierColors.js` and used by both `BillingPeriodCostChart` and `DashboardBillingBreakdown` so the desglose and the chart stay consistent for 3-range and 4-range tariffs. `getSeriesColor` prefers level-based coloring (`tierLevel`/`maxLevel`) when supplied; otherwise it falls back to exact name matching. This keeps middle tiers (`Intermedio`, `Intermedio2`, …) visually distinct in the stacked chart.
- **Chart Tooltip Formatting**: both charts format tooltip values through G2 v5 `tooltip.items: [{ field: 'value', valueFormatter }]` — the v1 `tooltip.formatter` callback is silently ignored and leaks raw floating-point values. Use `field: 'value'` (the raw datum), not `channel: 'y'`, because `stackY` has already turned the `y` channel into cumulative values (the tooltip would report running totals instead of each tier's own amount). `valueFormatter` and axis `labelFormatter` return `N/D` for non-finite values to keep overlays readable when API data is incomplete. The tooltip title is the reading's full date (`fullDate`).
- **Charts on Small Screens**: Both charts wrap the `Column` in a `.chartCanvas` div with a fixed height per breakpoint (260px base, 300px ≥640px, 340px ≥1024px) and pass `containerStyle: { width: '100%', height: '100%' }` so G2 measures the wrapper instead of falling back to its 480px default canvas. Axes must be configured through G2's `axis: { x, y }` — plots v2 silently ignores the v1 `xAxis`/`yAxis` keys; label formatting/rotation/hiding use `labelFormatter`, `labelAutoRotate` and `labelAutoHide` (the object accepts `keepHeader`/`keepTail`, not the v1 `equidistance` config). Bar value labels render only when they fit: `useElementWidth` measures the `.chartCanvas` wrapper and `hasRoomForBarLabels` (in `src/utils/chartLayout.js`) checks `(containerWidth - yAxisReserve) / readingCount >= MIN_BAR_LABEL_SLOT` (72px; labels are ~62px wide at fontSize 10). The y-axis reserve is 80px for the kWh chart and 100px for the cost chart. At narrow widths G2's `overlapHide`/`overflowHide` label transforms do not reliably hide the colliding labels, so they are simply not rendered (tooltips keep every value). Label formatters follow G2's `(value, datum, index, data)` signature — the first argument is the resolved text value, not the v1 datum object; the old datum-style callbacks silently rendered empty labels. The legend is compacted via `itemLabelFontSize`, `itemMarkerSize`, `itemSpacing` and `rowPadding`. Reading dates render as short labels (`DD mmm`) and full tooltip dates via `formatReadingDate`/`formatFullReadingDate`, which use the date part of `YYYY-MM-DD`/ISO strings so they do not shift a day in local time.
- **Consumption Chart (kWh by tier)**: `MeterReadingsChart` renders a stacked column chart of kWh consumption per reading broken down by CFE tier, mirroring `BillingPeriodCostChart` (same `@ant-design/plots` v2 pattern: `stack: true`, `colorField: 'series'`, explicit `scale.color` domain/range, `style.minWidth/maxWidth`, plus the shared small-screen treatment above). Tier kWh comes from `billing_period_cost.cfe_breakdown.tier_lines[].kwh_charged`; falls back to a single "Subtotal" bar with `total_consumption_kwh` when the API has no tier breakdown. It also normalizes non-finite values in y-axis, tooltip, and bar label formatters to return `N/D` instead of `NaN` when readings include invalid numeric data.
- **Dashboard History Source**: `getDashboardConsumptions` (in `services/consumoService.js`) fetches per-reading history from `/dashboards/household/:householdId/meter-readings?billing_period_id=...`, normalized via `normalizeDashboardReading` into `{ id, date, readingKwh, consumptionSinceLast, estimatedCost, billing_period_cost }` and exposed as `chart.readings` on the returned object. This is the data that drives `BillingPeriodCostChart` / `MeterReadingsChart` tier breakdowns. The call is wrapped in try/catch and degrades to an empty `chart.readings` array on failure. Each reading carries its own `billing_period_cost` (cumulative cost from the first reading), so charts must read `billing_period_cost.cfe_breakdown.tier_lines` per item, not the period-level billing summary.
- **Billing Period Utilities**: `src/utils/billingPeriodUtils.js` provides timezone-safe local-date helpers (`parseLocalDate`/`formatLocalDate` internally via explicit date parts to avoid UTC shifting) and exports `formatReadingDate(dateString, options)`/`formatFullReadingDate(dateString)` for display — both use the date part of `YYYY-MM-DD` and ISO datetime values so they never shift a day in local time, and the charts use them for the short `DD mmm` axis labels and full tooltip titles — plus `addDays`, `daysBetween`, `periodsOverlap`, `getLatestPeriod`, `getPeriodDurationDays`, `getSuggestedNextPeriod`, and `generateYearPeriods`. Always use these for period date math instead of raw `new Date(isoString)` to keep dates anchored to local midnight.
- **Bulk Billing Period Creation**: `createYearBillingPeriods(householdId, year)` in `consumoService.js` generates covering ranges for a full year using the latest existing period's duration (`getPeriodDurationDays`; defaults to bimonthly ~59 days), skips any range that overlaps an existing period via `periodsOverlap`, creates non-overlapping periods sequentially, and returns `{ year, durationDays, created, skipped, errors }`. It is the consumer of `billingPeriodUtils.js`.
- **Mobile Acceptance Pass (automatable part)**: Verified in Chromium via Playwright at 360/390/768px in both themes with the backend mocked, across `/login`, `/register`, `/`, `/insertar-consumo`, `/agregar-vivienda`, `/agregar-tarifa` and `/agregar-periodo` (admin sections expanded, versions/ranges tables rendered): no document-level horizontal overflow, the mobile Más drawer opens → navigates → closes, the theme toggle flips `data-theme`, and no touch target falls below 44px. This pass fixed the readings-table width and the checkbox touch row (see the two bullets above). The per-route × width × theme checklist and the method live in `docs/acceptance/mobile.md`; the real iPhone/Safari run on the LAN is the remaining manual step tracked by issue #8.
- **PWA (installable + offline shell)**: `vite-plugin-pwa` 2 runs in `generateSW` mode (config in `vite.config.js`): `registerType: 'autoUpdate'` plus Workbox `skipWaiting`/`clientsClaim` make a new deployment take over on the next load, and `injectRegister: null` leaves registration to `src/main.jsx`, which calls `registerSW({ immediate: true })` from `virtual:pwa-register`. The generated SW precaches the built shell plus the `public/` icons (`globPatterns` js/css/html/svg/png/ico/woff2), serves `index.html` for unknown navigations (`navigateFallback`, so deep routes work offline) and runtime-caches Google Fonts (`StaleWhileRevalidate` for the CSS, `CacheFirst` for the webfonts). The manifest ("CFE Consumos", `display: standalone`, theme/background `#f4f6fa`, 64/192/512 + maskable 512 icons) is generated as `dist/manifest.webmanifest` and linked from `index.html`, which also carries the iOS meta tags and `apple-touch-icon-180x180.png`. `docker/nginx/default.conf` answers `/sw.js` and `/manifest.webmanifest` with `Cache-Control: no-cache` so deployments roll out without waiting for cache expiry. Offline, the shell and fonts load from cache while data pages degrade through their normal error alerts (see Dashboard Data Flow); `npm run dev` never registers the SW, so use `npm run build && npm run preview` to test installed mode.

---

## Git Branch Naming Guidelines (Mandatory)

Format: `<type>/<issue-id>-<description>` (omit the ID for trivial changes without an issue: `<type>/<description>`). Examples: `feature/42-add-dark-mode`, `bugfix/17-dashboard-race-condition`, `chore/1-css-cleanup-shell-docs`.

1. **Type prefix** — Start the branch with a type: `feature/` (new functionality), `bugfix/` (fix), `hotfix/` (urgent), `refactor/` (no behavior change), `docs/`, `test/`, or `chore/` (tooling, dependencies, housekeeping). No near-duplicates such as `enhancement/` or `improvement/`.

2. **Issue ID** — When an issue exists, put its number after the type: `bugfix/17-dashboard-race-condition`. It gives branch ↔ issue ↔ PR traceability and auto-links on GitHub. Omit it only for small changes without an issue.

3. **Lowercase and hyphen-separated** — Only lowercase letters, digits and hyphens: `bugfix/17-dashboard-race-condition`, never `Bugfix/John_DashboardFix`, `bugfix/dashboard_race` or `bugfix/dashboardRace`. No spaces, underscores, camelCase or personal names.

4. **Specific and short** — The description identifies the work at a glance and stays under ~50 characters: `feature/9-tariff-versioning`, not `feature/updates` nor `feature/new-feature`. The area word comes from the shared area list in the Commit Guidelines (e.g. `dashboard-race-condition`, `ui-mobile-shell`).

5. **One branch, one logical change** — One logical change = one issue, feature, fix or refactor (a branch may still hold several atomic commits for that single change). Delete the branch after merge and do not reuse it.

## Git Commit Guidelines (Mandatory)

1. **Atomic commits** — Each commit must contain one logically separate change. If a description gets too long, split the commit into finer-grained pieces. Never mix unrelated changes (e.g., a bugfix + a refactor + a feature) in a single commit.

2. **Imperative subject line (≤50 chars)** — The first line must summarize the change in imperative mood, e.g. "add tariff history endpoint" not "added tariff history endpoint" or "I added tariff history endpoint". Keep it under 50 characters and omit the trailing period.

3. **Body explains *why*** — After a blank line, the body must explain the reasoning behind the change — what problem it solves, why this approach was chosen, and any alternatives considered. The body should be detailed enough that reviewers and future maintainers can understand the change without reading the diff.

4. **Area prefix** — Prefix the subject line with a scope from the shared area list (used by commits and branch descriptions): `dashboard:`, `ui:`, `readings:`, `tariffs:`, `households:`, `periods:`, `auth:`, `api:`, `pwa:`, `docker:`, `docs:`, `chore:`. This makes history scanning fast and groups related changes.

5. **Never commit broken state** — Every commit should leave the project in a working state. Avoid "fix fixup" commits that repair a mistake from an earlier commit in the same branch. Use `git rebase -i` to squash or amend before opening a PR.

---

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in `Lmex89/home_consumption_cfe_web`, operated via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, each mapping 1:1 to its default string. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
