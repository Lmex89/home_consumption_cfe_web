import { apiEndpoints, backendConfig, buildApiUrl } from '../config/apiConfig'
import { consumptionMockConfig } from '../config/consumptionMockConfig'

let consumptionsStore = [...consumptionMockConfig.seedData]

function wait(response, delay = 650) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(response), delay)
  })
}

function buildSummary(items) {
  const total = items.reduce((accumulator, item) => accumulator + item.kWh, 0)
  const current = items.at(-1)?.kWh ?? 0
  const previous = items.at(-2)?.kWh ?? 0
  const average = items.length > 0 ? total / items.length : 0
  const values = items.map((item) => item.kWh)

  return {
    total,
    current,
    previous,
    average,
    max: values.length > 0 ? Math.max(...values) : 0,
    min: values.length > 0 ? Math.min(...values) : 0,
    difference: current - previous,
    currentDate: items.at(-1)?.fecha ?? 'Sin fecha',
  }
}

function buildBilling(summary) {
  const rates = consumptionMockConfig.billingRates

  const subtotalEnergia = summary.total * rates.energia
  const cargoDistribucion = summary.total * rates.distribucion
  const cargoTransmision = summary.total * rates.transmision
  const cargoServicio = rates.servicio
  const subtotal =
    subtotalEnergia + cargoDistribucion + cargoTransmision + cargoServicio
  const iva = subtotal * rates.iva
  const totalMxn = subtotal + iva

  return {
    totalMxn,
    breakdown: [
      { concept: 'Energia consumida', amount: subtotalEnergia },
      { concept: 'Distribucion', amount: cargoDistribucion },
      { concept: 'Transmision', amount: cargoTransmision },
      { concept: 'Cargo fijo de servicio', amount: cargoServicio },
      { concept: 'IVA (16%)', amount: iva },
    ],
  }
}

export async function getDashboardConsumptions() {
  const items = [...consumptionsStore].sort((left, right) => left.fecha.localeCompare(right.fecha))
  const summary = buildSummary(items)

  return wait({
    endpoint: buildApiUrl(apiEndpoints.dashboard),
    items,
    summary,
    billing: buildBilling(summary),
  }, consumptionMockConfig.getDelayMs)
}

export async function createConsumption(newConsumption) {
  const normalizedItem = {
    fecha: newConsumption.fecha,
    kWh: Number(newConsumption.kWh),
    note: newConsumption.note?.trim() || '',
  }

  consumptionsStore = [...consumptionsStore, normalizedItem].sort((left, right) =>
    left.fecha.localeCompare(right.fecha),
  )

  // Simula la respuesta del POST sin persistencia real fuera de memoria.
  return wait({
    success: true,
    endpoint: buildApiUrl(apiEndpoints.consumptions),
    backend: backendConfig,
    item: normalizedItem,
  }, consumptionMockConfig.postDelayMs)
}

export function getApiConfig() {
  return {
    backend: backendConfig,
    endpoints: {
      consumptions: buildApiUrl(apiEndpoints.consumptions),
      dashboard: buildApiUrl(apiEndpoints.dashboard),
    },
  }
}