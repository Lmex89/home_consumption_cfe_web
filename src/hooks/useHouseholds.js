import { useEffect, useState } from 'react'
import { listHouseholds } from '../services/consumoService'

/**
 * Loads the list of available households from the API.
 * Returns loading state and the list; callers manage their own selectedId.
 */
export function useHouseholds() {
  const [households, setHouseholds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    setIsLoading(true)
    setError('')

    listHouseholds()
      .then((list) => {
        if (isMounted) setHouseholds(list)
      })
      .catch(() => {
        if (isMounted) setError('No fue posible cargar los households.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return { households, isLoading, error }
}
