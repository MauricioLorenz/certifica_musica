import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { to: '/', label: 'Início' },
  { to: '/#como-funciona', label: 'Como funciona' },
  { to: '/#beneficios', label: 'Benefícios' },
  { to: '/#para-quem', label: 'Para quem é' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuth } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6v6c0 5.25 3.75 10.14 9 11.29C17.25 22.14 21 17.25 21 12V6l-9-4z" fill="var(--accent-cyan)" opacity=".2" stroke="var(--accent-cyan)" strokeWidth="1.5"/>
              <path d="M9 12.5l2 2 4-4" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>Certifica<span className={styles.logoAccent}>Música</span></span>
        </Link>

        {/* Desktop nav */}
        <ul className={styles.links}>
          {NAV_LINKS.map(l => (
            <li key={l.to}>
              <a href={l.to} className={styles.navLink}>{l.label}</a>
            </li>
          ))}
          {isAuth && (
            <li>
              <Link to="/dashboard" className={`${styles.navLink} ${pathname === '/dashboard' ? styles.active : ''}`}>
                Dashboard
              </Link>
            </li>
          )}
        </ul>

        {/* Desktop actions */}
        <div className={styles.actions}>
          {isAuth ? (
            <>
              <span className={styles.userName}>{user.nome.split(' ')[0]}</span>
              <button className={styles.btnEntrar} onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.btnEntrar}>Entrar</Link>
              <Link to="/login?tab=cadastro" className={styles.btnCriar}>Criar conta</Link>
            </>
          )}
          <Link to="/registrar" className={styles.btnRegistrar}>+ Certificar</Link>
        </div>

        {/* Hamburger */}
        <button
          className={`${styles.hamburger} ${open ? styles.hamburgerOpen : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}>
        {NAV_LINKS.map(l => (
          <a key={l.to} href={l.to} className={styles.drawerLink}>{l.label}</a>
        ))}
        {isAuth && (
          <Link to="/dashboard" className={styles.drawerLink}>Dashboard</Link>
        )}
        <div className={styles.drawerDivider} />
        <Link to="/registrar" className={styles.drawerBtn}>+ Certificar Música</Link>
        <div className={styles.drawerDivider} />
        {isAuth ? (
          <div className={styles.drawerUser}>
            <span className={styles.drawerUserName}>{user.nome}</span>
            <button className={styles.drawerLogout} onClick={handleLogout}>Sair</button>
          </div>
        ) : (
          <div className={styles.drawerAuthRow}>
            <Link to="/login" className={styles.drawerEntrar}>Entrar</Link>
            <Link to="/login?tab=cadastro" className={styles.drawerCriar}>Criar conta</Link>
          </div>
        )}
      </div>

      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}
    </nav>
  )
}
