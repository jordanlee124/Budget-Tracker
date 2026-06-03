import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { useTranslation } from '../i18n'

const CATEGORIES = ['Food & Dining', 'Transportation', 'Housing', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Other']

const CATEGORY_KEYWORDS = {
  'Food & Dining': ['woolworths', 'coles', 'aldi', 'iga', 'foodworks', 'spar', 'mcdonald', 'hungry jack', 'kfc', 'subway', 'nando', 'grill\'d', 'domino', 'pizza hut', 'cafe', 'coffee', 'restaurant', 'bakery', 'sushi', 'kebab', 'thai', 'chinese', 'indian', 'uber eat', 'doordash', 'menulog', 'deliveroo'],
  'Transportation': ['uber', 'ola cab', 'didi', '13cabs', 'silver top', 'petrol', 'shell', 'bp', 'caltex', 'ampol', 'puma energy', '7-eleven fuel', 'metro trains', 'transperth', 'translink', 'opal', 'myki', 'go card', 'parking', 'wilsons', 'secure parking', 'citylink', 'eastlink', 'linkt', 'qantas', 'virgin australia', 'jetstar', 'rex airlines', 'bonza'],
  'Entertainment': ['netflix', 'stan', 'binge', 'disney+', 'paramount+', 'kayo sport', 'foxtel', 'spotify', 'apple music', 'youtube premium', 'amazon prime', 'hoyts', 'village cinema', 'event cinema', 'reading cinema', 'ticketek', 'ticketmaster', 'moshtix', 'steam', 'playstation', 'nintendo', 'xbox'],
  'Shopping': ['amazon', 'ebay', 'kmart', 'target', 'big w', 'myer', 'david jones', 'jb hi-fi', 'harvey norman', 'the good guys', 'officeworks', 'bunnings', 'ikea', 'cotton on', 'uniqlo', 'asos', 'the iconic', 'catch.com', 'trade me'],
  'Healthcare': ['chemist warehouse', 'priceline pharmacy', 'terry white', 'amcal', 'blooms the chemist', 'doctor', 'medical centre', 'hospital', 'dental', 'optometrist', 'specsavers', 'physiotherapy', 'pathology', 'radiology', 'bupa', 'medibank', 'hcf', 'nib health', 'ahm health'],
  'Housing': ['rent', 'mortgage', 'strata', 'body corp', 'realestate', 'domain', 'origin energy', 'agl', 'energy australia', 'simply energy', 'alinta energy', 'sydney water', 'yarra valley water', 'telstra', 'optus', 'tpg', 'aussie broadband', 'superloop', 'internode', 'iinet'],
  'Education': ['university', 'tafe', 'school fees', 'udemy', 'coursera', 'linkedin learning', 'skillshare', 'masterclass'],
}

function detectCategory(description) {
  const lower = description.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return cat
  }
  return 'Other'
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')

  function parseRow(line) {
    const cells = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (c === ',' && !inQ) {
        cells.push(cur.trim().replace(/^"|"$/g, ''))
        cur = ''
      } else {
        cur += c
      }
    }
    cells.push(cur.trim().replace(/^"|"$/g, ''))
    return cells
  }

  const firstRow = parseRow(lines[0])
  const firstCell = (firstRow[0] || '').trim()
  // Detect headerless CSV: first cell looks like a date (CommBank, some others)
  const headerless = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(firstCell) || /^\d{4}-\d{2}-\d{2}/.test(firstCell)

  if (headerless) {
    const allRows = lines.filter(l => l.trim() && l.includes(',')).map(parseRow)
    const sampleRow = allRows[0] || []
    const headers = sampleRow.map((_, i) => `Column ${i + 1}`)
    return { headers, rows: allRows, headerless: true, sampleRow }
  }

  // Find first line that looks like a header (has multiple comma-separated values)
  let headerIdx = 0
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    if (lines[i].split(',').length > 2) { headerIdx = i; break }
  }

  const headers = parseRow(lines[headerIdx])
  const rows = lines.slice(headerIdx + 1).filter(l => l.trim() && l.includes(',')).map(parseRow)
  return { headers, rows, headerless: false, sampleRow: rows[0] }
}

function parseDate(str) {
  if (!str) return null
  const s = str.trim()

  // DD/MM/YYYY — most Australian banks (CBA, ANZ, NAB)
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`

  // YYYY-MM-DD (ISO, Up Bank)
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  // DD-MM-YYYY
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`

  const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' }

  // DD MMM YYYY — NAB (e.g. "01 Jun 2026")
  m = s.match(/^(\d{1,2})\s+([a-z]{3})\s+(\d{4})/i)
  if (m && months[m[2].toLowerCase()]) return `${m[3]}-${months[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`

  // DD MMM YY — NAB credit card (e.g. "01 Jun 26")
  m = s.match(/^(\d{1,2})\s+([a-z]{3})\s+(\d{2})$/i)
  if (m && months[m[2].toLowerCase()]) return `20${m[3]}-${months[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`

  return null
}

function parseAmount(str) {
  if (str === '' || str === null || str === undefined) return null
  const s = String(str).trim().replace(/[$, ]/g, '')
  if (s.startsWith('(') && s.endsWith(')')) return -Math.abs(parseFloat(s.slice(1, -1)))
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function guessCol(headers, candidates) {
  const lower = headers.map(h => h.toLowerCase().trim())
  for (const c of candidates) {
    const idx = lower.findIndex(h => h === c || h.includes(c))
    if (idx !== -1) return headers[idx]
  }
  return ''
}

export default function CsvImport({ onClose }) {
  const { addExpense, expenses } = useApp()
  const { t, lang } = useTranslation()
  const fileRef = useRef()
  const [step, setStep] = useState(1)
  const [fileName, setFileName] = useState('')
  const [csvData, setCsvData] = useState(null)
  const [mapping, setMapping] = useState({ dateCol: '', descCol: '', amountCol: '', debitCol: '', mode: 'single' })
  const [rows, setRows] = useState([])
  const [importing, setImporting] = useState(false)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const data = parseCSV(ev.target.result)
      setCsvData(data)
      const h = data.headers
      if (data.headerless) {
        // CommBank and similar: date=col0, amount=col1, description=col2
        setMapping({
          dateCol: h[0] || '',
          amountCol: h[1] || '',
          descCol: h[2] || '',
          debitCol: '',
          mode: 'single'
        })
      } else {
        const hasDebit = h.some(c => /^debit$/i.test(c.trim()))
        setMapping({
          dateCol: guessCol(h, ['transaction date', 'date', 'trans date', 'posted date', 'value date']),
          descCol: guessCol(h, ['description', 'narrative', 'narration', 'particulars', 'details', 'memo', 'reference', 'transaction details']),
          amountCol: guessCol(h, ['amount', 'transaction amount', 'net amount', 'aud amount']),
          debitCol: guessCol(h, ['debit', 'withdrawals', 'dr', 'debit amount']),
          mode: hasDebit ? 'debit-credit' : 'single'
        })
      }
    }
    reader.readAsText(file)
  }

  const setMap = (key, val) => setMapping(m => ({ ...m, [key]: val }))

  function buildPreview() {
    const { headers, rows: raw } = csvData
    const col = name => { const i = headers.indexOf(name); return i !== -1 ? i : -1 }

    const existingFingerprints = new Set(
      expenses.map(e => `${e.date}|${e.amount.toFixed(2)}|${e.description.toLowerCase().trim()}`)
    )

    const parsed = raw.map((row, i) => {
      const date = parseDate(row[col(mapping.dateCol)])
      const desc = (row[col(mapping.descCol)] || '').trim()

      let amount
      if (mapping.mode === 'debit-credit') {
        const debit = parseAmount(row[col(mapping.debitCol)])
        amount = debit && debit > 0 ? debit : null
      } else {
        const raw = parseAmount(row[col(mapping.amountCol)])
        if (raw === null) { amount = null }
        else if (raw < 0) { amount = Math.abs(raw) }
        else { amount = null }
      }

      if (!date || !amount || !desc) return null

      const fingerprint = `${date}|${amount.toFixed(2)}|${desc.toLowerCase().trim()}`
      const duplicate = existingFingerprints.has(fingerprint)

      return { id: i, date, description: desc, amount, category: detectCategory(desc), selected: !duplicate, duplicate }
    }).filter(Boolean)

    setRows(parsed)
    setStep(2)
  }

  const toggleRow = id => setRows(r => r.map(row => row.id === id ? { ...row, selected: !row.selected } : row))
  const toggleAll = val => setRows(r => r.map(row => ({ ...row, selected: val })))
  const setRowCat = (id, category) => setRows(r => r.map(row => row.id === id ? { ...row, category } : row))

  async function handleImport() {
    setImporting(true)
    const selected = rows.filter(r => r.selected)
    for (const row of selected) {
      await addExpense({ date: row.date, description: row.description, amount: row.amount, category: row.category, note: 'Imported from CSV' })
    }
    onClose(selected.length)
  }

  const colOptions = csvData ? ['', ...csvData.headers] : []
  const selectedCount = rows.filter(r => r.selected).length
  const canPreview = csvData && mapping.dateCol && mapping.descCol && (mapping.mode === 'single' ? mapping.amountCol : mapping.debitCol)

  function colLabel(header) {
    if (!header) return '— select —'
    if (csvData?.headerless && csvData.sampleRow) {
      const idx = csvData.headers.indexOf(header)
      if (idx !== -1) {
        const sample = String(csvData.sampleRow[idx] || '').substring(0, 28).trim()
        return sample ? `${header} — ${sample}` : header
      }
    }
    return header
  }

  return (
    <div className="csv-import">

      {/* ── Step 1: Upload + Map ─────────────────── */}
      {step === 1 && (
        <>
          <p className="csv-step-label">{t('csv.step1')}</p>

          <div className="csv-drop-zone" onClick={() => fileRef.current.click()}>
            <input ref={fileRef} type="file" accept=".csv,.CSV" style={{ display: 'none' }} onChange={handleFile} />
            {csvData ? (
              <div className="csv-drop-success">
                <span style={{ fontSize: 20 }}>✓</span>
                <div>
                  <strong>{fileName}</strong>
                  <div className="csv-drop-meta">{t('csv.rowsMeta', { rows: csvData.rows.length, cols: csvData.headers.length })}</div>
                </div>
              </div>
            ) : (
              <div className="csv-drop-prompt">
                <span className="csv-drop-icon">📂</span>
                <span className="csv-drop-main">{t('csv.clickToSelect')}</span>
                <span className="csv-drop-hint">{t('csv.bankHint')}</span>
              </div>
            )}
          </div>

          {csvData && (
            <>
              <div className="csv-mode-toggle">
                <span className="form-label" style={{ marginBottom: 0 }}>{t('csv.amountFormat')}</span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label className="csv-radio"><input type="radio" checked={mapping.mode === 'single'} onChange={() => setMap('mode', 'single')} /> {t('csv.singleAmount')}</label>
                  <label className="csv-radio"><input type="radio" checked={mapping.mode === 'debit-credit'} onChange={() => setMap('mode', 'debit-credit')} /> {t('csv.separateDebitCredit')}</label>
                </div>
              </div>

              {csvData.headerless && (
                <div className="csv-headerless-notice">{t('csv.headerlessNotice')}</div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('csv.dateColumn')}</label>
                  <select className="form-select" value={mapping.dateCol} onChange={e => setMap('dateCol', e.target.value)}>
                    {colOptions.map(h => <option key={h} value={h}>{colLabel(h) || t('csv.selectPrompt')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('csv.descriptionColumn')}</label>
                  <select className="form-select" value={mapping.descCol} onChange={e => setMap('descCol', e.target.value)}>
                    {colOptions.map(h => <option key={h} value={h}>{colLabel(h) || t('csv.selectPrompt')}</option>)}
                  </select>
                </div>
              </div>

              {mapping.mode === 'single' ? (
                <div className="form-group">
                  <label className="form-label">{t('csv.amountColumn')} <span className="csv-label-hint">{t('csv.negativeHint')}</span></label>
                  <select className="form-select" value={mapping.amountCol} onChange={e => setMap('amountCol', e.target.value)}>
                    {colOptions.map(h => <option key={h} value={h}>{colLabel(h) || t('csv.selectPrompt')}</option>)}
                  </select>
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('csv.debitColumn')} <span className="csv-label-hint">{t('csv.debitHint')}</span></label>
                    <select className="form-select" value={mapping.debitCol} onChange={e => setMap('debitCol', e.target.value)}>
                      {colOptions.map(h => <option key={h} value={h}>{colLabel(h) || t('csv.selectPrompt')}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('csv.creditColumn')} <span className="csv-label-hint">— {t('common.cancel').toLowerCase()}</span></label>
                    <select className="form-select" disabled style={{ opacity: 0.5 }}>
                      <option>{t('csv.creditSkipped')}</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-footer">
            <button className="btn btn-ghost" onClick={() => onClose(0)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" disabled={!canPreview} onClick={buildPreview}>
              {t('csv.previewBtn')}
            </button>
          </div>
        </>
      )}

      {/* ── Step 2: Preview ──────────────────────── */}
      {step === 2 && (
        <>
          <p className="csv-step-label">{t('csv.step2')}</p>

          {rows.length === 0 ? (
            <p className="empty-state" style={{ padding: '24px 0' }}>
              {t('csv.noTransactions')}
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

              <div className="csv-preview-toolbar">
                <span className="csv-preview-count">
                  <strong>{selectedCount}</strong> {t('csv.selectedOf', { n: selectedCount, m: rows.length }).replace(/^\d+\/?\d*\s?/, '')}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleAll(true)}>{t('csv.selectAll')}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleAll(false)}>{t('csv.none')}</button>
                </div>
              </div>

              <div className="csv-preview-list">
                {rows.map(row => (
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
            <button className="btn btn-ghost" onClick={() => setStep(1)}>{t('csv.backBtn')}</button>
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
