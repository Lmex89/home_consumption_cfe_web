import { apiEndpoints, backendConfig, buildApiUrl } from '../config/apiConfig'
import { requestApi } from '../lib/apiClient'

export async function listHouseholds() {
  const households = await requestApi(apiEndpoints.households, {
    query: { limit: 500, offset: 0 },
  })

  if (!Array.isArray(households)) {
    return []
  }

  return households.map((household) => ({
    value: household.id,
    label: household.name ? `${household.id} - ${household.name}` : String(household.id),
  }))
}

export async function listTariffs() {
  const tariffs = await requestApi(apiEndpoints.tariffs, {
    query: { limit: 500, offset: 0 },
  })

  if (!Array.isArray(tariffs)) {
    return []
  }

  return tariffs.map((tariff) => ({
    value: tariff.id,
    label: `${tariff.code} - ${tariff.description || ''}`,
    code: tariff.code,
    description: tariff.description,
  }))
}

export async function createTariff(code, description) {
  const createdTariff = await requestApi(apiEndpoints.tariffs, {
    method: 'POST',
    body: {
      code: code?.trim() || '',
      description: description?.trim() || null,
    },
  })

  return {
    success: true,
    tariff: createdTariff,
  }
}

export async function createHousehold(name) {
  const createdHousehold = await requestApi(apiEndpoints.households, {
    method: 'POST',
    body: {
      name: name?.trim() || null,
    },
  })

  return {
    success: true,
    household: createdHousehold,
  }
}

export async function createHouseholdTariff(householdId, tariffId, startDate, endDate) {
  const createdHouseholdTariff = await requestApi(apiEndpoints.householdTariffs, {
    method: 'POST',
    body: {
      household_id: householdId,
      tariff_id: tariffId,
      start_date: startDate,
      end_date: endDate || null,
    },
  })

  return {
    success: true,
    householdTariff: createdHouseholdTariff,
  }
}

export async function createHouseholdWithTariff(householdName, tariffId, startDate, endDate) {
  // Create household first
  const householdResult = await createHousehold(householdName)
  const householdId = householdResult.household.id

  // Then create household-tariff association
  const householdTariffResult = await createHouseholdTariff(
    householdId,
    tariffId,
    startDate,
    endDate,
  )

  return {
    success: true,
    household: householdResult.household,
    householdTariff: householdTariffResult.householdTariff,
  }
}

export async function listTariffVersions(tariffId) {
  const versions = await requestApi(apiEndpoints.tariffVersions, {
    query: { 
      tariff_id: tariffId,
      limit: 500, 
      offset: 0 
    },
  })

  if (!Array.isArray(versions)) {
    return []
  }

  return versions.map((version) => ({
    id: version.id,
    tariffId: version.tariff_id,
    startDate: version.start_date,
    endDate: version.end_date,
    createdAt: version.created_at,
    updatedAt: version.updated_at,
  }))
}

export async function createTariffVersion(tariffId, startDate, endDate) {
  const createdVersion = await requestApi(apiEndpoints.tariffVersions, {
    method: 'POST',
    body: {
      tariff_id: tariffId,
      start_date: startDate,
      end_date: endDate || null,
    },
  })

  return {
    success: true,
    tariffVersion: createdVersion,
  }
}

export async function updateTariffVersion(versionId, startDate, endDate) {
  const updatedVersion = await requestApi(`${apiEndpoints.tariffVersions}/${versionId}`, {
    method: 'PUT',
    body: {
      start_date: startDate || undefined,
      end_date: endDate === '' ? null : endDate,
    },
  })

  return {
    success: true,
    tariffVersion: updatedVersion,
  }
}

export async function deleteTariffVersion(versionId) {
  await requestApi(`${apiEndpoints.tariffVersions}/${versionId}`, {
    method: 'DELETE',
  })

  return {
    success: true,
  }
}

export async function listTariffRanges(tariffVersionId) {
  const ranges = await requestApi(apiEndpoints.tariffRanges, {
    query: {
      tariff_version_id: tariffVersionId,
      limit: 500,
      offset: 0,
    },
  })

  if (!Array.isArray(ranges)) {
    return []
  }

  return ranges.map((range) => ({
    id: range.id,
    tariffVersionId: range.tariff_version_id,
    rangeMin: range.range_min,
    rangeMax: range.range_max,
    pricePerKwh: range.price_per_kwh,
    createdAt: range.created_at,
    updatedAt: range.updated_at,
  }))
}

export async function createTariffRange(tariffVersionId, rangeMin, rangeMax, pricePerKwh) {
  const createdRange = await requestApi(apiEndpoints.tariffRanges, {
    method: 'POST',
    body: {
      tariff_version_id: tariffVersionId,
      range_min: Number(rangeMin),
      range_max: rangeMax === '' || rangeMax === null ? null : Number(rangeMax),
      price_per_kwh: Number(pricePerKwh),
    },
  })

  return {
    success: true,
    tariffRange: createdRange,
  }
}

export async function updateTariffRange(tariffRangeId, rangeMin, rangeMax, pricePerKwh) {
  const updatedRange = await requestApi(`${apiEndpoints.tariffRanges}/${tariffRangeId}`, {
    method: 'PUT',
    body: {
      range_min: rangeMin === '' || rangeMin === null ? undefined : Number(rangeMin),
      range_max: rangeMax === '' || rangeMax === null ? null : Number(rangeMax),
      price_per_kwh: pricePerKwh === '' || pricePerKwh === null ? undefined : Number(pricePerKwh),
    },
  })

  return {
    success: true,
    tariffRange: updatedRange,
  }
}

export async function deleteTariffRange(tariffRangeId) {
  await requestApi(`${apiEndpoints.tariffRanges}/${tariffRangeId}`, {
    method: 'DELETE',
  })

  return {
    success: true,
  }
}

export function getApiConfig() {
  return {
    backend: backendConfig,
    endpoints: {
      households: buildApiUrl(apiEndpoints.households),
      tariffs: buildApiUrl(apiEndpoints.tariffs),
      tariffVersions: buildApiUrl(apiEndpoints.tariffVersions),
      tariffRanges: buildApiUrl(apiEndpoints.tariffRanges),
      householdTariffs: buildApiUrl(apiEndpoints.householdTariffs),
      meterReadings: buildApiUrl(apiEndpoints.meterReadings),
      billingPeriods: buildApiUrl(apiEndpoints.billingPeriods),
    },
  }
}
