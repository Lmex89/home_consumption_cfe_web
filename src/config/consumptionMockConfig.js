export const consumptionMockConfig = {
  getDelayMs: 650,
  postDelayMs: 500,
  seedData: [
    { fecha: '2026-03-01', kWh: 45.2, note: 'Turno matutino' },
    { fecha: '2026-03-02', kWh: 48.1, note: 'Pico de demanda' },
    { fecha: '2026-03-03', kWh: 42.5, note: 'Operacion regular' },
    { fecha: '2026-03-04', kWh: 50.3, note: 'Mayor uso de climatizacion' },
    { fecha: '2026-03-05', kWh: 47.8, note: 'Sin incidencias' },
  ],
  billingRates: {
    energia: 1.34,
    distribucion: 0.38,
    transmision: 0.11,
    servicio: 39.5,
    iva: 0.16,
  },
}
