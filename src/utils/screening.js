// Shariah screening implementing AAOIFI Shari'ah Standard No. 21.
//
// Two layers, both of which must be cleared:
//   Layer 1 — business activity: excluded sectors fail outright.
//   Layer 2 — financial ratios: debt and interest-bearing investments are each
//             measured against MARKET CAPITALISATION (per Standard 21), and
//             prohibited income against total revenue.
//
// Standard 21 sets no accounts-receivable ratio. It does contain a related
// concern: a company whose assets are essentially all cash and receivables is
// governed by sarf and debt-sale rules rather than ordinary equity rules. That
// is surfaced separately as an advisory flag, NOT as an AAOIFI ratio.

export const BUSINESS_ACTIVITY_CATEGORIES = {
  alcohol: {
    label: 'Alcohol',
    // 'beverage' alone is too broad — FMP classifies Coca-Cola and PepsiCo as
    // "Beverages - Non-Alcoholic", which would substring-match and wrongly fail
    // them. Match only unambiguous alcohol terms, and never when the string is
    // explicitly marked non-alcoholic (see NEGATIVE_MATCHES).
    keywords: ['alcoholic', 'alcohol', 'brewery', 'brewers', 'brewing', 'distillery', 'distillers', 'winery', 'wineries', 'wine', 'spirits', 'beer'],
  },
  weapons: {
    label: 'Weapons & Defense',
    keywords: ['defense', 'aerospace and defense', 'weapons', 'military', 'armament'],
  },
  gambling: {
    label: 'Gambling',
    // "gaming" alone false-matches consumer electronics makers via phrases like
    // "gaming peripherals". Only match it inside an unambiguous gambling phrase.
    keywords: ['gambling', 'casino', 'lottery', 'betting', 'sportsbook', 'online gaming', 'casino gaming'],
  },
  tobacco: {
    label: 'Tobacco',
    keywords: ['tobacco', 'cigarette'],
  },
  adult: {
    label: 'Adult Entertainment',
    keywords: ['adult entertainment', 'pornography'],
  },
  pork: {
    label: 'Pork & Non-Halal Meat',
    keywords: ['pork', 'pig farming', 'meat processing'],
  },
  conventionalFinance: {
    label: 'Conventional Finance',
    keywords: ['bank', 'insurance', 'financial services', 'credit services', 'mortgage'],
  },
}

// Phrases that negate a category outright. Checked before keywords.
const NEGATIVE_MATCHES = {
  alcohol: ['non-alcoholic', 'nonalcoholic', 'non alcoholic'],
  conventionalFinance: ['islamic bank', 'takaful'],
}

// A result within this fraction of its threshold is DOUBTFUL rather than a
// confident pass. Proportional rather than absolute: a flat 5-point band would
// swallow the entire 5% prohibited-income test and mark 0% as borderline.
const DOUBTFUL_BAND_FRACTION = 0.1

export const RATIO_DEFINITIONS = [
  {
    key: 'debtRatio',
    label: 'Interest-Bearing Debt / Market Cap',
    threshold: 30,
    comparison: 'lessThan',
    formula: 'Total Interest-Bearing Debt ÷ Market Capitalisation',
    source: 'AAOIFI Standard 21',
  },
  {
    key: 'interestBearingAssetsRatio',
    label: 'Interest-Bearing Investments / Market Cap',
    threshold: 30,
    comparison: 'lessThan',
    formula: '(Cash + Short-Term Investments) ÷ Market Capitalisation',
    source: 'AAOIFI Standard 21',
  },
  {
    key: 'prohibitedIncomeRatio',
    label: 'Prohibited Income / Total Revenue',
    threshold: 5,
    comparison: 'lessThan',
    formula: 'Interest & Other Prohibited Income ÷ Total Revenue',
    source: 'AAOIFI Standard 21',
  },
]

// Not part of Standard 21's ratio tests — surfaced as an advisory flag only.
export const ADVISORY_DEFINITIONS = [
  {
    key: 'illiquidRatio',
    label: 'Illiquid Assets / Total Assets',
    threshold: 33,
    comparison: 'greaterThan',
    formula: '(Total Assets − Cash − Short-Term Investments − Receivables) ÷ Total Assets',
    source: 'Advisory — tradability (sarf) concern, not an AAOIFI ratio test',
  },
]

function matchKeyword(haystack, keywords, categoryId) {
  const lower = haystack.toLowerCase()
  const negations = NEGATIVE_MATCHES[categoryId] || []
  if (negations.some((n) => lower.includes(n))) return undefined
  return keywords.find((kw) => lower.includes(kw))
}

export function screenBusinessActivity(profile) {
  // Only FMP's structured sector/industry fields are checked. Free-text company
  // descriptions are excluded: substring matching against marketing copy is far
  // too noisy to be trustworthy.
  const sector = profile?.sector || ''
  const industry = profile?.industry || ''
  const haystack = [sector, industry].filter(Boolean).join(' | ')

  for (const [id, category] of Object.entries(BUSINESS_ACTIVITY_CATEGORIES)) {
    const matched = matchKeyword(haystack, category.keywords, id)
    if (matched) {
      return { pass: false, categoryId: id, categoryLabel: category.label, matchedKeyword: matched }
    }
  }
  return { pass: true, categoryId: null, categoryLabel: null, matchedKeyword: null }
}

// Returns null rather than 0 when the denominator is missing, so that "we don't
// have the data" is never silently rendered as "0%, comfortably compliant".
function safeDiv(numerator, denominator) {
  if (!denominator || !Number.isFinite(denominator)) return null
  if (!Number.isFinite(numerator)) return null
  return (numerator / denominator) * 100
}

function interestBearingDebt(balance = {}) {
  const short = balance.shortTermDebt
  const long = balance.longTermDebt
  if (Number.isFinite(short) || Number.isFinite(long)) {
    return (short || 0) + (long || 0)
  }
  return balance.totalDebt ?? null
}

function prohibitedIncome(income = {}) {
  const direct = income.interestIncome
  if (Number.isFinite(direct)) return Math.max(direct, 0)
  const net = income.netInterestIncome
  if (Number.isFinite(net)) return Math.max(net, 0)
  return null
}

export function computeRatios(income = {}, balance = {}, profile = {}) {
  const marketCap = profile?.marketCap || null
  const totalAssets = balance?.totalAssets || null

  const cash = balance?.cashAndCashEquivalents || 0
  const shortTermInvestments = balance?.shortTermInvestments || 0
  const netReceivables = balance?.netReceivables ?? balance?.accountsReceivables ?? 0

  const interestBearingAssets = cash + shortTermInvestments
  const illiquidAssets = totalAssets
    ? Math.max(totalAssets - (cash + shortTermInvestments + netReceivables), 0)
    : null

  return {
    debtRatio: safeDiv(interestBearingDebt(balance), marketCap),
    interestBearingAssetsRatio: safeDiv(interestBearingAssets, marketCap),
    prohibitedIncomeRatio: safeDiv(prohibitedIncome(income), income?.revenue),
    illiquidRatio: illiquidAssets === null ? null : safeDiv(illiquidAssets, totalAssets),
  }
}

function evaluateRatio(value, definition) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'UNKNOWN'
  const { threshold, comparison } = definition
  const band = threshold * DOUBTFUL_BAND_FRACTION
  if (comparison === 'lessThan') {
    if (value < threshold - band) return 'PASS'
    if (value < threshold) return 'DOUBTFUL'
    return 'FAIL'
  }
  if (value > threshold + band) return 'PASS'
  if (value > threshold) return 'DOUBTFUL'
  return 'FAIL'
}

export function screenFinancials(income, balance, profile) {
  const ratios = computeRatios(income, balance, profile)

  const results = RATIO_DEFINITIONS.map((def) => ({
    ...def,
    value: ratios[def.key],
    status: evaluateRatio(ratios[def.key], def),
  }))

  const advisory = ADVISORY_DEFINITIONS.map((def) => ({
    ...def,
    value: ratios[def.key],
    status: evaluateRatio(ratios[def.key], def),
    advisory: true,
  }))

  // UNKNOWN is never reported as a pass. Missing data is its own outcome.
  const overallStatus = results.some((r) => r.status === 'FAIL')
    ? 'FAIL'
    : results.some((r) => r.status === 'UNKNOWN')
      ? 'UNKNOWN'
      : results.some((r) => r.status === 'DOUBTFUL')
        ? 'DOUBTFUL'
        : 'PASS'

  return { ratios: results, advisory, overallStatus }
}

/**
 * Share of revenue from prohibited sources — the basis for purification.
 * Returns null when revenue or interest income is unavailable.
 */
export function computePurificationRatio(income = {}) {
  return safeDiv(prohibitedIncome(income), income?.revenue)
}

/**
 * Full AAOIFI Standard 21 screen for one stock.
 * `profile` / `income` / `balance` are the raw FMP objects from utils/api.js.
 */
export function screenStock({ profile, income, balance }) {
  const businessActivity = screenBusinessActivity(profile)

  if (!businessActivity.pass) {
    return {
      verdict: 'FAIL',
      failReason: 'business_activity',
      businessActivity,
      financials: null,
      purificationRatio: null,
    }
  }

  const financials = screenFinancials(income, balance, profile)

  return {
    verdict: financials.overallStatus,
    failReason: financials.overallStatus === 'FAIL' ? 'financial_ratios' : null,
    businessActivity,
    financials,
    purificationRatio: computePurificationRatio(income),
  }
}
