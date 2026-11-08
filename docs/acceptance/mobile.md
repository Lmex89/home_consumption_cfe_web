# Aceptación móvil (issue #8)

Checklist de aceptación por ruta a **360 / 390 / 768 px**, en tema **claro y oscuro**.
Corresponde a la parte automatizable de la issue #8 (la sesión real en iPhone/Safari
servida por LAN queda como paso manual).

## Método

- App construida (`npm run build`) servida con `vite preview`.
- Navegador Chromium (Playwright), viewport móvil con `is_mobile`/`has_touch` a 360 y 390 px.
- API mockeada por intercepción de red (households, billing-periods, meter-readings,
  dashboards, tariffs, tariff-versions, tariff-ranges) para que cada ruta renderice
  tablas y gráficas reales.
- Token y tema sembrados en `localStorage` (`cfe_access_token`, `cfe-theme`).
- En `/agregar-tarifa` se despliegan las secciones y se renderizan las tablas de
  versiones y rangos.

## Checklist por ruta

| Ruta | 360 claro | 360 oscuro | 390 claro | 390 oscuro | 768 claro | 768 oscuro |
|------|:---------:|:----------:|:---------:|:----------:|:---------:|:----------:|
| `/login` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/register` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/` (dashboard) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/insertar-consumo` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/agregar-vivienda` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/agregar-tarifa` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/agregar-periodo` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

✓ = sin scroll horizontal de página, contenido alcanzable y legible en el tema indicado.

## Comprobaciones adicionales

- [x] Sin scroll horizontal **interno** en la tabla de lecturas (768–1280 px) ni en las
  tablas de versiones/rangos de tarifas.
- [x] Drawer "Más" abre → navega → cierra en móvil.
- [x] El toggle de tema alterna `data-theme` sin recargar.
- [x] Ningún objetivo táctil por debajo de 44 px (incluido el checkbox de lectura inicial).

## Hallazgos corregidos en esta pasada

- `ConsumptionTable` forzaba `scroll={{ x: 720 }}` → scroll interno de 720 px en un
  contenedor de 676 px a 768–800 px. Eliminado.
- El checkbox "La lectura es inicial" medía 22 px de alto → 44 px bajo el breakpoint del shell.

No aparecieron hallazgos mayores.

## Pendiente (manual)

- [ ] Sesión real en iPhone/Safari con la app servida en LAN (login, dashboard, insertar
  lectura, toggle dark y navegación sin bugs bloqueantes).
