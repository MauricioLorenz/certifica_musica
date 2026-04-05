import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { musicasAPI } from '../services/api'
import styles from './Home.module.css'

const TRUST_ITEMS = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    text: 'Tecnologia Blockchain de nível global',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    text: 'Segurança jurídica para sua obra',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    text: 'Reconhecimento em negociações e contratos',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 20h16M4 4h16M9 4v16M15 4v16"/></svg>,
    text: 'Armazenamento seguro e rastreável',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    text: 'Milhares de artistas já registrando suas obras',
  },
]

const STEPS = [
  {
    num: '1',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    title: 'Envie sua música',
    desc: 'Faça o upload da sua obra em poucos segundos. Aceitamos diversos formatos de áudio.',
  },
  {
    num: '2',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    title: 'Geramos seu certificado',
    desc: 'Sua obra é registrada em blockchain e você recebe um certificado digital único e verificável.',
  },
  {
    num: '3',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Comprove sua autoria sempre que precisar',
    desc: 'Valide sua autoria publicamente, negocie com confiança e proteja seus direitos no tempo.',
  },
]

const PARA_QUEM = ['Compositores', 'Cantores', 'Produtores', 'Bandas', 'Editoras', 'Gestores de catálogo']

export default function Home() {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    musicasAPI.listar().then(r => setTotal(r.data.total || 0)).catch(() => {})
  }, [])

  return (
    <main className={styles.main}>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          {/* Left */}
          <div className={styles.heroLeft}>
            <div className={styles.badge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Registro oficial via blockchain
            </div>

            <h1 className={styles.heroTitle}>
              Sua música<br />tem valor.<br />
              <span className={styles.heroTitleBlue}>Aqui, ela tem prova.</span>
            </h1>

            <p className={styles.heroSub}>
              Registre suas obras com segurança, comprove sua autoria
              e proteja o que você criou para o mundo.
            </p>

            <div className={styles.heroBadges}>
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> 100% Digital</span>
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Registro Imutável</span>
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Validade Comprovada</span>
            </div>

            <div className={styles.heroBtns}>
              <Link to="/registrar" className={styles.btnPrimary}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
                Certificar minha música agora
              </Link>
              <a href="#como-funciona" className={styles.btnGhost}>
                <span className={styles.playCircle}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </span>
                Ver como funciona
              </a>
            </div>
          </div>

          {/* Right — Certificate mockup */}
          <div className={styles.heroRight}>
            <div className={styles.certGlow} />
            <div className={styles.certCard}>
              <div className={styles.certHeader}>
                <div className={styles.certLogo}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 6v6c0 5.25 3.75 10.14 9 11.29C17.25 22.14 21 17.25 21 12V6l-9-4z" fill="var(--accent-cyan)" opacity=".25" stroke="var(--accent-cyan)" strokeWidth="1.5"/>
                    <path d="M9 12.5l2 2 4-4" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className={styles.certBrand}>CERTIFICA</div>
                  <div className={styles.certBrandSub}>A MÚSICA</div>
                </div>
              </div>

              <div className={styles.certTitle}>CERTIFICADO<br />DE REGISTRO</div>
              <div className={styles.certSub}>AUTORIA COMPROVADA<br />EM BLOCKCHAIN</div>

              <div className={styles.certFields}>
                <div className={styles.certRow}>
                  <span className={styles.certLabel}>Título:</span>
                  <span className={styles.certVal}>Minha Canção</span>
                </div>
                <div className={styles.certRow}>
                  <span className={styles.certLabel}>Autor:</span>
                  <span className={styles.certVal}>Seu Nome</span>
                </div>
                <div className={styles.certRow}>
                  <span className={styles.certLabel}>Data:</span>
                  <span className={styles.certVal}>{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <div className={styles.certRow}>
                  <span className={styles.certLabel}>Código:</span>
                  <span className={styles.certVal}>CM-9F3A-KL8D-21B7</span>
                </div>
              </div>

              <div className={styles.certFooter}>
                <div className={styles.certSig}>✍ Assinatura Digital</div>
                <div className={styles.certQr}>
                  <div className={styles.qrGrid}>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className={styles.qrDot} style={{ opacity: Math.random() > 0.4 ? 1 : 0.15 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating tags */}
            <div className={`${styles.floatTag} ${styles.floatTag1}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Registro Imutável
            </div>
            <div className={`${styles.floatTag} ${styles.floatTag2}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/></svg>
              Verificação Pública
            </div>
            <div className={`${styles.floatTag} ${styles.floatTag3}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Autoria Comprovada
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────── */}
      <section className={styles.trustBar}>
        <p className={styles.trustTitle}>TECNOLOGIA. CONFIANÇA. FUTURO DA SUA MÚSICA.</p>
        <div className={styles.trustItems}>
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} className={styles.trustItem}>
              <span className={styles.trustIcon}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────── */}
      <section className={styles.sectionWrap} id="como-funciona">
        <div className={styles.sectionInner}>
          <div className={styles.comoFunciona}>
            <div className={styles.comoLeft}>
              <span className={styles.pill}>COMO FUNCIONA</span>
              <h2 className={styles.comoTitle}>Em 3 passos sua música está protegida.</h2>
              <p className={styles.comoSub}>Um processo simples, rápido e 100% online para garantir o que é seu por direito.</p>
            </div>
            <div className={styles.comoSteps}>
              {STEPS.map(step => (
                <div key={step.num} className={styles.stepCard}>
                  <div className={styles.stepCircle}>
                    <span className={styles.stepIcon}>{step.icon}</span>
                    <span className={styles.stepNum}>{step.num}</span>
                  </div>
                  <div>
                    <h4 className={styles.stepTitle}>{step.title}</h4>
                    <p className={styles.stepDesc}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA QUEM É ──────────────────────────────── */}
      <section className={styles.paraQuemWrap} id="para-quem">
        <div className={styles.sectionInner}>
          <div className={styles.paraQuem}>
            <div className={styles.paraQuemContent}>
              <span className={styles.pill}>PARA QUEM É</span>
              <h2 className={styles.paraQuemTitle}>Feito para quem cria.</h2>
              <ul className={styles.paraQuemList}>
                {PARA_QUEM.map(item => (
                  <li key={item}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.paraQuemCta}>
                Se você cria música, você precisa proteger o que é seu.
              </p>
            </div>
            <div className={styles.paraQuemRight} id="beneficios">
              <div className={styles.benefCard}>
                <div className={styles.benefIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <h4>Instantâneo</h4>
                <p>Registro em segundos, verificável por qualquer pessoa globalmente.</p>
              </div>
              <div className={styles.benefCard}>
                <div className={styles.benefIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h4>Imutável</h4>
                <p>Dados gravados na blockchain Ethereum — ninguém pode alterar ou apagar.</p>
              </div>
              <div className={styles.benefCard}>
                <div className={styles.benefIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <h4>Transparente</h4>
                <p>Auditável publicamente. Qualquer pessoa pode verificar a autenticidade.</p>
              </div>
              <div className={styles.benefCard}>
                <div className={styles.benefIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <h4>Descentralizado</h4>
                <p>Armazenado no IPFS — sem servidores centrais, sem ponto único de falha.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BAR ──────────────────────────────────── */}
      <section className={styles.ctaBar}>
        <div className={styles.ctaBarInner}>
          <div className={styles.ctaBarLeft}>
            <div className={styles.ctaBarIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.ctaBarTitle}>Não basta criar.<br /><strong>É preciso provar que é seu.</strong></h3>
            </div>
          </div>
          <p className={styles.ctaBarSub}>Certifique sua obra e transforme sua música em um ativo seguro e pronto para gerar oportunidades.</p>
          <Link to="/registrar" className={styles.ctaBarBtn}>
            Começar agora
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{total > 0 ? `+${total}` : '+15 mil'}</span>
            <span className={styles.statLabel}>obras registradas</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>+7 mil</span>
            <span className={styles.statLabel}>artistas protegidos</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>99,9%</span>
            <span className={styles.statLabel}>de registros válidos</span>
          </div>
          <div className={styles.statItem}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className={styles.statLabel}>Segurança de nível global</span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Certifica Música · Registro de Obras Musicais na Blockchain · Powered by Ethereum & IPFS</p>
      </footer>
    </main>
  )
}
