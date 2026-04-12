import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import styles from './Admin.module.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    adminAPI.stats()
      .then(r => setStats(r.data.stats))
      .catch(err => setErro(err.response?.data?.erro || 'Erro ao carregar stats'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Painel Admin</h1>
            <p className={styles.subtitle}>Visão geral do sistema</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/admin/clientes" className={styles.btnPrimary}>
              Gerenciar Clientes →
            </Link>
            <Link to="/admin/vouchers" className={styles.btnPrimary}>
              Gerenciar Vouchers →
            </Link>
          </div>
        </div>

        {loading && <div className={styles.loading}>Carregando...</div>}
        {erro && <div className={styles.erro}>{erro}</div>}

        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.totalUsuarios}</div>
              <div className={styles.statLabel}>Usuários Cadastrados</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.totalMusicas}</div>
              <div className={styles.statLabel}>Certificações Geradas</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum} style={{ color: '#22d3ee' }}>
                {stats.creditosVendidos}
              </div>
              <div className={styles.statLabel}>Créditos Vendidos (Stripe)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum} style={{ color: '#34d399' }}>
                {stats.certificacoes}
              </div>
              <div className={styles.statLabel}>Créditos Consumidos</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum} style={{ color: '#a78bfa' }}>
                {stats.creditosViaVoucher}
              </div>
              <div className={styles.statLabel}>Créditos via Voucher</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum} style={{ color: '#fbbf24' }}>
                R${stats.receitaTotal.toLocaleString('pt-BR')}
              </div>
              <div className={styles.statLabel}>Receita Total (Stripe)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.totalVouchers}</div>
              <div className={styles.statLabel}>Vouchers Criados</div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
