import * as cache from './cache'

const API_KEY = import.meta.env.VITE_FMP_API_KEY
const BASE_URL = 'https://financialmodelingprep.com/stable'
const THROTTLE_MS = 1500

let lastCallAt = 0
let queue = Promise.resolve()

function throttledFetch(url) {
  queue = queue.then(async () => {
    const wait = THROTTLE_MS - (Date.now() - lastCallAt)
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    lastCallAt = Date.now()
    cache.trackApiCall()
    console.log('[FMP request]', url)
    const res = await fetch(url)
    if (res.ok) {
      // FMP answers 200 with a plain-text body (e.g. "Premium Query") for
      // symbols or endpoints outside the current plan. Parsing that as JSON
      // throws an unhelpful SyntaxError, so detect it explicitly.
      const text = await res.text()
      try {
        return JSON.parse(text)
      } catch {
        const snippet = text.slice(0, 120)
        if (/premium|subscription|upgrade|exclusive endpoint/i.test(snippet)) {
          throw new Error(
            `This ticker needs a paid Financial Modeling Prep plan (API said: "${snippet.trim()}").`,
          )
        }
        throw new Error(`FMP returned an unexpected response: "${snippet.trim()}"`)
      }
    }
    if (!res.ok) {
      if (res.status === 402 || res.status === 429) {
        let detail = ''
        try {
          detail = (await res.json())['Error Message'] || ''
        } catch {
          // response wasn't JSON — ignore, we'll use the generic message below
        }
        throw new Error(
          `FMP request failed: ${res.status} (plan limit reached${detail ? ` — ${detail}` : ''}). ` +
            'This is a free-tier quota/rate limit on the API key, not a broken endpoint — try again later or use a different key.',
        )
      }
      throw new Error(`FMP request failed: ${res.status}`)
    }
    return res.json()
  })
  return queue
}

export async function getProfile(ticker) {
  const data = await throttledFetch(
    `${BASE_URL}/profile?symbol=${encodeURIComponent(ticker)}&apikey=${API_KEY}`,
  )
  return Array.isArray(data) ? data[0] : data
}

export async function getIncomeStatement(ticker) {
  const data = await throttledFetch(
    `${BASE_URL}/income-statement?symbol=${encodeURIComponent(ticker)}&limit=1&apikey=${API_KEY}`,
  )
  return Array.isArray(data) ? data[0] : data
}

export async function getBalanceSheet(ticker) {
  const data = await throttledFetch(
    `${BASE_URL}/balance-sheet-statement?symbol=${encodeURIComponent(ticker)}&limit=1&apikey=${API_KEY}`,
  )
  return Array.isArray(data) ? data[0] : data
}

export async function getHistoricalPrices(ticker) {
  return throttledFetch(
    `${BASE_URL}/historical-price-eod/light?symbol=${encodeURIComponent(ticker)}&apikey=${API_KEY}`,
  )
}

export async function searchSymbol(query) {
  if (!query || query.length < 1) return []
  return throttledFetch(
    `${BASE_URL}/search-symbol?query=${encodeURIComponent(query)}&apikey=${API_KEY}`,
  )
}

export async function getEtfHoldings(ticker) {
  return throttledFetch(
    `${BASE_URL}/etf-holder?symbol=${encodeURIComponent(ticker)}&apikey=${API_KEY}`,
  )
}

/**
 * Fetches everything screening.js needs for a single ticker, using the
 * 24h localStorage cache so repeat visits don't burn API calls.
 */
export async function getScreeningData(ticker, { forceRefresh = false } = {}) {
  const key = ticker.toUpperCase()
  if (!forceRefresh) {
    const cached = cache.get(key)
    if (cached) {
      return { ...cached, fromCache: true, cacheAgeHours: cache.getAgeHours(key) }
    }
  }

  const [profile, income, balance] = await Promise.all([
    getProfile(ticker),
    getIncomeStatement(ticker),
    getBalanceSheet(ticker),
  ])

  if (!profile) throw new Error(`No data found for ticker "${ticker}"`)

  const data = { profile, income, balance }
  cache.set(key, data)
  return { ...data, fromCache: false, cacheAgeHours: 0 }
}

export async function getEtfScreeningData(ticker, { forceRefresh = false } = {}) {
  const key = `etf_${ticker.toUpperCase()}`
  if (!forceRefresh) {
    const cached = cache.get(key, 48)
    if (cached) {
      return { ...cached, fromCache: true, cacheAgeHours: cache.getAgeHours(key) }
    }
  }

  const [profile, holdings] = await Promise.all([
    getProfile(ticker),
    getEtfHoldings(ticker),
  ])

  const data = { profile, holdings }
  cache.set(key, data)
  return { ...data, fromCache: false, cacheAgeHours: 0 }
}
