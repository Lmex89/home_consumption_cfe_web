# CFE Web — Dashboard de consumo de energía eléctrica

Aplicación web React para visualizar y gestionar el consumo de energía eléctrica
de viviendas, con dashboards de métricas, desglose de costos y gestión de lecturas.

Este frontend consume la API del backend (`api-cfe`). Los términos del dominio
(Vivienda, Lectura, Consumo, Tarifa, Periodo, etc.) están definidos en el glosario
del backend. Este glosario cubre los términos específicos de la capa de presentación.

## Language

**Hogar**:
Término de la interfaz para referirse a una Vivienda. Son sinónimos: "Hogar" es el nombre que ve el usuario, "Vivienda" es el concepto del dominio.
_Avoid_: Household (en el código), punto de consumo

**Hogar activo**:
La vivienda actualmente seleccionada en el dashboard. Es un estado de la UI (no del dominio). Cambiar el hogar activo recarga todas las métricas, lecturas y costos del dashboard.
_Avoid_: selectedHouseholdId (nombre de variable), vivienda seleccionada

**Periodo activo**:
El periodo de facturación actualmente seleccionado en el dashboard. Es un estado de la UI. Cambiar el periodo activo filtra las lecturas y recalcula el desglose de costos.
_Avoid_: selectedBillingPeriodId (nombre de variable), periodo seleccionado

**Dashboard**:
La vista principal de la aplicación. Muestra métricas de consumo (actual, anterior, promedio, máximo), un desglose del costo total (subtotal, IVA, DAP), una tabla de lecturas del periodo activo, y gráficas de tendencia.
_Avoid_: panel, página principal, home

**Desglose**:
La descomposición del costo total en sus componentes: subtotal sin impuestos, IVA (16%), DAP (5%), y total. Se muestra en el dashboard como un panel colapsable.
_Avoid_: breakdown, detalle de costos, composición del precio

**Lectura inicial**:
Una lectura marcada con el flag `is_initial`. Representa el punto de partida del periodo de facturación (el kWh acumulado al inicio del bimestre). El consumo se calcula restando esta lectura de la última.
_Avoid_: lectura base, punto de partida

**Costo estimado**:
El costo total calculado para el periodo activo, mostrado en el dashboard. Es una estimación porque se actualiza en tiempo real conforme se agregan lecturas, pero el monto final lo determina la CFE al emitir la factura oficial.
_Avoid_: total estimado, monto aproximado

**Capa de normalización**:
Las funciones en los services (`normalizeReading`, `normalizeDashboardReading`, `buildBilling`) que traducen las respuestas del backend (snake_case: `reading_date`, `reading_kwh`) a la forma que usa el frontend (camelCase o español: `fecha`, `kWh`). Esta capa desacopla la forma del backend de la forma del frontend.
_Avoid_: adapter, transformer, mapper
