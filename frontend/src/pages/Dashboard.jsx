import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { musicasAPI } from '../services/api'
import { gerarComprovante } from '../services/gerarComprovante'
import { useAuth } from '../context/AuthContext'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { isAuth, user } = useAuth()
  const [musicas, setMusicas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [deletando, setDeletando] = useState(null)
  const [baixando, setBaixando] = useState(null)

  const carregar = () => {
    setLoading(true)
    musicasAPI.listar()
      .then(r => setMusicas(r.data.data || []))
      .catch(() => setMusicas([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (isAuth) carregar(); else setLoading(false) }, [isAuth])

  const baixarComprovante = async (musica) => {
    setBaixando(musica.id)
    await gerarComprovante(musica).catch(() => {})
    setBaixando(null)
  }

  const deletar = async (id) => {
    if (!confirm('Remover esta música?')) return
    setDeletando(id)
    await musicasAPI.deletar(id).catch(() => {})
    carregar()
    setDeletando(null)
  }

  const filtradas = musicas.filter(m =>
    m.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    m.compositor?.toLowerCase().includes(busca.toLowerCase())
  )

  const shortHash = (hash) => hash ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : '—'

  if (!isAuth) return (
    <main className={styles.main}>
      <div className={styles.authWall}>
        <div className={styles.authWallIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className={styles.authWallTitle}>Acesso restrito</h2>
        <p className={styles.authWallSub}>Faça login para ver suas obras registradas na blockchain.</p>
        <div className={styles.authWallBtns}>
          <Link to="/login" className={styles.btnNew}>Entrar</Link>
          <Link to="/login?tab=cadastro" className={styles.btnOutline}>Criar conta</Link>
        </div>
      </div>
    </main>
  )

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Olá, {user.nome.split(' ')[0]} — suas obras registradas na blockchain</p>
          </div>
          <a href="/registrar" className={styles.btnNew}>+ Nova Música</a>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statNum}>{musicas.length}</div>
            <div className={styles.statLabel}>Total Registradas</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNum} style={{ color: 'var(--success)' }}>
              {musicas.filter(m => m.status === 'Validado').length}
            </div>
            <div className={styles.statLabel}>Validadas</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNum} style={{ color: 'var(--accent-yellow)' }}>
              {musicas.filter(m => m.txHash).length}
            </div>
            <div className={styles.statLabel}>Com TxHash</div>
          </div>
        </div>

        {/* Busca */}
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Buscar por título ou compositor..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {/* Tabela */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Carregando músicas...</span>
          </div>
        ) : filtradas.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🎵</div>
            <p>Nenhuma música encontrada</p>
            <a href="/registrar" className={styles.btnNew}>Registrar primeira música</a>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Gênero</th>
                  <th>TxHash</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(m => (
                  <tr key={m.id}>
                    <td data-label="ID"><span className={styles.idBadge}>{m.id}</span></td>
                    <td data-label="Título" className={styles.titulo}>{m.titulo}</td>
                    <td data-label="Gênero">{m.genero || '—'}</td>
                    <td data-label="TxHash">
                      <span className={styles.hash} title={m.txHash}>
                        {shortHash(m.txHash)}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`${styles.badge} ${styles[m.status?.toLowerCase()]}`}>
                        {m.status}
                      </span>
                    </td>
                    <td data-label="Data" className={styles.date}>
                      {m.criadoEm ? new Date(m.criadoEm).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td data-label="Ações" className={styles.acoes}>
                      <button
                        className={styles.btnVerify}
                        onClick={() => navigate(`/verificar?id=${m.id}`)}
                        title="Ver dados públicos"
                      >
                        🔍
                      </button>
                      <button
                        className={styles.btnDownload}
                        onClick={() => baixarComprovante(m)}
                        disabled={baixando === m.id}
                        title="Baixar comprovante"
                      >
                        {baixando === m.id ? '...' : '📄'}
                      </button>
                      <button
                        className={styles.btnDelete}
                        onClick={() => deletar(m.id)}
                        disabled={deletando === m.id}
                      >
                        {deletando === m.id ? '...' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
