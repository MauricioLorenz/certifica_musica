import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import styles from './Auth.module.css'

export default function ResetSenha() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  if (!token) {
    return (
      <main className={styles.main}>
        <div className={styles.card}>
          <Link to="/" className={styles.brand}>
            Certifica<span className={styles.brandAccent}>Música</span>
          </Link>
          <p style={{ color: 'var(--danger)', textAlign: 'center', margin: 0 }}>
            Link inválido. Solicite um novo na página de login.
          </p>
          <button className={styles.btnSubmit} onClick={() => navigate('/login')}>
            Ir ao login
          </button>
        </div>
      </main>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!novaSenha || !confirmar) return setErro('Preencha todos os campos')
    if (novaSenha !== confirmar) return setErro('As senhas não conferem')
    if (novaSenha.length < 6) return setErro('Senha deve ter pelo menos 6 caracteres')

    setLoading(true)
    try {
      await authAPI.redefinirSenha(token, novaSenha)
      setSucesso(true)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <main className={styles.main}>
        <div className={styles.card}>
          <Link to="/" className={styles.brand}>
            Certifica<span className={styles.brandAccent}>Música</span>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 32 }}>✅</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>Senha redefinida!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Sua senha foi atualizada com sucesso. Faça login com a nova senha.
            </p>
            <button className={styles.btnSubmit} onClick={() => navigate('/login')}>
              Ir ao login
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <Link to="/" className={styles.brand}>
          Certifica<span className={styles.brandAccent}>Música</span>
        </Link>

        <form className={styles.form} onSubmit={handleSubmit}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            Digite sua nova senha abaixo.
          </p>
          <Field label="Nova senha" type="password" value={novaSenha} onChange={setNovaSenha} placeholder="Mínimo 6 caracteres" />
          <Field label="Confirmar nova senha" type="password" value={confirmar} onChange={setConfirmar} placeholder="Repita a senha" />

          {erro && <p className={styles.erro}>{erro}</p>}

          <button className={styles.btnSubmit} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </main>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
      />
    </div>
  )
}
