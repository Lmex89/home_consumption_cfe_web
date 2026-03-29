# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Configuracion de backend y API mock

Puedes configurar host y URL base del backend con variables de entorno de Vite.

1. Copia `.env.example` a `.env`.
2. Ajusta los valores `VITE_BACKEND_*` segun tu entorno.

Variables soportadas:

- `VITE_BACKEND_PROTOCOL` (default: `http`)
- `VITE_BACKEND_HOST` (default: `localhost`)
- `VITE_BACKEND_PORT` (default: `3001`)
- `VITE_BACKEND_BASE_PATH` (default: `/api`)

La app tambien centraliza los datos mock de consumo y tarifas en `src/config/consumptionMockConfig.js`.
