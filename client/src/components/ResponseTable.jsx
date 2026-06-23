import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Download, ChevronUp, ChevronDown, SlidersHorizontal, X, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import api from '../api'

const PAGE_SIZE = 10

/* ── Dual range slider ─────────────────────────────────────────── */
function DualRangeSlider({ min, max, value: [lo, hi], onChange, formatLabel }) {
  if (max === min) return null
  const loPercent = ((lo - min) / (max - min)) * 100
  const hiPercent = ((hi - min) / (max - min)) * 100

  const handleLo = (e) => {
    const v = Math.min(Number(e.target.value), hi - 1)
    onChange([v, hi])
  }
  const handleHi = (e) => {
    const v = Math.max(Number(e.target.value), lo + 1)
    onChange([lo, v])
  }

  const fmt = formatLabel || (v => v)

  return (
    <div style={{ paddingTop: '1.25rem' }}>
      {/* Value badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F37021', background: '#FFF7ED', padding: '0.15rem 0.5rem', borderRadius: 9999 }}>
          {fmt(lo)}
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F37021', background: '#FFF7ED', padding: '0.15rem 0.5rem', borderRadius: 9999 }}>
          {fmt(hi)}
        </span>
      </div>
      {/* Track + inputs */}
      <div style={{ position: 'relative', height: 28 }}>
        <div style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          left: 0, right: 0, height: 4,
          background: `linear-gradient(to right, #e5e7eb ${loPercent}%, #F37021 ${loPercent}%, #F37021 ${hiPercent}%, #e5e7eb ${hiPercent}%)`,
          borderRadius: 9999,
          pointerEvents: 'none',
        }} />
        <input
          type="range" min={min} max={max} value={lo}
          onChange={handleLo}
          className="dual-range"
          style={{ zIndex: lo > (min + max) / 2 ? 4 : 3 }}
        />
        <input
          type="range" min={min} max={max} value={hi}
          onChange={handleHi}
          className="dual-range"
          style={{ zIndex: hi <= (min + max) / 2 ? 4 : 3 }}
        />
      </div>
    </div>
  )
}

/* ── Toggle group ─────────────────────────────────────────────── */
function ToggleGroup({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: '0.375rem 0.875rem',
            borderRadius: 9999,
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1.5px solid',
            borderColor: value === opt.value ? '#F37021' : '#e5e7eb',
            backgroundColor: value === opt.value ? '#FFF7F0' : 'white',
            color: value === opt.value ? '#F37021' : '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ── Helpers ────────────────────────────────────────────────────── */
function ScoreBadge({ score }) {
  const color = score <= 4 ? '#EF4444' : score <= 7 ? '#F37021' : '#22C55E'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '2rem', height: '2rem', borderRadius: '50%',
      backgroundColor: color + '20', color, fontWeight: 700, fontSize: '0.85rem',
    }}>
      {score}
    </span>
  )
}

function InterestedBadge({ value }) {
  return (
    <span className="badge" style={{ backgroundColor: value ? '#dcfce7' : '#f3f4f6', color: value ? '#16a34a' : '#6b7280' }}>
      {value ? 'Oui' : 'Non'}
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-TN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function exportCSV(responses) {
  const headers = ['Date', 'Nom', 'Email', 'Âge', 'Profession', 'Compagnie', 'Score', 'Assurance vie', 'Prime (DT)', 'Raisons', 'Intéressé', 'Téléphone']
  const rows = responses.map(r => [
    formatDate(r.submittedAt), r.fullName, r.email, r.ageRange, r.profession,
    r.insuranceCompany, r.satisfactionScore, r.hasLifeInsurance ? 'Oui' : 'Non',
    r.annualPremium, (r.switchReasons || []).join('; '), r.interested ? 'Oui' : 'Non', r.phone || '',
  ])
  const csvContent = [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reponses_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Main component ─────────────────────────────────────────────── */
export default function ResponseTable({ responses, passkey, onDeleted }) {
  const [sortKey, setSortKey] = useState('submittedAt')
  const [sortDir, setSortDir] = useState('desc')
  const [deleting, setDeleting] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')

  /* derive bounds from data */
  const premiumBounds = useMemo(() => {
    if (!responses.length) return [0, 1000]
    const vals = responses.map(r => r.annualPremium).filter(Boolean)
    return [Math.floor(Math.min(...vals)), Math.ceil(Math.max(...vals))]
  }, [responses.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const [filters, setFilters] = useState({
    ageRanges: [], companies: [],
    scoreRange: [1, 10],
    premiumRange: null,
    hasLifeInsurance: 'all',
    interested: 'all',
    dateFrom: '', dateTo: '',
    search: '',
  })

  /* sync premiumRange when data first arrives */
  useEffect(() => {
    setFilters(f => ({ ...f, premiumRange: premiumBounds }))
  }, [premiumBounds[0], premiumBounds[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  /* debounced search */
  const searchTimer = useRef(null)
  const handleSearchChange = (val) => {
    setSearchInput(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: val }))
      setPage(1)
    }, 300)
  }

  const setFilter = useCallback((key, val) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }, [])

  const toggleMulti = useCallback((key, val) => {
    setFilters(f => {
      const cur = f[key]
      const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]
      return { ...f, [key]: next }
    })
    setPage(1)
  }, [])

  const allAgeRanges = useMemo(() => {
    const order = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+']
    const present = [...new Set(responses.map(r => r.ageRange).filter(Boolean))]
    return order.filter(a => present.includes(a))
  }, [responses])

  const allCompanies = useMemo(() =>
    [...new Set(responses.map(r => r.insuranceCompany).filter(Boolean))].sort()
  , [responses])

  /* sort */
  const sorted = useMemo(() => [...responses].sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey]
    if (sortKey === 'submittedAt') { va = new Date(va); vb = new Date(vb) }
    if (typeof va === 'string') va = va.toLowerCase()
    if (typeof vb === 'string') vb = vb.toLowerCase()
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  }), [responses, sortKey, sortDir])

  /* filter */
  const filtered = useMemo(() => sorted.filter(r => {
    if (filters.ageRanges.length && !filters.ageRanges.includes(r.ageRange)) return false
    if (filters.companies.length && !filters.companies.includes(r.insuranceCompany)) return false
    if (r.satisfactionScore < filters.scoreRange[0] || r.satisfactionScore > filters.scoreRange[1]) return false
    if (filters.premiumRange) {
      if (r.annualPremium < filters.premiumRange[0] || r.annualPremium > filters.premiumRange[1]) return false
    }
    if (filters.hasLifeInsurance !== 'all') {
      if (filters.hasLifeInsurance === 'yes' && !r.hasLifeInsurance) return false
      if (filters.hasLifeInsurance === 'no' && r.hasLifeInsurance) return false
    }
    if (filters.interested !== 'all') {
      if (filters.interested === 'yes' && !r.interested) return false
      if (filters.interested === 'no' && r.interested) return false
    }
    if (filters.dateFrom) {
      if (new Date(r.submittedAt) < new Date(filters.dateFrom)) return false
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo); to.setHours(23, 59, 59, 999)
      if (new Date(r.submittedAt) > to) return false
    }
    if (filters.search) {
      const s = filters.search.toLowerCase()
      if (![r.fullName, r.email, r.profession].some(f => f?.toLowerCase().includes(s))) return false
    }
    return true
  }), [sorted, filters])

  /* active filter count */
  const activeFilterCount = useMemo(() => [
    filters.ageRanges.length > 0,
    filters.companies.length > 0,
    filters.scoreRange[0] > 1 || filters.scoreRange[1] < 10,
    filters.premiumRange && (filters.premiumRange[0] > premiumBounds[0] || filters.premiumRange[1] < premiumBounds[1]),
    filters.hasLifeInsurance !== 'all',
    filters.interested !== 'all',
    !!filters.dateFrom,
    !!filters.dateTo,
    !!filters.search,
  ].filter(Boolean).length, [filters, premiumBounds])

  const resetFilters = () => {
    setFilters({
      ageRanges: [], companies: [],
      scoreRange: [1, 10],
      premiumRange: premiumBounds,
      hasLifeInsurance: 'all',
      interested: 'all',
      dateFrom: '', dateTo: '',
      search: '',
    })
    setSearchInput('')
    setPage(1)
  }

  /* pagination */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  /* sort handling */
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette réponse ? Cette action est irréversible.')) return
    setDeleting(id)
    try {
      await api.delete(`/api/responses/${id}`, { headers: { 'x-passkey': passkey } })
      onDeleted(id)
    } catch {
      alert('Erreur lors de la suppression.')
    } finally {
      setDeleting(null)
    }
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp size={13} style={{ opacity: 0.3 }} />
    return sortDir === 'asc' ? <ChevronUp size={13} style={{ color: '#F37021' }} /> : <ChevronDown size={13} style={{ color: '#F37021' }} />
  }

  const th = (label, key) => (
    <th
      onClick={() => handleSort(key)}
      style={{
        padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600,
        color: sortKey === key ? '#F37021' : '#6b7280',
        textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
        cursor: 'pointer', userSelect: 'none', backgroundColor: '#f9fafb',
        borderBottom: '2px solid #e5e7eb',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        {label} <SortIcon col={key} />
      </span>
    </th>
  )

  const filterSectionLabel = (text) => (
    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#003B73', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
      {text}
    </div>
  )

  const isRowHighlighted = (r) => {
    if (!filters.search) return false
    const s = filters.search.toLowerCase()
    return [r.fullName, r.email, r.profession].some(f => f?.toLowerCase().includes(s))
  }

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Rechercher (nom, email, profession)..."
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: '2.25rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem',
              border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.82rem', outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = '0 0 0 2px #F37021' }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen(o => !o)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 0.875rem', fontSize: '0.82rem', fontWeight: 600,
              border: '1.5px solid',
              borderColor: filtersOpen || activeFilterCount > 0 ? '#F37021' : '#e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: filtersOpen || activeFilterCount > 0 ? '#FFF7F0' : 'white',
              color: filtersOpen || activeFilterCount > 0 ? '#F37021' : '#6b7280',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <SlidersHorizontal size={14} />
            Filtres
            {activeFilterCount > 0 && (
              <span style={{
                backgroundColor: '#F37021', color: 'white',
                borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700,
                padding: '0 0.4rem', lineHeight: '1.4',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 500,
                border: '1.5px solid #fca5a5', borderRadius: '0.5rem',
                backgroundColor: '#fef2f2', color: '#EF4444',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <X size={13} />
              Réinitialiser
            </button>
          )}

          <button
            className="btn-secondary"
            onClick={() => exportCSV(filtered)}
            style={{ padding: '0.5rem 0.875rem', fontSize: '0.82rem' }}
          >
            <Download size={14} />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              backgroundColor: '#f9fafb', borderRadius: '0.875rem',
              border: '1.5px solid #e5e7eb', padding: '1.25rem',
              marginBottom: '1rem',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
              }}>
                {/* Age ranges */}
                <div>
                  {filterSectionLabel('Tranche d\'âge')}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {allAgeRanges.map(age => (
                      <label key={age} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.3rem 0.6rem', fontSize: '0.78rem', fontWeight: 500,
                        border: '1.5px solid', cursor: 'pointer',
                        borderColor: filters.ageRanges.includes(age) ? '#F37021' : '#e5e7eb',
                        backgroundColor: filters.ageRanges.includes(age) ? '#FFF7F0' : 'white',
                        color: filters.ageRanges.includes(age) ? '#F37021' : '#374151',
                        borderRadius: 9999, transition: 'all 0.12s',
                      }}>
                        <input
                          type="checkbox" style={{ display: 'none' }}
                          checked={filters.ageRanges.includes(age)}
                          onChange={() => toggleMulti('ageRanges', age)}
                        />
                        {age}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Companies */}
                <div>
                  {filterSectionLabel('Compagnie')}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '140px', overflowY: 'auto' }}>
                    {allCompanies.map(co => (
                      <label key={co} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.82rem', cursor: 'pointer',
                        color: filters.companies.includes(co) ? '#F37021' : '#374151',
                        fontWeight: filters.companies.includes(co) ? 600 : 400,
                      }}>
                        <input
                          type="checkbox"
                          checked={filters.companies.includes(co)}
                          onChange={() => toggleMulti('companies', co)}
                          style={{ accentColor: '#F37021', width: '0.95rem', height: '0.95rem' }}
                        />
                        {co}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Score range */}
                <div>
                  {filterSectionLabel('Score de satisfaction')}
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    Entre {filters.scoreRange[0]} et {filters.scoreRange[1]}
                  </div>
                  <DualRangeSlider
                    min={1} max={10}
                    value={filters.scoreRange}
                    onChange={v => setFilter('scoreRange', v)}
                  />
                </div>

                {/* Premium range */}
                <div>
                  {filterSectionLabel('Prime annuelle (DT)')}
                  {filters.premiumRange && (
                    <>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        Entre {filters.premiumRange[0]} et {filters.premiumRange[1]} DT
                      </div>
                      <DualRangeSlider
                        min={premiumBounds[0]} max={premiumBounds[1]}
                        value={filters.premiumRange}
                        onChange={v => setFilter('premiumRange', v)}
                        formatLabel={v => `${v} DT`}
                      />
                    </>
                  )}
                </div>

                {/* Life insurance toggle */}
                <div>
                  {filterSectionLabel('Assurance vie')}
                  <ToggleGroup
                    value={filters.hasLifeInsurance}
                    onChange={v => setFilter('hasLifeInsurance', v)}
                    options={[{ value: 'all', label: 'Tous' }, { value: 'yes', label: 'Oui' }, { value: 'no', label: 'Non' }]}
                  />
                </div>

                {/* Interested toggle */}
                <div>
                  {filterSectionLabel('Intéressé(e)')}
                  <ToggleGroup
                    value={filters.interested}
                    onChange={v => setFilter('interested', v)}
                    options={[{ value: 'all', label: 'Tous' }, { value: 'yes', label: 'Oui' }, { value: 'no', label: 'Non' }]}
                  />
                </div>

                {/* Date range */}
                <div style={{ gridColumn: 'span 1' }}>
                  {filterSectionLabel('Date de soumission')}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Du</div>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={e => setFilter('dateFrom', e.target.value)}
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.5rem',
                          border: '1.5px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.8rem', outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Au</div>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={e => setFilter('dateTo', e.target.value)}
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.5rem',
                          border: '1.5px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.8rem', outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result count */}
      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 600, color: '#111827' }}>{filtered.length}</span> réponse{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
        {filtered.length !== responses.length && (
          <span style={{ color: '#9ca3af' }}> sur {responses.length}</span>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: '0.875rem', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              {th('Date', 'submittedAt')}
              {th('Nom', 'fullName')}
              {th('Email', 'email')}
              {th('Âge', 'ageRange')}
              {th('Compagnie', 'insuranceCompany')}
              {th('Score', 'satisfactionScore')}
              {th('Prime (DT)', 'annualPremium')}
              {th('Intéressé', 'interested')}
              <th style={{ padding: '0.75rem 1rem', backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb', fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tél.</th>
              <th style={{ padding: '0.75rem 1rem', backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Aucune réponse ne correspond aux filtres sélectionnés
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    style={{
                      padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 600,
                      backgroundColor: '#F37021', color: 'white', border: 'none',
                      borderRadius: '0.5rem', cursor: 'pointer', marginTop: '0.5rem',
                    }}
                  >
                    Réinitialiser les filtres
                  </button>
                </td>
              </tr>
            ) : paginated.map((r, i) => {
              const highlighted = isRowHighlighted(r)
              return (
                <motion.tr
                  key={r._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.028, duration: 0.25 }}
                  style={{
                    backgroundColor: highlighted ? '#FEFCE8' : i % 2 === 0 ? 'white' : '#fafafa',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!highlighted) e.currentTarget.style.backgroundColor = '#EFF6FF' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = highlighted ? '#FEFCE8' : i % 2 === 0 ? 'white' : '#fafafa' }}
                >
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280', whiteSpace: 'nowrap', borderBottom: '1px solid #f3f4f6' }}>{formatDate(r.submittedAt)}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', borderBottom: '1px solid #f3f4f6', position: 'sticky', left: 0, backgroundColor: 'inherit' }}>{r.fullName}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>
                    <a href={`mailto:${r.email}`} style={{ color: '#005BAA', textDecoration: 'none' }}>{r.email}</a>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{r.ageRange}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{r.insuranceCompany}</td>
                  <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6' }}><ScoreBadge score={r.satisfactionScore} /></td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151', fontWeight: 500, borderBottom: '1px solid #f3f4f6' }}>{r.annualPremium?.toLocaleString('fr-TN')} DT</td>
                  <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6' }}><InterestedBadge value={r.interested} /></td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap' }}>
                    {r.phone || <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => handleDelete(r._id)}
                      disabled={deleting === r._id}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444',
                        padding: '0.25rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center',
                        opacity: deleting === r._id ? 0.5 : 1, transition: 'opacity 0.15s',
                      }}
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.4rem 0.75rem', fontSize: '0.82rem', fontWeight: 500,
              border: '1.5px solid #e5e7eb', borderRadius: '0.5rem',
              backgroundColor: page === 1 ? '#f9fafb' : 'white',
              color: page === 1 ? '#d1d5db' : '#374151',
              cursor: page === 1 ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <ChevronLeft size={14} />
            Préc.
          </button>

          <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>
            Page <strong style={{ color: '#003B73' }}>{page}</strong> sur <strong>{totalPages}</strong>
          </span>

          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.4rem 0.75rem', fontSize: '0.82rem', fontWeight: 500,
              border: '1.5px solid #e5e7eb', borderRadius: '0.5rem',
              backgroundColor: page === totalPages ? '#f9fafb' : 'white',
              color: page === totalPages ? '#d1d5db' : '#374151',
              cursor: page === totalPages ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Suiv.
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
