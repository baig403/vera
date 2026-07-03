// AAOIFI-style two-layer Shariah screening.
// Layer 1: business activity (auto-fail keyword match against sector/industry/description).
// Layer 2: financial ratio thresholds (all four must pass).

export const BUSINESS_ACTIVITY_CATEGORIES = {
  alcohol: {
    label: 'Alcohol',
    keywords: ['beverage', 'alcohol', 'brewery', 'brewing', 'distillery', 'wine', 'spirits', 'beer'],
  },
  weapons: {
    label: 'Weapons & Defense',
    keywords: ['defense', 'aerospace and defense', 'weapons', 'military', 'armament'],
  },
  gambling: {
    label: 'Gambling',
    // "gaming" alone is too broad — it false-matches consumer electronics/hardware
    // makers (Apple, Sony, Microsoft) via marketing copy like "gaming peripherals"
    // or "Apple Arcade for gaming". Only match it in an unambiguous gambling phrase.
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

const RATIO_THRESHOLD_PCT = 5 // "within 5% of threshold" → DOUBTFUL band

export const RATIO_DEFINITIONS = [
  {
    key: 'debtRatio',
    label: 'Interest-Bearing Debt / Total Assets',
    threshold: 30,
    comparison: 'lessThan',
    formula: 'Total Interest-Bearing Debt ÷ Total Assets',
  },
  {
    key: 'interestIncomeRatio',
    label: 'Interest Income / Total Revenue',
    threshold: 5,
    comparison: 'lessThan',
    formula: 'Interest Income ÷ Total Revenue',
  },
  {
    key: 'receivablesRatio',
    label: 'Accounts Receivable / Total Assets',
    threshold: 70,
    comparison: 'lessThan',
    formula: 'Net Receivables ÷ Total Assets',
  },
  {
    key: 'illiquidRatio',
    label: 'Illiquid Assets / Total Assets',
    threshold: 33,
    comparison: 'greaterThan',
    formula: '(Total Assets − Liquid Assets) ÷ Total Assets',
  },
]

function matchKeyword(haystack, keywords) {
  const lower = haystack.toLowerCase()
  return keywords.find((kw) => lower.includes(kw))
}

export function screenBusinessActivity(profile) {
  // Only sector/industry — FMP's own structured classification fields — are
  // checked. Free-form description/marketing copy is intentionally excluded:
  // it's too noisy for substring matching (e.g. "Apple Arcade for gaming" in
  // Apple's description would otherwise false-match the gambling category).
  const sector = profile?.sector || ''
  const industry = profile?.industry || ''
  console.log('[screenBusinessActivity]', { ticker: profile?.symbol, sector, industry })

  const haystack = [sector, industry].filter(Boolean).join(' | ')

  for (const [id, category] of Object.entries(BUSINESS_ACTIVITY_CATEGORIES)) {
    const matched = matchKeyword(haystack, category.keywords)
    if (matched) {
      return {
        pass: false,
        categoryId: id,
        categoryLabel: category.label,
        matchedKeyword: matched,
      }
    }
  }

  return { pass: true, categoryId: null, categoryLabel: null, matchedKeyword: null }
}

function safeDiv(numerator, denominator) {
  if (!denominator) return 0
  return (numerator / denominator) * 100
}

export function computeRatios(income = {}, balance = {}) {
  const totalAssets = balance.totalAssets || 0
  const interestBearingDebt =
    (balance.shortTermDebt || 0) + (balance.longTermDebt || 0) || balance.totalDebt || 0
  const netReceivables = balance.netReceivables ?? balance.accountsReceivables ?? 0
  const cash = balance.cashAndCashEquivalents || 0
  const shortTermInvestments = balance.shortTermInvestments || 0
  const liquidAssets = cash + shortTermInvestments + netReceivables
  const illiquidAssets = Math.max(totalAssets - liquidAssets, 0)

  const totalRevenue = income.revenue || 0
  const interestIncome = income.interestIncome ?? Math.max(income.netInterestIncome || 0, 0)

  return {
    debtRatio: safeDiv(interestBearingDebt, totalAssets),
    interestIncomeRatio: safeDiv(interestIncome, totalRevenue),
    receivablesRatio: safeDiv(netReceivables, totalAssets),
    illiquidRatio: safeDiv(illiquidAssets, totalAssets),
  }
}

function evaluateRatio(value, definition) {
  const { threshold, comparison } = definition
  if (comparison === 'lessThan') {
    if (value < threshold) return 'PASS'
    if (value < threshold + RATIO_THRESHOLD_PCT) return 'DOUBTFUL'
    return 'FAIL'
  }
  // greaterThan
  if (value > threshold) return 'PASS'
  if (value > threshold - RATIO_THRESHOLD_PCT) return 'DOUBTFUL'
  return 'FAIL'
}

export function screenFinancials(income, balance) {
  const ratios = computeRatios(income, balance)

  const results = RATIO_DEFINITIONS.map((def) => ({
    ...def,
    value: ratios[def.key],
    status: evaluateRatio(ratios[def.key], def),
  }))

  const overallStatus = results.some((r) => r.status === 'FAIL')
    ? 'FAIL'
    : results.some((r) => r.status === 'DOUBTFUL')
      ? 'DOUBTFUL'
      : 'PASS'

  return { ratios: results, overallStatus }
}

export function computePurificationRatio(income = {}) {
  const totalRevenue = income.revenue || 0
  const interestIncome = income.interestIncome ?? Math.max(income.netInterestIncome || 0, 0)
  if (!totalRevenue) return 0
  return (interestIncome / totalRevenue) * 100
}

/**
 * Full AAOIFI screen for a single stock. `profile`/`income`/`balance` are the
 * raw FMP objects returned by utils/api.js.
 */
export function screenStock({ profile, income, balance }) {
  const businessActivity = screenBusinessActivity(profile)

  if (!businessActivity.pass) {
    return {
      verdict: 'FAIL',
      failReason: 'business_activity',
      businessActivity,
      financials: null,
      purificationRatio: 0,
    }
  }

  const financials = screenFinancials(income, balance)
  const purificationRatio = computePurificationRatio(income)

  return {
    verdict: financials.overallStatus,
    failReason: financials.overallStatus === 'FAIL' ? 'financial_ratios' : null,
    businessActivity,
    financials,
    purificationRatio,
  }
}
