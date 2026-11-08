# Capa de normalización entre backend y frontend

El frontend incluye una capa explícita de normalización en los services (`consumoService.js`, `householdService.js`) que traduce todas las respuestas del backend antes de que lleguen a los componentes. Las funciones `normalizeReading`, `normalizeDashboardReading` y `buildBilling` convierten los campos del backend (snake_case: `reading_date`, `reading_kwh`, `total_cost_witout_taxes`) a la forma que usa el frontend (camelCase o español: `fecha`, `kWh`, `totalMxn`).

Esto es deliberado: desacopla la forma de los datos del backend de la forma que espera la UI. Si el backend cambia nombres de campos o estructura de respuestas, solo se actualiza la capa de normalización, no todos los componentes. El costo es código extra y una transformación adicional en cada respuesta.

Una alternativa (usar los datos del backend directamente) habría acoplado la UI a la forma del API, haciendo que cualquier cambio en el backend propagara cambios por toda la interfaz.
