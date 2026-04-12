import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import styles from './Admin.module.css'

const FORM_VAZIO = { codigo: '', creditos: 1, maxUsos: 1, validade: '' }

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState({ msg: '', tipo: '' })

  const carregar = () => {
    setLoading(true)
    adminAPI.listarVouchers()
      .then(r => setVouchers(r.data.vouchers))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const mostrarFeedback = (msg, tipo = 'ok') => {
    setFeedback({ msg, tipo })
    setTimeout(() => setFeedback({ msg: '', tipo: '' }), 3500)
  }

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }))

  const criarVoucher = async (e) => {
    e.preventDefault()
    setSalvando(true)
    try {
      await adminAPI.criarVoucher({
        codigo: form.codigo.trim().toUpperCase(),
        creditos: Number(form.creditos),
        maxUsos: Number(form.maxUsos),
        validade: form.validade || undefined,
      })
      mostrarFeedback(`Voucher "${form.codigo.toUpperCase()}" criado com sucesso!`)
      setForm(FORM_VAZIO)
      carregar()
    } catch (err) {
      mostrarFeedback(err.response?.data?.erro || 'Erro ao criar voucher', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  const toggle = async (id) => {
    try {
      await adminAPI.toggleVoucher(id)
      carregar()
    } catch (err) {
      mostrarFeedback(err.response?.data?.erro || 'Erro ao atualizar', 'erro')
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Vouchers</h1>
            <p className={styles.subtitle}>Crie e gerencie vouchers de créditos</p>
          </div>
          <Link to="/admin/dashboard" className={styles.btnSecondary}>← Dashboard</Link>
        </div>

        {/* Formulário de criação */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Criar Voucher</h2>
          <form className={styles.form} onSubmit={criarVoucher}>
            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Código *</label>
                <input
                  className={styles.input}
                  placeholder="EX: PROMO2026"
                  value={form.codigo}
                  onChange={e => set('codigo', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Créditos *</label>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  value={form.creditos}
                  onChange={e => set('creditos', e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Usos máximos</label>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  value={form.maxUsos}
                  onChange={e => set('maxUsos', e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Validade (opcional)</label>
                <input
                  className={styles.input}
                  type="date"
                  value={form.validade}
                  onChange={e => set('validade', e.target.value)}
                />
              </div>
            </div>
            {feedback.msg && (
              <div className={feedback.tipo === 'erro' ? styles.erroMsg : styles.successMsg}>
                {feedback.msg}
              </div>
            )}
            <button className={styles.btnPrimary} type="submit" disabled={salvando}>
              {salvando ? 'Criando...' : '+ Criar Voucher'}
            </button>
          </form>
        </div>

        {/* Tabela de vouchers */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Vouchers Existentes</h2>
          {loading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : vouchers.length === 0 ? (
            <p className={styles.empty}>Nenhum voucher criado ainda.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Créditos</th>
                    <th>Usos</th>
                    <th>Validade</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map(v => (
                    <tr key={v.id}>
                      <td><code className={styles.code}>{v.codigo}</code></td>
                      <td>{v.creditos}</td>
                      <td>{v.usosAtuais}/{v.maxUsos}</td>
                      <td>{v.validade ? new Date(v.validade).toLocaleDateString('pt-BR') : '—'}</td>
                      <td>
                        <span className={v.ativo ? styles.badgeAtivo : styles.badgeInativo}>
                          {v.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={v.ativo ? styles.btnDesativar : styles.btnAtivar}
                          onClick={() => toggle(v.id)}
                        >
                          {v.ativo ? 'Desativar' : 'Ativar'}
                        </button>
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
