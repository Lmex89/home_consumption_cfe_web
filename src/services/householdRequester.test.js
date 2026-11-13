// @vitest-environment node
import { listHouseholds } from './householdService'

it('normaliza los Hogares con una solicitud inyectada', async () => {
  const request = vi.fn(async () => [{ id: 7, name: 'Casa' }])

  await expect(listHouseholds(request)).resolves.toEqual([{ value: 7, label: '7 - Casa' }])
  expect(request).toHaveBeenCalledWith('/households', {
    query: { limit: 500, offset: 0 },
  })
})
