import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import { Lock, Shield, Users, TrendingUp, DollarSign, Star, RefreshCw } from 'lucide-react'
import AgeDistributionChart from '../components/charts/AgeDistributionChart'
import InsuranceCompanyChart from '../components/charts/InsuranceCompanyChart'
import SatisfactionChart from '../components/charts/SatisfactionChart'
import LifeInsuranceChart from '../components/charts/LifeInsuranceChart'
import AnnualPremiumChart from '../components/charts/AnnualPremiumChart'
import SwitchReasonChart from '../components/charts/SwitchReasonChart'
import ResponseTable from '../components/ResponseTable'

const PASSKEY_KEY = 'alm_passkey'

function useCountUp(target, duration = 900, enabled = true) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled || !target) { setValue(target); return }
    setValue(0)
    let raf
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(eased * target * 10) / 10)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, enabled])
  return value
}

function KpiCard({ icon: Icon, label, numericValue, format, color, sub }) {
  const animated = useCountUp(numericValue, 900, numericValue > 0)
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        borderLeft: `4px solid ${color}`,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      }}
    >
      <div style={{
        backgroundColor: color + '18',
        borderRadius: '0.75rem',
        padding: '0.75rem',
        flexShrink: 0,
        display: 'flex',
      }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {numericValue === 0 ? '—' : (format ? format(animated) : Math.round(animated))}
        </div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem' }}>{sub}</div>}
      </div>
    </motion.div>
  )
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: '#6b7280' }}>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
      <span>Chargement des données...</span>
    </div>
  )
}

function countBy(arr, key) {
  return arr.reduce((acc, item) => {
    const val = item[key] || 'Inconnu'
    acc[val] = (acc[val] || 0) + 1
    return acc
  }, {})
}

function processData(responses) {
  if (!responses.length) return null

  const ageCounts = countBy(responses, 'ageRange')
  const ageData = Object.entries(ageCounts).map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      const order = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+']
      return order.indexOf(a.label) - order.indexOf(b.label)
    })

  const companyCounts = countBy(responses, 'insuranceCompany')
  const companyData = Object.entries(companyCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)

  const scoreDist = {}
  for (let i = 1; i <= 10; i++) scoreDist[i] = 0
  responses.forEach(r => { if (r.satisfactionScore) scoreDist[r.satisfactionScore]++ })
  const satisfactionData = Object.entries(scoreDist).map(([score, count]) => ({ score: Number(score), count }))

  const lifeData = [
    { label: 'Avec assurance vie', count: responses.filter(r => r.hasLifeInsurance).length },
    { label: 'Sans assurance vie', count: responses.filter(r => !r.hasLifeInsurance).length },
  ]

  const premiumByAge = {}
  responses.forEach(r => {
    if (!premiumByAge[r.ageRange]) premiumByAge[r.ageRange] = []
    premiumByAge[r.ageRange].push(r.annualPremium)
  })
  const order = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+']
  const premiumData = order
    .filter(k => premiumByAge[k])
    .map(k => ({
      label: k,
      avg: premiumByAge[k].reduce((a, b) => a + b, 0) / premiumByAge[k].length,
    }))

  const reasonCounts = {}
  responses.forEach(r => {
    ;(r.switchReasons || []).forEach(reason => {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
    })
  })
  const switchData = Object.entries(reasonCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)

  return { ageData, companyData, satisfactionData, lifeData, premiumData, switchData }
}

export default function Dashboard() {
  const [passkey, setPasskey] = useState(() => localStorage.getItem(PASSKEY_KEY) || '')
  const [passkeyInput, setPasskeyInput] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const fetchResponses = useCallback(async (key) => {
    setLoading(true)
    setFetchError('')
    try {
      const { data } = await api.get('/api/responses', { headers: { 'x-passkey': key } })
      setResponses(data)
    } catch (e) {
      if (e.response?.status === 401) {
        setAuthenticated(false)
        localStorage.removeItem(PASSKEY_KEY)
        setPasskey('')
        setAuthError('Clé invalide. Veuillez réessayer.')
      } else {
        setFetchError('Impossible de charger les données. Vérifiez que le serveur est démarré.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (passkey) {
      fetchResponses(passkey).then(() => setAuthenticated(true))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async () => {
    if (!passkeyInput.trim()) { setAuthError("Veuillez saisir la clé d'accès."); return }
    setAuthError('')
    setLoading(true)
    try {
      const { data } = await api.get('/api/responses', { headers: { 'x-passkey': passkeyInput } })
      localStorage.setItem(PASSKEY_KEY, passkeyInput)
      setPasskey(passkeyInput)
      setResponses(data)
      setAuthenticated(true)
    } catch (e) {
      if (e.response?.status === 401) setAuthError("Clé d'accès incorrecte.")
      else setAuthError('Erreur serveur. Vérifiez que le serveur est démarré.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(PASSKEY_KEY)
    setPasskey('')
    setAuthenticated(false)
    setResponses([])
    setPasskeyInput('')
  }

  const handleDeleted = (id) => setResponses(prev => prev.filter(r => r._id !== id))

  const total = responses.length
  const interestedCount = responses.filter(r => r.interested).length
  const interestRate = total ? Math.round((interestedCount / total) * 100) : 0
  const avgPremium = total ? Math.round(responses.reduce((a, r) => a + (r.annualPremium || 0), 0) / total) : 0
  const avgScore = total ? parseFloat((responses.reduce((a, r) => a + (r.satisfactionScore || 0), 0) / total).toFixed(1)) : 0

  const chartData = processData(responses)

  return (
    <AnimatePresence mode="wait">
      {!authenticated ? (
        <motion.div
          key="lock"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.25 }}
          style={{
            minHeight: '80vh',
            background: 'linear-gradient(135deg, #003B73 0%, #005BAA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            flex: 1,
          }}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '1.5rem',
              padding: '3rem 2.5rem',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
              textAlign: 'center',
            }}
          >
            <div style={{ backgroundColor: '#FFF7F0', borderRadius: '50%', width: '5rem', height: '5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Lock size={32} color="#F37021" />
            </div>
            <h1 style={{ color: '#003B73', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Accès Dashboard
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Saisissez la clé d'accès pour consulter les réponses
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <input
                className="form-input"
                type="password"
                placeholder="Clé d'accès"
                value={passkeyInput}
                onChange={e => { setPasskeyInput(e.target.value); setAuthError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ textAlign: 'center', fontSize: '1rem', letterSpacing: '0.1em' }}
              />
              <AnimatePresence>
                {authError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '0.5rem' }}
                  >
                    {authError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <button
              className="btn-primary"
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Vérification...' : (
                <>
                  <Shield size={18} />
                  Accéder au Dashboard
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{ backgroundColor: '#f9fafb', minHeight: '100vh', flex: 1 }}
        >
          {/* Header */}
          <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1.25rem 1.5rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h1 style={{ color: '#003B73', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Dashboard des réponses</h1>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>AL Maghrebia Assurance — Analyse des sondages</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn-secondary"
                  onClick={() => fetchResponses(passkey)}
                  disabled={loading}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  Actualiser
                </button>
                <button
                  onClick={handleLogout}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#6b7280', fontWeight: 500, transition: 'all 0.2s' }}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
            {fetchError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#EF4444', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {fetchError}
              </div>
            )}

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <KpiCard icon={Users} label="Total réponses" numericValue={total} format={v => Math.round(v)} color="#003B73" />
              <KpiCard icon={TrendingUp} label="Taux d'intérêt" numericValue={interestRate} format={v => `${Math.round(v)}%`} color="#F37021" sub={`${interestedCount} intéressé${interestedCount !== 1 ? 's' : ''}`} />
              <KpiCard icon={DollarSign} label="Prime moyenne" numericValue={avgPremium} format={v => `${Math.round(v)} DT`} color="#22C55E" />
              <KpiCard icon={Star} label="Score de satisfaction" numericValue={avgScore} format={v => `${v.toFixed(1)}/10`} color="#7c3aed" />
            </div>

            {loading && !total ? (
              <LoadingSpinner />
            ) : !total ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
                <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Aucune réponse pour le moment</p>
                <p style={{ fontSize: '0.875rem' }}>Les réponses du sondage apparaîtront ici.</p>
              </div>
            ) : chartData && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <AgeDistributionChart data={chartData.ageData} />
                  <InsuranceCompanyChart data={chartData.companyData} />
                  <SatisfactionChart data={chartData.satisfactionData} />
                  <LifeInsuranceChart data={chartData.lifeData} />
                  <AnnualPremiumChart data={chartData.premiumData} />
                  <SwitchReasonChart data={chartData.switchData} />
                </div>

                <div className="card" style={{ marginTop: '1.5rem' }}>
                  <h2 style={{ color: '#003B73', fontWeight: 700, fontSize: '1.125rem', margin: '0 0 1.25rem' }}>
                    Toutes les réponses
                  </h2>
                  <ResponseTable responses={responses} passkey={passkey} onDeleted={handleDeleted} />
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
