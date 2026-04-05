import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import styles from './Auth.module.css'

export default function Auth() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') === 'cadastro' ? 'cadastro' : 'login')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState({ email: '', senha: '' })
  const [cadastroForm, setCadastroForm] = useState({ nome: '', email: '', senha: '', confirmar: '' })

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    if (!loginForm.email || !loginForm.senha) return setErro('Preencha todos os campos')
    setLoading(true)
    try {
      const res = await authAPI.login({ email: loginForm.email, senha: loginForm.senha })
      login(res.data.usuario, res.data.token)
      navigate(params.get('redirect') || '/dashboard')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleCadastro = async (e) => {
    e.preventDefault()
    setErro('')
    if (!cadastroForm.nome || !cadastroForm.email || !cadastroForm.senha) return setErro('Preencha todos os campos')
    if (cadastroForm.senha !== cadastroForm.confirmar) return setErro('Senhas não conferem')
    if (cadastroForm.senha.length < 6) return setErro('Senha deve ter pelo menos 6 caracteres')
    setLoading(true)
    try {
      const res = await authAPI.registrar({
        nome: cadastroForm.nome,
        email: cadastroForm.email,
        senha: cadastroForm.senha,
      })
      login(res.data.usuario, res.data.token)
      navigate(params.get('redirect') || '/dashboard')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (t) => { setTab(t); setErro('') }

  return (
    <main className={styles.main}>
      <div className={styles.card}>

        <Link to="/" className={styles.brand}>
          Certifica<span className={styles.brandAccent}>Música</span>
        </Link>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
            onClick={() => switchTab('login')}
          >
            Entrar
          </button>
          <button
            className={`${styles.tab} ${tab === 'cadastro' ? styles.tabActive : ''}`}
            onClick={() => switchTab('cadastro')}
          >
            Criar conta
          </button>
          <div className={styles.tabIndicator} style={{ left: tab === 'login' ? '4px' : 'calc(50% + 0px)' }} />
        </div>

        {tab === 'login' ? (
          <form className={styles.form} onSubmit={handleLogin}>
            <Field label="E-mail" type="email" value={loginForm.email} onChange={v => setLoginForm(f => ({ ...f, email: v }))} placeholder="seu@email.com" />
            <Field label="Senha" type="password" value={loginForm.senha} onChange={v => setLoginForm(f => ({ ...f, senha: v }))} placeholder="••••••••" />

            {erro && <p className={styles.erro}>{erro}</p>}

            <button className={styles.btnSubmit} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Entrar'}
            </button>

            <p className={styles.switchText}>
              Não tem conta?{' '}
              <button type="button" className={styles.switchLink} onClick={() => switchTab('cadastro')}>
                Criar agora
              </button>
            </p>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleCadastro}>
            <Field label="Nome completo" value={cadastroForm.nome} onChange={v => setCadastroForm(f => ({ ...f, nome: v }))} placeholder="Seu nome" />
            <Field label="E-mail" type="email" value={cadastroForm.email} onChange={v => setCadastroForm(f => ({ ...f, email: v }))} placeholder="seu@email.com" />
            <Field label="Senha" type="password" value={cadastroForm.senha} onChange={v => setCadastroForm(f => ({ ...f, senha: v }))} placeholder="Mínimo 6 caracteres" />
            <Field label="Confirmar senha" type="password" value={cadastroForm.confirmar} onChange={v => setCadastroForm(f => ({ ...f, confirmar: v }))} placeholder="Repita a senha" />

            {erro && <p className={styles.erro}>{erro}</p>}

            <button className={styles.btnSubmit} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Criar conta'}
            </button>

            <p className={styles.switchText}>
              Já tem conta?{' '}
              <button type="button" className={styles.switchLink} onClick={() => switchTab('login')}>
                Entrar
              </button>
            </p>
          </form>
        )}
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
        autoComplete={type === 'password' ? 'current-password' : undefined}
      />
    </div>
  )
}
