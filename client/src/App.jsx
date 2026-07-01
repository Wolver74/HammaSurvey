import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Survey from './pages/Survey'
import Dashboard from './pages/Dashboard'
import WelcomeModal from './components/WelcomeModal'

export default function App() {
  const location = useLocation()

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
      <WelcomeModal />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Routes location={location}>
            <Route path="/" element={<Survey />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
    </div>
  )
}
