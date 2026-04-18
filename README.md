# CFE Web - Home Energy Consumption Tracker

A React + Vite web application for tracking household energy consumption, tariffs, and billing periods for Mexico's Federal Electricity Commission (CFE).

## Features

- **Dashboard** - View consumption metrics, summaries, and billing costs
- **Meter Readings** - Log and manage daily kWh consumption with notes
- **Household Management** - Add and manage multiple households
- **Tariff Management** - Configure electricity tariffs with:
  - Tariff codes and descriptions
  - Tariff versions with date ranges
  - Tiered pricing ranges (price per kWh by consumption brackets)
- **Billing Periods** - Define and track billing cycles
- **Authentication** - User login/registration with protected routes
- **Billing Calculations** - Automatic cost breakdown including:
  - Energy charges
  - Distribution fees
  - Transmission fees
  - Service charges
  - IVA (16% tax) and DAP

## Tech Stack

- **React 19** - UI library
- **Vite 8** - Build tool and dev server
- **Ant Design 6** - UI component library
- **React Router 7** - Client-side routing
- **ESLint** - Code linting

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── ConsumptionForm.jsx
│   ├── ConsumptionTable.jsx
│   ├── Layout.jsx
│   ├── MetricCard.jsx
│   └── ...
├── config/             # Configuration files
│   ├── apiConfig.js    # API endpoints and backend config
│   └── consumptionMockConfig.js
├── hooks/              # Custom React hooks
│   └── useHouseholds.js
├── lib/                # Core libraries
│   ├── apiClient.js    # API request client
│   └── authStorage.js  # Auth token management
├── pages/              # Route pages
│   ├── DashboardPage.jsx
│   ├── InsertarConsumoPage.jsx
│   ├── AddHouseholdPage.jsx
│   ├── AddTariffPage.jsx
│   ├── AddBillingPeriodPage.jsx
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
├── services/           # API service layers
│   ├── authService.js
│   ├── consumoService.js
│   └── householdService.js
└── utils/              # Utility functions
    └── dateUtils.js
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | LoginPage | User authentication |
| `/register` | RegisterPage | User registration |
| `/` | DashboardPage | Main dashboard with consumption metrics |
| `/insertar-consumo` | InsertarConsumoPage | Add/edit meter readings |
| `/agregar-vivienda` | AddHouseholdPage | Create new household |
| `/agregar-tarifa` | AddTariffPage | Manage tariffs and ranges |
| `/agregar-periodo` | AddBillingPeriodPage | Create billing periods |

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_PROTOCOL` | `http` | Backend protocol |
| `VITE_BACKEND_HOST` | `localhost` | Backend host |
| `VITE_BACKEND_PORT` | `3001` | Backend port |
| `VITE_BACKEND_BASE_PATH` | `/api` | Backend base path |
| `VITE_REGISTER_API_KEY` | - | API key required for user registration |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Docker

### Build and Run

```bash
docker compose up --build
```

The application will be available at `http://localhost:3011`.

### Docker Configuration

- Container runs as non-root (`nginxinc/nginx-unprivileged`)
- Filesystem is read-only with tmpfs for temp directories
- Security hardened with dropped capabilities and no-new-privileges
- Health check endpoint at `/health`

## API Integration

The app communicates with a backend API through these endpoints:

- `/auth/login` - User authentication
- `/auth/register` - User registration (requires API key)
- `/auth/me` - Get current user
- `/households` - Household management
- `/tariffs` - Tariff management
- `/tariff-versions` - Tariff versioning
- `/tariff-ranges` - Tiered pricing ranges
- `/household-tariffs` - Household-tariff associations
- `/meter-readings` - Consumption data
- `/billing-periods` - Billing cycle management
- `/dashboards/billing-period/:id` - Billing cost dashboard

## Mock Data

For development, the app includes mock configuration in `src/config/consumptionMockConfig.js` with sample consumption data and billing rates:

- Energy: $1.34/kWh
- Distribution: $0.38/kWh
- Transmission: $0.11/kWh
- Service: $39.50
- IVA: 16%
