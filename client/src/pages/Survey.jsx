import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import {
  CheckCircle, ChevronLeft, ChevronRight, Send,
  BadgePercent, Trophy, Home, FileText, Star, Check,
} from 'lucide-react'

const STEPS = ['Informations', 'Assurance', 'Changement', 'Contact']

const COMPANIES = ["Lloyd's", 'Maghrebia', 'Carte', 'STAR', 'COMAR', 'GAT', 'BH Assurance', 'Autre']
const INSURANCE_TYPES = ['Auto', 'Habitation', 'Vie', 'Santé', 'Risques divers', 'Responsabilité civile']
const AGE_RANGES = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+']
const SWITCH_REASONS_OPTIONS = [
  'Crédibilité', 'Fiabilité', 'Réputation',
  'Raisons financières', 'Qualité du service', 'Recommandation',
]

const initialForm = {
  ageRange: '', fullName: '', email: '', profession: '',
  insuranceCompany: '', satisfactionScore: 0,
  hasLifeInsurance: null, lifeInsuranceType: [],
  annualPremium: '', switchReasons: [], interested: null, phone: '',
}

function validate(step, form) {
  const errors = {}
  if (step === 0) {
    if (!form.ageRange) errors.ageRange = "Veuillez sélectionner votre tranche d'âge."
    if (!form.fullName.trim()) errors.fullName = 'Veuillez saisir votre nom et prénom.'
    if (!form.email.trim()) errors.email = 'Veuillez saisir votre email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email invalide.'
    if (!form.profession.trim()) errors.profession = 'Veuillez saisir votre profession.'
  }
  if (step === 1) {
    if (!form.insuranceCompany) errors.insuranceCompany = 'Veuillez sélectionner votre compagnie.'
    if (!form.satisfactionScore) errors.satisfactionScore = 'Veuillez indiquer votre score de satisfaction.'
    if (form.hasLifeInsurance === null) errors.hasLifeInsurance = 'Veuillez répondre à cette question.'
    if (!form.annualPremium) errors.annualPremium = 'Veuillez saisir votre prime annuelle.'
    else if (isNaN(Number(form.annualPremium)) || Number(form.annualPremium) <= 0) errors.annualPremium = 'Valeur invalide.'
  }
  if (step === 2) {
    if (form.switchReasons.length === 0) errors.switchReasons = 'Veuillez sélectionner au moins une raison.'
  }
  if (step === 3) {
    if (form.interested === null) errors.interested = 'Veuillez répondre à cette question.'
    if (form.interested && !form.phone.trim()) errors.phone = 'Veuillez saisir votre numéro de téléphone.'
  }
  return errors
}

const scoreColor = (n) => n <= 3 ? '#EF4444' : n <= 6 ? '#F97316' : '#22C55E'
const scoreLabel = (n) => n <= 3 ? 'Très insatisfait' : n <= 6 ? 'Neutre' : 'Très satisfait'

function ScoreRating({ value, onChange, error }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
          const color = scoreColor(n)
          const selected = value === n
          return (
            <motion.button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 1.2 }}
              style={{
                width: '2.625rem',
                height: '2.625rem',
                borderRadius: '50%',
                border: selected ? `2.5px solid ${color}` : '2px solid #e5e7eb',
                backgroundColor: selected ? color : 'white',
                color: selected ? 'white' : '#6b7280',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s, border-color 0.15s, color 0.15s',
              }}
            >
              {n}
            </motion.button>
          )
        })}
      </div>
      {value > 0 && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: scoreColor(value),
          }}
        >
          {scoreLabel(value)}
        </motion.div>
      )}
      {!value && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          <span>Très insatisfait</span>
          <span>Très satisfait</span>
        </div>
      )}
      {error && (
        <motion.p
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.375rem' }}
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}

const CALLOUT_CONFIG = [
  { icon: BadgePercent, color: '#F37021', bg: '#FFF7ED', borderColor: '#FDBA74', text: 'Commission de 20% — Je perçois une commission de 20% sur votre contrat, sans coût supplémentaire pour vous.' },
  { icon: Trophy,      color: '#D97706', bg: '#FFFBEB', borderColor: '#FCD34D', text: 'Offre exclusive — Les 10 premiers clients bénéficient d\'un service sans commission.' },
  { icon: Home,        color: '#005BAA', bg: '#EFF6FF', borderColor: '#93C5FD', text: 'Service à domicile — Livraison de quittance et contrat directement chez vous.' },
  { icon: FileText,    color: '#059669', bg: '#F0FDF4', borderColor: '#6EE7B7', text: 'Devis instantané' },
  { icon: Star,        color: '#7c3aed', bg: '#F5F3FF', borderColor: '#C4B5FD', text: 'Suivi qualité — Un suivi de satisfaction personnalisé après signature de votre contrat.' },
]

function Callout({ configIndex }) {
  const { icon: Icon, color, bg, borderColor, text } = CALLOUT_CONFIG[configIndex]
  return (
    <div style={{
      background: bg,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: '0.625rem',
      padding: '0.875rem 1rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.625rem',
      fontSize: '0.875rem',
      color: '#374151',
    }}>
      <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
      <span style={{ lineHeight: 1.55 }}>{text}</span>
    </div>
  )
}

function ErrorMsg({ msg }) {
  if (!msg) return null
  return (
    <motion.p
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.375rem' }}
    >
      {msg}
    </motion.p>
  )
}

function Fade({ delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

const CONFETTI = [
  { color: '#F37021', left: '8%',  delay: '0s',    size: 9 },
  { color: '#003B73', left: '20%', delay: '0.07s', size: 7 },
  { color: '#22C55E', left: '35%', delay: '0.04s', size: 10 },
  { color: '#EF4444', left: '50%', delay: '0.12s', size: 8 },
  { color: '#7c3aed', left: '63%', delay: '0.08s', size: 9 },
  { color: '#F59E0B', left: '75%', delay: '0.16s', size: 7 },
  { color: '#EC4899', left: '85%', delay: '0.02s', size: 8 },
  { color: '#06B6D4', left: '93%', delay: '0.11s', size: 7 },
]

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
}

function StickyProgress({ step }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pct = Math.round((step / (STEPS.length - 1)) * 100)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            backgroundColor: 'white',
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{
            maxWidth: '680px',
            margin: '0 auto',
            padding: '0.65rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
          }}>
            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? '1.5rem' : '0.45rem',
                  height: '0.45rem',
                  borderRadius: '9999px',
                  backgroundColor: i <= step ? '#F37021' : '#e5e7eb',
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500 }}>
                Étape {step + 1} sur {STEPS.length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#003B73', fontWeight: 700, lineHeight: 1.2 }}>
                {STEPS[step]}
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#F37021', fontWeight: 700, flexShrink: 0 }}>
              {pct}%
            </div>
          </div>
          <div style={{ height: '3px', backgroundColor: '#f3f4f6' }}>
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              style={{ height: '100%', backgroundColor: '#F37021' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Survey() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const toggleSwitchReason = (reason) => {
    setForm(f => ({
      ...f,
      switchReasons: f.switchReasons.includes(reason)
        ? f.switchReasons.filter(r => r !== reason)
        : [...f.switchReasons, reason],
    }))
  }

  const toggleLifeInsuranceType = (type) => {
    setForm(f => ({
      ...f,
      lifeInsuranceType: f.lifeInsuranceType.includes(type)
        ? f.lifeInsuranceType.filter(t => t !== type)
        : [...f.lifeInsuranceType, type],
    }))
  }

  const next = () => {
    const errs = validate(step, form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setDirection(1)
    setStep(s => s + 1)
  }

  const back = () => {
    setErrors({})
    setDirection(-1)
    setStep(s => s - 1)
  }

  const submit = async () => {
    const errs = validate(3, form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    setSubmitError('')
    try {
      const lifeInsuranceType = form.hasLifeInsurance && form.lifeInsuranceType.length
        ? form.lifeInsuranceType.join(', ')
        : 'none'
      await api.post('/api/responses', {
        ageRange: form.ageRange, fullName: form.fullName, email: form.email,
        profession: form.profession, insuranceCompany: form.insuranceCompany,
        satisfactionScore: Number(form.satisfactionScore),
        hasLifeInsurance: form.hasLifeInsurance, lifeInsuranceType,
        annualPremium: Number(form.annualPremium),
        switchReasons: form.switchReasons, interested: form.interested, phone: form.phone,
      })
      setSubmitted(true)
    } catch (e) {
      setSubmitError(e.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div
          className="card"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '3.5rem 2rem', position: 'relative', overflow: 'hidden' }}
        >
          {/* Confetti */}
          <div style={{ position: 'absolute', top: '2rem', left: 0, right: 0, pointerEvents: 'none' }}>
            {CONFETTI.map((c, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: c.left,
                width: c.size, height: c.size,
                borderRadius: '50%',
                backgroundColor: c.color,
                animation: `confettiFloat 1.2s ease forwards ${c.delay}`,
              }} />
            ))}
          </div>

          <svg width="88" height="88" viewBox="0 0 88 88" style={{ margin: '0 auto 1.75rem' }}>
            <circle cx="44" cy="44" r="42" fill="#dcfce7" stroke="#22C55E" strokeWidth="3" />
            <path
              className="checkmark-path"
              d="M24 44 L38 58 L64 30"
              fill="none"
              stroke="#22C55E"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <h2 style={{ color: '#003B73', fontSize: '1.625rem', fontWeight: 800, marginBottom: '0.875rem' }}>
            Merci pour votre participation !
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 0 }}>
            Nous avons bien reçu vos réponses. Notre équipe vous contactera sous peu avec une offre personnalisée.
          </p>
          <button
            className="btn-primary"
            onClick={() => { setForm(initialForm); setStep(0); setSubmitted(false) }}
            style={{ marginTop: '2rem' }}
          >
            <CheckCircle size={18} />
            Nouveau sondage
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <StickyProgress step={step} />

      {/* Hero Banner */}
      <div style={{
        backgroundColor: '#02315e',
        display: 'flex',
        justifyContent: 'center',
        lineHeight: 0,
      }}>
        <img
          src="/WhatsApp%20Image%202026-07-01%20at%2016.16.32.jpeg"
          alt="Fahmi — Protection et conseil 24/7"
          style={{ width: '100%', maxWidth: '520px', display: 'block', height: 'auto' }}
        />
      </div>

      {/* Step indicator */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #f3f4f6', padding: '1.25rem 1.5rem' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {STEPS.map((label, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                  <motion.div
                    animate={{
                      backgroundColor: i < step ? '#003B73' : i === step ? '#F37021' : 'white',
                      borderColor: i < step ? '#003B73' : i === step ? '#F37021' : '#e5e7eb',
                      color: i <= step ? 'white' : '#9ca3af',
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '50%',
                      border: '2px solid',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i < step ? <Check size={14} /> : i + 1}
                  </motion.div>
                  <span style={{
                    fontSize: '0.67rem',
                    color: i === step ? '#003B73' : '#9ca3af',
                    fontWeight: i === step ? 600 : 400,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </div>

                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: '2px', marginTop: '1.1rem', backgroundColor: '#e5e7eb', overflow: 'hidden', marginLeft: 4, marginRight: 4 }}>
                    <motion.div
                      animate={{ width: i < step ? '100%' : '0%' }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                      style={{ height: '100%', backgroundColor: '#F37021' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form card */}
      <div style={{ maxWidth: '680px', margin: '2rem auto', padding: '0 1rem 3rem' }}>
        <div className="card" style={{ borderTop: '3px solid #F37021' }}>
          <div style={{ overflow: 'hidden' }}>
            <AnimatePresence custom={direction} mode="wait" initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.22 }}
              >
                {step === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    <Fade delay={0.04}>
                      <h2 style={{ color: '#003B73', fontWeight: 700, fontSize: '1.3rem', margin: 0 }}>
                        Informations personnelles
                      </h2>
                    </Fade>
                    <Fade delay={0.09}>
                      <div>
                        <label className="form-label">Tranche d'âge *</label>
                        <select
                          className="form-select"
                          value={form.ageRange}
                          onChange={e => set('ageRange', e.target.value)}
                        >
                          <option value="">Sélectionnez votre tranche d'âge</option>
                          {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ErrorMsg msg={errors.ageRange} />
                      </div>
                    </Fade>
                    <Fade delay={0.13}>
                      <div>
                        <label className="form-label">Nom et prénom *</label>
                        <input
                          className={`form-input${form.fullName ? ' filled' : ''}`}
                          type="text"
                          placeholder="Ex: Ahmed Ben Ali"
                          value={form.fullName}
                          onChange={e => set('fullName', e.target.value)}
                        />
                        <ErrorMsg msg={errors.fullName} />
                      </div>
                    </Fade>
                    <Fade delay={0.17}>
                      <div>
                        <label className="form-label">Email *</label>
                        <input
                          className={`form-input${form.email ? ' filled' : ''}`}
                          type="email"
                          placeholder="exemple@email.com"
                          value={form.email}
                          onChange={e => set('email', e.target.value)}
                        />
                        <ErrorMsg msg={errors.email} />
                      </div>
                    </Fade>
                    <Fade delay={0.21}>
                      <div>
                        <label className="form-label">Profession *</label>
                        <input
                          className={`form-input${form.profession ? ' filled' : ''}`}
                          type="text"
                          placeholder="Ex: Ingénieur, Médecin, Commerçant..."
                          value={form.profession}
                          onChange={e => set('profession', e.target.value)}
                        />
                        <ErrorMsg msg={errors.profession} />
                      </div>
                    </Fade>
                  </div>
                )}

                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    <Fade delay={0.04}>
                      <h2 style={{ color: '#003B73', fontWeight: 700, fontSize: '1.3rem', margin: 0 }}>
                        Votre assurance actuelle
                      </h2>
                    </Fade>
                    <Fade delay={0.09}>
                      <Callout configIndex={0} />
                    </Fade>
                    <Fade delay={0.13}>
                      <div>
                        <label className="form-label">Compagnie d'assurance actuelle *</label>
                        <select
                          className="form-select"
                          value={form.insuranceCompany}
                          onChange={e => set('insuranceCompany', e.target.value)}
                        >
                          <option value="">Sélectionnez votre compagnie</option>
                          {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ErrorMsg msg={errors.insuranceCompany} />
                      </div>
                    </Fade>
                    <Fade delay={0.17}>
                      <div>
                        <label className="form-label">Satisfaction avec votre assurance actuelle *</label>
                        <ScoreRating value={form.satisfactionScore} onChange={v => set('satisfactionScore', v)} error={errors.satisfactionScore} />
                      </div>
                    </Fade>
                    <Fade delay={0.21}>
                      <div>
                        <label className="form-label">Êtes-vous déjà assuré(e) ? *</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          {[{ label: 'Oui', value: true }, { label: 'Non', value: false }].map(opt => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => { set('hasLifeInsurance', opt.value); if (!opt.value) set('lifeInsuranceType', []) }}
                              style={{
                                flex: 1,
                                padding: '0.875rem',
                                borderRadius: '0.625rem',
                                border: form.hasLifeInsurance === opt.value ? '2px solid #F37021' : '2px solid #e5e7eb',
                                backgroundColor: form.hasLifeInsurance === opt.value ? '#FFF7F0' : 'white',
                                color: form.hasLifeInsurance === opt.value ? '#F37021' : '#6b7280',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.9rem',
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <ErrorMsg msg={errors.hasLifeInsurance} />
                        <AnimatePresence>
                          {form.hasLifeInsurance && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ marginTop: '0.875rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.625rem', border: '1px solid #e5e7eb' }}>
                                <label className="form-label" style={{ marginBottom: '0.75rem' }}>Type(s) d'assurance</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem 0.75rem' }}>
                                  {INSURANCE_TYPES.map(type => (
                                    <label key={type} style={{
                                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem', color: '#374151',
                                      padding: '0.25rem 0',
                                    }}>
                                      <input
                                        type="checkbox"
                                        checked={form.lifeInsuranceType.includes(type)}
                                        onChange={() => toggleLifeInsuranceType(type)}
                                        style={{ width: '1.1rem', height: '1.1rem', accentColor: '#F37021', flexShrink: 0 }}
                                      />
                                      {type}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Fade>
                    <Fade delay={0.25}>
                      <div>
                        <label className="form-label">Prime annuelle approximative (DT) *</label>
                        <input
                          className={`form-input${form.annualPremium ? ' filled' : ''}`}
                          type="number"
                          placeholder="Ex: 500"
                          min="0"
                          value={form.annualPremium}
                          onChange={e => set('annualPremium', e.target.value)}
                        />
                        <ErrorMsg msg={errors.annualPremium} />
                      </div>
                    </Fade>
                  </div>
                )}

                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    <Fade delay={0.04}>
                      <div>
                        <h2 style={{ color: '#003B73', fontWeight: 700, fontSize: '1.3rem', margin: '0 0 0.5rem' }}>
                          Raisons de changement
                        </h2>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                          Quelles raisons vous inciteraient à changer de compagnie ? (plusieurs choix possibles)
                        </p>
                      </div>
                    </Fade>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {SWITCH_REASONS_OPTIONS.map((reason, ri) => (
                        <Fade key={reason} delay={0.08 + ri * 0.05}>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.9rem 1rem',
                              borderRadius: '0.625rem',
                              border: form.switchReasons.includes(reason) ? '2px solid #F37021' : '2px solid #e5e7eb',
                              backgroundColor: form.switchReasons.includes(reason) ? '#FFF7F0' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              fontWeight: form.switchReasons.includes(reason) ? 600 : 400,
                              color: form.switchReasons.includes(reason) ? '#F37021' : '#374151',
                              fontSize: '0.9rem',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={form.switchReasons.includes(reason)}
                              onChange={() => toggleSwitchReason(reason)}
                              style={{ width: '1.1rem', height: '1.1rem', accentColor: '#F37021', flexShrink: 0 }}
                            />
                            {reason}
                          </label>
                        </Fade>
                      ))}
                    </div>
                    <ErrorMsg msg={errors.switchReasons} />
                  </div>
                )}

                {step === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    <Fade delay={0.04}>
                      <h2 style={{ color: '#003B73', fontWeight: 700, fontSize: '1.3rem', margin: 0 }}>
                        Contact &amp; Intérêt
                      </h2>
                    </Fade>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {[1, 2, 3, 4].map((ci, i) => (
                        <Fade key={ci} delay={0.08 + i * 0.06}>
                          <Callout configIndex={ci} />
                        </Fade>
                      ))}
                    </div>
                    <Fade delay={0.32}>
                      <div>
                        <label className="form-label">Êtes-vous intéressé(e) par une offre personnalisée ? *</label>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {[{ label: 'Oui, je suis intéressé(e)', value: true }, { label: 'Non merci', value: false }].map(opt => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => { set('interested', opt.value); if (!opt.value) set('phone', '') }}
                              style={{
                                flex: 1,
                                minWidth: '140px',
                                padding: '0.875rem',
                                borderRadius: '0.625rem',
                                border: form.interested === opt.value ? '2px solid #F37021' : '2px solid #e5e7eb',
                                backgroundColor: form.interested === opt.value ? '#FFF7F0' : 'white',
                                color: form.interested === opt.value ? '#F37021' : '#6b7280',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.875rem',
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <ErrorMsg msg={errors.interested} />
                      </div>
                    </Fade>
                    <AnimatePresence>
                      {form.interested && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div>
                            <label className="form-label">Numéro de téléphone *</label>
                            <input
                              className={`form-input${form.phone ? ' filled' : ''}`}
                              type="tel"
                              placeholder="Ex: +216 22 000 000"
                              value={form.phone}
                              onChange={e => set('phone', e.target.value)}
                            />
                            <ErrorMsg msg={errors.phone} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {submitError && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          style={{ padding: '0.875rem 1rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', color: '#EF4444', fontSize: '0.875rem' }}
                        >
                          {submitError}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #f3f4f6',
            gap: '0.75rem',
          }}>
            {step > 0 ? (
              <button className="btn-secondary" onClick={back} type="button">
                <ChevronLeft size={18} />
                Précédent
              </button>
            ) : <div />}
            {step < STEPS.length - 1 ? (
              <button className="btn-primary" onClick={next} type="button">
                Suivant
                <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn-primary" onClick={submit} type="button" disabled={submitting}>
                {submitting ? 'Envoi en cours...' : (
                  <>
                    <Send size={18} />
                    Soumettre
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
