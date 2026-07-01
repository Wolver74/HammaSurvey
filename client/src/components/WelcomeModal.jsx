import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart } from 'lucide-react'

const SESSION_KEY = 'welcome_shown'

const HEARTS = [
  { top: '1rem', left: '1.5rem', size: '1.4rem', opacity: 0.35 },
  { top: '0.6rem', right: '3rem', size: '0.9rem', opacity: 0.25 },
  { top: '2.2rem', right: '1.2rem', size: '0.65rem', opacity: 0.4 },
  { bottom: '0.8rem', left: '2rem', size: '0.75rem', opacity: 0.3 },
  { bottom: '1.2rem', right: '2.5rem', size: '1rem', opacity: 0.25 },
]

export default function WelcomeModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      const t = setTimeout(() => setOpen(true), 300)
      return () => clearTimeout(t)
    }
  }, [])

  const close = () => {
    sessionStorage.setItem(SESSION_KEY, '1')
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              background: 'white',
              borderRadius: '1.75rem',
              maxWidth: '540px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 30px 70px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #8b6914 0%, #c9950a 45%, #e8b830 100%)',
              padding: '2.25rem 2rem 1.75rem',
              textAlign: 'center',
              position: 'relative',
              flexShrink: 0,
            }}>
              {HEARTS.map((s, i) => (
                <span key={i} style={{
                  position: 'absolute',
                  fontSize: s.size,
                  opacity: s.opacity,
                  color: 'white',
                  ...(s.top && { top: s.top }),
                  ...(s.bottom && { bottom: s.bottom }),
                  ...(s.left && { left: s.left }),
                  ...(s.right && { right: s.right }),
                  pointerEvents: 'none',
                }}>♡</span>
              ))}

              <button
                onClick={close}
                aria-label="Fermer"
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255,255,255,0.22)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '2.1rem',
                  height: '2.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.4)')}
                onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
              >
                <X size={15} />
              </button>

              <div style={{ fontSize: '2.75rem', marginBottom: '0.75rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>💍</div>
              <h2 style={{
                color: 'white',
                fontSize: '1.6rem',
                fontWeight: 800,
                margin: 0,
                letterSpacing: '-0.01em',
                textShadow: '0 1px 4px rgba(0,0,0,0.25)',
              }}>
                Bienvenue &amp; Merci ❤️
              </h2>
            </div>

            {/* Body */}
            <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1 }}>
              <p style={{ color: '#78350f', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem' }}>
                Chère famille, chers amis,
              </p>

              <p style={para}>
                Avant tout, merci d'avoir répondu présents pour partager avec nous l'un des plus beaux jours de notre vie. Votre présence, votre affection et vos sourires sont le plus beau cadeau que nous puissions recevoir.
              </p>

              <p style={para}>
                Aujourd'hui marque le début de notre vie à deux, mais également le début d'une nouvelle aventure professionnelle pour moi en tant qu'<strong style={{ color: '#003B73' }}>Agent Général d'Assurance</strong>.
              </p>

              <p style={para}>
                Si vous souhaitez nous témoigner un soutien supplémentaire, je vous invite à consacrer une petite minute pour répondre à ce court questionnaire en scannant le QR Code.
              </p>

              <p style={para}>
                Vos réponses me permettront de mieux comprendre vos besoins. Si je peux vous proposer une solution qui vous apporte une réelle valeur, je prendrai contact avec vous,{' '}
                <em>sans aucun engagement de votre part</em>.
              </p>

              <p style={{ ...para, marginBottom: '1.5rem' }}>
                Votre participation représente un véritable encouragement pour développer mon activité, et je vous en suis profondément reconnaissant.
              </p>

              <div style={{
                background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                border: '1px solid #fcd34d',
                borderRadius: '1rem',
                padding: '1rem 1.25rem',
                marginBottom: '1.75rem',
                textAlign: 'center',
              }}>
                <p style={{ color: '#92400e', fontSize: '0.88rem', lineHeight: 1.75, margin: 0, fontStyle: 'italic' }}>
                  Merci du fond du cœur pour votre confiance, votre soutien et pour avoir fait de cette journée un souvenir inoubliable.
                </p>
              </div>

              <button
                onClick={close}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.9rem 1.5rem' }}
              >
                <Heart size={17} />
                Commencer le questionnaire
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const para = {
  color: '#374151',
  fontSize: '0.875rem',
  lineHeight: 1.8,
  margin: '0 0 0.9rem',
}
