import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { useTranslation } from '../i18n'

const CATEGORIES = ['Food & Dining', 'Transportation', 'Housing', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Other']

const CATEGORY_KEYWORDS = {
  'Food & Dining': ['woolworths', 'coles', 'aldi', 'iga', 'foodworks', 'mcdonald', 'hungry jack', 'kfc', 'subway', 'nando', 'domino', 'pizza', 'cafe', 'coffee', 'restaurant', 'bakery', 'sushi', 'kebab', 'thai', 'chinese', 'indian', 'uber eat', 'doordash', 'menulog', 'deliveroo', 'malatang', 'ramen', 'bbq', 'burger', 'chicken', 'noodle', 'dumpling'],
  'Transportation': ['uber', 'ola cab', 'didi', 'petrol', 'shell', 'bp', 'caltex', 'ampol', 'puma energy', '7-eleven fuel', 'metro trains', 'transperth', 'translink', 'opal', 'myki', 'go card', 'parking', 'wilsons', 'citylink', 'eastlink', 'linkt', 'qantas', 'virgin australia', 'jetstar', 'transportfornsw', 'fuel metrix', 'metro petroleum', 'service stati', 'lidcombe service'],
  'Entertainment': ['netflix', 'stan', 'binge', 'disney', 'paramount', 'kayo', 'foxtel', 'spotify', 'apple music', 'youtube', 'amazon prime', 'hoyts', 'village cinema', 'event cinema', 'event george', 'event burwood', 'reading cinema', 'ticketek', 'ticketmaster', 'steam', 'playstation', 'nintendo', 'xbox', 'nexon', 'supercell', 'pc bang', 'internet cafe', 'climbing', 'bouldering'],
  'Shopping': ['amazon', 'ebay', 'kmart', 'target', 'big w', 'myer', 'david jones', 'jb hi-fi', 'jb hi fi', 'harvey norman', 'the good guys', 'officeworks', 'bunnings', 'ikea', 'cotton on', 'uniqlo', 'asos', 'the iconic', 'catch.com', 'inditex', 'zara', 'apple.com/bill', 'rose vibes', 'million ro'],
  'Healthcare': ['chemist warehouse', 'priceline pharmacy', 'terry white', 'amcal', 'blooms the chemist', 'doctor', 'medical centre', 'hospital', 'dental', 'optometrist', 'specsavers', 'physiotherapy', 'pathology', 'radiology', 'bupa', 'medibank', 'hcf', 'nib health', 'ahm health', 'xtreme chemist', 'pharmacy', 'hairy pill'],
  'Housing': ['rent', 'mortgage', 'strata', 'body corp', 'origin energy', 'agl', 'energy australia', 'sydney water', 'telstra', 'optus', 'tpg', 'aussie broadband', 'transfer to other bank netbank rent', 'transfer to skpc'],
  'Education': ['university', 'tafe', 'school fees', 'udemy', 'coursera', 'linkedin learning', 'skillshare', 'tuition'],
}

function detectCategory(description) {
  const lower = description.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return cat
  }
  return 'Other'
}

export default function PdfImport({ onClose }) {
  const { addExpense, expenses } = useApp()
  const { t, lang } = useTranslation()
  const fileRef = useRef()
  const [step, setStep] = useState(1)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([])
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [monthFilter, setMonthFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [searchFilter, setSearchFilter] = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setParseError(null)
    setParsing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const transactions = await window.api.parsePdf(arrayBuffer)

      const existingFingerprints = new Set(
        expenses.map(e => `${e.date}|${e.amount.toFixed(2)}|${e.description.toLowerCase().trim()}`)
      )

      const parsed = transactions.map((tx, i) => {
        const fingerprint = `${tx.date}|${tx.amount.toFixed(2)}|${tx.description.toLowerCase().trim()}`
        const duplicate = existingFingerprints.has(fingerprint)
        return {
          id: i,
          ...tx,
          category: detectCategory(tx.description),
          selected: !duplicate,
          duplicate
        }
      })

      setRows(parsed)
      setStep(2)
    } catch (err) {
      setParseError(`Parse error: ${err?.message || err}`)
    } finally {
      setParsing(false)
    }
  }

  const toggleRow = id => setRows(r => r.map(row => row.id === id ? { ...row, selected: !row.selected } : row))
  const toggleAll = val => setRows(r => r.map(row => ({ ...row, selected: val })))
  const setRowCat = (id, category) => setRows(r => r.map(row => row.id === id ? { ...row, category } : row))

  async function handleImport() {
    setImporting(true)
    const selected = rows.filter(r => r.selected)
    for (const row of selected) {
      await addExpense({ date: row.date, description: row.description, amount: row.amount, category: row.category, note: 'Imported from PDF' })
    }
    onClose(selected.length)
  }

  const availableMonths = [...new Set(rows.map(r => r.date.substring(0, 7)))].sort()
  const availableCategories = [...new Set(rows.map(r => r.category))].sort()

  const searchLower = searchFilter.toLowerCase()
  const visibleRows = rows.filter(r =>
    (monthFilter === 'All' || r.date.startsWith(monthFilter)) &&
    (categoryFilter === 'All' || r.category === categoryFilter) &&
    (!searchLower || r.description.toLowerCase().includes(searchLower))
  )

  const selectedCount = rows.filter(r => r.selected).length
  const visibleSelected = visibleRows.filter(r => r.selected).length

  function toggleVisible(val) {
    const visibleIds = new Set(visibleRows.map(r => r.id))
    setRows(prev => prev.map(row => visibleIds.has(row.id) ? { ...row, selected: val } : row))
  }

  return (
    <div className="csv-import">

      {step === 1 && (
        <>
          <p className="csv-step-label">Upload your CommBank Transaction Summary PDF</p>

          <div className="csv-drop-zone" onClick={() => !parsing && fileRef.current.click()}>
            <input ref={fileRef} type="file" accept=".pdf,.PDF" style={{ display: 'none' }} onChange={handleFile} />
            {parsing ? (
              <div className="csv-drop-prompt">
                <span className="csv-drop-icon">⏳</span>
                <span className="csv-drop-main">Reading PDF…</span>
                <span className="csv-drop-hint">This may take a moment for large files</span>
              </div>
            ) : fileName ? (
              <div className="csv-drop-success">
                <span style={{ fontSize: 20 }}>✓</span>
                <div>
                  <strong>{fileName}</strong>
                  <div className="csv-drop-meta">click to change</div>
                </div>
              </div>
            ) : (
              <div className="csv-drop-prompt">
                <span className="csv-drop-icon">📄</span>
                <span className="csv-drop-main">Click to select your CommBank PDF</span>
                <span className="csv-drop-hint">Transaction Summary exported from NetBank or CommBank app</span>
              </div>
            )}
          </div>

          {parseError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '9px 14px', fontSize: 13, marginTop: 12 }}>
              {parseError}
            </div>
          )}

          <div className="form-footer">
            <button className="btn btn-ghost" onClick={() => onClose(0)}>{t('common.cancel')}</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="csv-step-label">{t('csv.step2')}</p>

          {rows.length === 0 ? (
            <p className="empty-state" style={{ padding: '24px 0' }}>
              No expense transactions found in this PDF.
            </p>
          ) : (
            <>
              {(() => {
                const dupCount = rows.filter(r => r.duplicate).length
                const s = lang === 'en' && dupCount !== 1 ? 's' : ''
                return dupCount > 0 && (
                  <div className="csv-dup-notice">
                    {t('csv.dupNotice', { n: dupCount, s })}
                  </div>
                )
              })()}

              <div className="pdf-filter-bar">
                <select className="select-filter" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                  <option value="All">All months</option>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>
                      {new Date(m + '-15').toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </option>
                  ))}
                </select>
                <select className="select-filter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                  <option value="All">All categories</option>
                  {availableCategories.map(c => (
                    <option key={c} value={c}>{t(`categories.${c}`)}</option>
                  ))}
                </select>
                <input
                  className="form-input pdf-search-input"
                  type="text"
                  placeholder="Search description…"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                />
              </div>

              <div className="csv-preview-toolbar">
                <span className="csv-preview-count">
                  <strong>{selectedCount}</strong> of {rows.length} selected
                  {(monthFilter !== 'All' || categoryFilter !== 'All') && ` · showing ${visibleRows.length}`}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleVisible(true)}>Select visible</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleVisible(false)}>Deselect visible</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleAll(true)}>{t('csv.selectAll')}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleAll(false)}>{t('csv.none')}</button>
                </div>
              </div>

              <div className="csv-preview-list">
                {visibleRows.map(row => (
                  <div
                    key={row.id}
                    className={`csv-preview-row ${!row.selected ? 'deselected' : ''}`}
                    onClick={() => toggleRow(row.id)}
                  >
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggleRow(row.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <span className="csv-col-date">{row.date}</span>
                    <span className="csv-col-desc">
                      {row.description}
                      {row.duplicate && <span className="csv-dup-badge">{t('csv.dupBadge')}</span>}
                    </span>
                    <select
                      className="csv-col-cat"
                      value={row.category}
                      onChange={e => setRowCat(row.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
                    </select>
                    <span className="csv-col-amount">-${row.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="form-footer">
            <button className="btn btn-ghost" onClick={() => { setStep(1); setRows([]) }}>{t('csv.backBtn')}</button>
            <button
              className="btn btn-primary"
              disabled={selectedCount === 0 || importing}
              onClick={handleImport}
            >
              {importing
                ? t('csv.importing')
                : t('csv.importBtn', { n: selectedCount, s: lang === 'en' && selectedCount !== 1 ? 's' : '' })}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
