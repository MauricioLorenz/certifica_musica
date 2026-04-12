import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import styles from './Admin.module.css'

export default function AdminClientes() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados para edição inline
  const [editandoId, setEditandoId] = useState(null)
  const [editForm, setEditForm] = useState({ nome: '', email: '' })
  const [salvando, setSalvando] = useState(false)

  const carregar = () => {
    setLoading(true)
    adminAPI.listarUsuarios()
      .then(r => setUsuarios(r.data.usuarios))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  // Inicia a edição
  const iniciarEdicao = (u) => {
    setEditandoId(u.id)
    setEditForm({ nome: u.nome, email: u.email })
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setEditForm({ nome: '', email: '' })
  }

  const salvarUsuario = async (id) => {
    setSalvando(true)
    try {
      await adminAPI.editarUsuario(id, editForm)
      setEditandoId(null)
      carregar()
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao editar usuário')
    } finally {
      setSalvando(false)
    }
  }

  const excluirUsuario = async (id, email) => {
    if (email === 'mauriciolorenzinvest@gmail.com') {
      return alert('O admin principal não pode ser excluído.')
    }
    
    if (window.confirm('Tem certeza? Isso excluirá o usuário e TODOS os seus créditos e certificados.')) {
      try {
        await adminAPI.excluirUsuario(id)
        carregar()
      } catch (err) {
        alert(err.response?.data?.erro || 'Erro ao excluir usuário')
      }
    }
  }

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
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      {editandoId === u.id ? (
                        <>
                          <td>
                            <input 
                              value={editForm.nome} 
                              onChange={e => setEditForm({...editForm, nome: e.target.value})}
                              className={styles.input} style={{ width: '100%', padding: '4px' }}
                            />
                          </td>
                          <td>
                            <input 
                              value={editForm.email} 
                              onChange={e => setEditForm({...editForm, email: e.target.value})}
                              className={styles.input} style={{ width: '100%', padding: '4px' }}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{u.nome}</td>
                          <td>{u.email}</td>
                        </>
                      )}
                      
                      <td>
                        <span className={u.role === 'admin' ? styles.badgeAtivo : styles.badgeInativo}>
                          {u.role === 'admin' ? 'Admin' : 'Membro'}
                        </span>
                      </td>
                      <td>{u.saldo_creditos}</td>
                      <td>{u.total_musicas}</td>
                      <td>{new Date(u.criadoEm).toLocaleDateString('pt-BR')}</td>
                      
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {editandoId === u.id ? (
                            <>
                              <button disabled={salvando} onClick={() => salvarUsuario(u.id)} className={styles.btnPrimary} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Salvar</button>
                              <button onClick={cancelarEdicao} className={styles.btnSecondary} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Cancelar</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => iniciarEdicao(u)} className={styles.btnAtivar} style={{ padding: '4px 8px' }}>✏️</button>
                              {u.email !== 'mauriciolorenzinvest@gmail.com' && (
                                <button onClick={() => excluirUsuario(u.id, u.email)} className={styles.btnDesativar} style={{ padding: '4px 8px' }}>🗑️</button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
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
