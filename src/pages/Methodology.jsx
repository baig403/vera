import { BUSINESS_ACTIVITY_CATEGORIES, RATIO_DEFINITIONS } from '../utils/screening'

export default function Methodology() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold">Methodology</h1>
      <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed">
        Vera screens equities using the AAOIFI (Accounting and Auditing Organization for Islamic Financial
        Institutions) Shariah Standard No. 21, the most widely recognized framework for equity screening. It applies
        two sequential layers: a business activity screen, followed by financial ratio checks. A company must clear
        both to be considered Shariah-compliant.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-[var(--color-gold)]">Layer 1 — Business Activity</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          A company is automatically disqualified if its primary business falls into any of these categories,
          regardless of its financial ratios.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] glass-card">
            <thead>
              <tr className="text-left text-sm text-[var(--color-text-secondary)]">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Keywords Checked</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(BUSINESS_ACTIVITY_CATEGORIES).map((cat) => (
                <tr key={cat.label} className="border-t border-white/5 text-sm">
                  <td className="px-4 py-3 font-medium">{cat.label}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{cat.keywords.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-[var(--color-gold)]">Layer 2 — Financial Ratios</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          A company that clears Layer 1 must also pass all four ratio thresholds below. Results within 5 percentage
          points of a threshold are marked <span className="text-[var(--color-amber)]">Doubtful</span> rather than
          an outright pass or fail.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] glass-card">
            <thead>
              <tr className="text-left text-sm text-[var(--color-text-secondary)]">
                <th className="px-4 py-3">Ratio</th>
                <th className="px-4 py-3">Formula</th>
                <th className="px-4 py-3">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {RATIO_DEFINITIONS.map((r) => (
                <tr key={r.key} className="border-t border-white/5 text-sm">
                  <td className="px-4 py-3 font-medium">{r.label}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{r.formula}</td>
                  <td className="px-4 py-3">
                    {r.comparison === 'lessThan' ? '<' : '>'} {r.threshold}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Data Sources</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Financial data from Financial Modeling Prep. Best coverage for US-listed equities.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Coverage Limitations</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)] list-disc list-inside">
          <li>Coverage and data quality are strongest for US-listed companies; international and GCC-listed equities may have incomplete financials.</li>
          <li>Screens rely on the most recently reported annual financial statements and may lag real-time balance sheet changes.</li>
          <li>Business activity classification depends on sector/industry text and company descriptions, which can be imprecise for diversified conglomerates.</li>
          <li>Results are cached for 24 hours (48 hours for ETFs) to limit API usage — use Refresh on the Results page for the latest data.</li>
        </ul>
      </section>

      <section className="mt-12 border-t border-white/10 pt-8">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Built by <span className="text-[var(--color-text-primary)] font-medium">Abdullah Baig</span>, University of
          Waterloo, Bachelor of Sustainability and Financial Management.
        </p>
      </section>
    </div>
  )
}
