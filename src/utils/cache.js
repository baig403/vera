const PREFIX = 'vera_cache_'
const DEFAULT_TTL_HOURS = 24

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function get(key, ttlHours = DEFAULT_TTL_HOURS) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    const ageMs = Date.now() - timestamp
    if (ageMs > ttlHours * 60 * 60 * 1000) return null
    return data
  } catch {
    return null
  }
}

export function set(key, data) {
  try {
    localStorage.setItem(
      PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() }),
    )
  } catch {
    // localStorage full or unavailable — fail silently, screening still works uncached
  }
}

export function getAgeHours(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { timestamp } = JSON.parse(raw)
    return (Date.now() - timestamp) / (60 * 60 * 1000)
  } catch {
    return null
  }
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key)
}

export function trackApiCall() {
  const key = `vera_api_calls_${todayKey()}`
  const count = Number(localStorage.getItem(key) || '0') + 1
  localStorage.setItem(key, String(count))
  return count
}

export function getApiCallCount() {
  const key = `vera_api_calls_${todayKey()}`
  return Number(localStorage.getItem(key) || '0')
}

const WATCHLIST_KEY = 'vera_watchlist'

export function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]')
  } catch {
    return []
  }
}

export function addToWatchlist(entry) {
  const list = getWatchlist().filter((s) => s.ticker !== entry.ticker)
  list.unshift({ ...entry, dateScreened: Date.now() })
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list))
  return list
}

export function removeFromWatchlist(ticker) {
  const list = getWatchlist().filter((s) => s.ticker !== ticker)
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list))
  return list
}

export function isInWatchlist(ticker) {
  return getWatchlist().some((s) => s.ticker === ticker)
}
