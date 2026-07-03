import { useCallback, useEffect, useState } from 'react'
import { getScreeningData } from '../utils/api'
import { screenStock } from '../utils/screening'

/**
 * Fetches profile/income/balance for `ticker`, runs the AAOIFI screen, and
 * exposes loading/error/refresh state for a Results-style page.
 */
export function useScreening(ticker) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(Boolean(ticker))
  const [error, setError] = useState(null)
  const [fromCache, setFromCache] = useState(false)
  const [cacheAgeHours, setCacheAgeHours] = useState(0)

  const load = useCallback(
    async (forceRefresh = false) => {
      if (!ticker) return
      setLoading(true)
      setError(null)
      try {
        const { profile, income, balance, fromCache: cached, cacheAgeHours: age } =
          await getScreeningData(ticker, { forceRefresh })
        const verdict = screenStock({ profile, income, balance })
        setResult({ profile, income, balance, ...verdict })
        setFromCache(cached)
        setCacheAgeHours(age || 0)
      } catch (err) {
        setError(err.message || 'Failed to screen this ticker.')
        setResult(null)
      } finally {
        setLoading(false)
      }
    },
    [ticker],
  )

  useEffect(() => {
    load(false)
  }, [load])

  const refresh = useCallback(() => load(true), [load])

  return { result, loading, error, fromCache, cacheAgeHours, refresh }
}
