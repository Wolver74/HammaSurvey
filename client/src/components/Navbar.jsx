import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      backgroundColor: '#003B73',
      boxShadow: scrolled
        ? '0 4px 12px -1px rgba(0,0,0,0.35)'
        : '0 1px 3px rgba(0,0,0,0.15)',
      transition: 'box-shadow 0.25s ease',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{ backgroundColor: '#F37021', borderRadius: '0.5rem', padding: '0.5rem', display: 'flex' }}>
            <Shield color="white" size={24} />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.2 }}>Fahmi</div>
            <div style={{ color: '#F37021', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Assurance</div>
          </div>
        </Link>
      </div>
    </nav>
  )
}
