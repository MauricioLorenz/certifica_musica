import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import styles from './Admin.module.css'

export default function AdminClientes() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = () => {
    setLoading(true)
    adminAPI.listarUsuarios()
      .then(r => setUsuarios(r.data.usuarios))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Clientes Certifica</h1>
            <p className={styles.subtitle}>Gerencie os usuários e veja seus saldos de créditos</p>
          </div>
          <Link to="/admin/dashboard" className={styles.btnSecondary}>← Dashboard</Link>
        </div>

        {/* Tabela de Clientes */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Lista de Clientes</h2>
          {loading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : usuarios.length === 0 ? (
            <p className={styles.empty}>Nenhum cliente cadastrado.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Saldo Créditos</th>
                    <th>Certificações Geradas</th>
                    <th>Data Entrada</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>{u.nome}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={u.role === 'admin' ? styles.badgeAtivo : styles.badgeInativo}>
                          {u.role === 'admin' ? 'Admin' : 'Membro'}
                        </span>
                      </td>
                      <td>{u.saldo_creditos}</td>
                      <td>{u.total_musicas}</td>
                      <td>{new Date(u.criadoEm).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
