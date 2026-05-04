# CFE Web - Home Energy Consumption Tracker

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

### Architecture

- **Multi-stage Docker build**: Node.js Alpine for building the Vite bundle, then Nginx Alpine for serving the static assets.
- **Security-hardened container**: Read-only filesystem, dropped capabilities, no-new-privileges, non-root user.
- **Backend API integration**: Communicates with a separate backend API for all data operations (auth, households, tariffs, meter readings, billing periods).

---

## Project Structure

```
src/
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI primitives
│   │   ├── FormActions.jsx       # Shared form submit/cancel buttons
│   │   ├── SectionCard.jsx       # Bordered section wrapper card
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
│   └── TariffVersionsList.jsx
├── config/                       # Configuration
│   ├── apiConfig.js              # API endpoints, backend URL builder
│   └── consumptionMockConfig.js  # Mock data for dev
├── hooks/                        # Custom React hooks
│   ├── useHouseholds.js          # Household list fetching with loading state
│   └── useMeterReadingsPagination.js  # Paginated readings with "show all" toggle
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
    └── dateUtils.js
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

### Backend URL Configuration

Configure via environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_PROTOCOL` | `http` | Backend protocol |
| `VITE_BACKEND_HOST` | `localhost` | Backend host |
| `VITE_BACKEND_PORT` | `3001` | Backend port |
| `VITE_BACKEND_BASE_PATH` | `/api` | Backend base path |
| `VITE_REGISTER_API_KEY` | _(empty)_ | API key required for registration |

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

- **Ant Design Theme**: Custom theme tokens are defined in `src/main.jsx` including primary/success/error colors, border radius, and component-specific overrides (Button height, Card border radius, Layout colors, Menu styling for the sidebar).
- **Auth Flow**: Uses `RequireAuth` component as a route guard. Auth tokens are managed via `src/lib/authStorage.js`.
- **Mock Data**: `src/config/consumptionMockConfig.js` provides sample data for development, including mock billing rates (Energy: $1.34/kWh, Distribution: $0.38/kWh, Transmission: $0.11/kWh, Service: $39.50, IVA: 16%).
- **Meter Readings Pagination**: `useMeterReadingsPagination` provides paginated display of billing-period readings with an optional "show all" toggle that lazy-fetches all readings for the selected household. Items are sorted descending (newest first) client-side.
- **Dashboard Data Flow**: `DashboardPageContainer` orchestrates: household list (`useHouseholds`), billing period list, dashboard API data (`getDashboardConsumptions`), and meter reading pagination (`useMeterReadingsPagination`). A `latestRequestIdRef` guards against race conditions when the user switches households/periods quickly.
- **Race Condition Guard**: `DashboardPageContainer` uses a monotonically incrementing `latestRequestIdRef` to discard stale API responses when the user changes selections before the prior fetch completes.
- **CFE Billing Breakdown**: `DashboardBillingBreakdown` renders tier-based cost breakdown (Básico, Intermedio, Excedente tiers with color-coded tags) grouped by `tier_level` from the API's `tier_lines` array. Formatters use `Intl.NumberFormat` with `es-MX` locale.
