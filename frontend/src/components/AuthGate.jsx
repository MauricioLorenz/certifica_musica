import { useState } from 'react'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import s from './AuthGate.module.css'

export default function AuthGate() {
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const { login } = useAuth()

  const [loginForm, setLoginForm] = useState({ email: '', senha: '' })
  const [cadForm, setCadForm] = useState({ nome: '', email: '', senha: '', confirmar: '' })

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    if (!loginForm.email || !loginForm.senha) return setErro('Preencha todos os campos')
    setLoading(true)
    try {
      const res = await authAPI.login({ email: loginForm.email, senha: loginForm.senha })
      login(res.data.usuario, res.data.token)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleCadastro = async (e) => {
    e.preventDefault()
    setErro('')
    if (!cadForm.nome || !cadForm.email || !cadForm.senha) return setErro('Preencha todos os campos')
    if (cadForm.senha !== cadForm.confirmar) return setErro('Senhas não conferem')
    if (cadForm.senha.length < 6) return setErro('Senha deve ter pelo menos 6 caracteres')
    setLoading(true)
    try {
      const res = await authAPI.registrar({ nome: cadForm.nome, email: cadForm.email, senha: cadForm.senha })
      login(res.data.usuario, res.data.token)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (t) => { setTab(t); setErro('') }

  return (
    <div className={s.gate}>
      <div className={s.icon}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <div className={s.heading}>
        <h3 className={s.title}>Identifique-se para continuar</h3>
        <p className={s.sub}>
          Suas obras ficam vinculadas à sua conta. <br />
          Após o login, você volta exatamente aqui.
        </p>
      </div>

      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'login' ? s.tabActive : ''}`} onClick={() => switchTab('login')}>
          Entrar
        </button>
        <button className={`${s.tab} ${tab === 'cadastro' ? s.tabActive : ''}`} onClick={() => switchTab('cadastro')}>
          Criar conta
        </button>
        <div className={s.tabIndicator} style={{ left: tab === 'login' ? '4px' : 'calc(50%)' }} />
      </div>

      {tab === 'login' ? (
        <form className={s.form} onSubmit={handleLogin}>
          <GateField label="E-mail" type="email" value={loginForm.email} onChange={v => setLoginForm(f => ({ ...f, email: v }))} placeholder="seu@email.com" />
          <GateField label="Senha" type="password" value={loginForm.senha} onChange={v => setLoginForm(f => ({ ...f, senha: v }))} placeholder="••••••••" />
          {erro && <p className={s.erro}>{erro}</p>}
          <button className={s.btn} disabled={loading}>
            {loading ? <span className={s.spinner} /> : 'Entrar e continuar'}
          </button>
          <p className={s.switch}>
            Sem conta?{' '}
            <button type="button" className={s.switchLink} onClick={() => switchTab('cadastro')}>Criar agora</button>
          </p>
        </form>
      ) : (
        <form className={s.form} onSubmit={handleCadastro}>
          <GateField label="Nome completo" value={cadForm.nome} onChange={v => setCadForm(f => ({ ...f, nome: v }))} placeholder="Seu nome" />
          <GateField label="E-mail" type="email" value={cadForm.email} onChange={v => setCadForm(f => ({ ...f, email: v }))} placeholder="seu@email.com" />
          <div className={s.row2}>
            <GateField label="Senha" type="password" value={cadForm.senha} onChange={v => setCadForm(f => ({ ...f, senha: v }))} placeholder="Mín. 6 caracteres" />
            <GateField label="Confirmar" type="password" value={cadForm.confirmar} onChange={v => setCadForm(f => ({ ...f, confirmar: v }))} placeholder="Repita" />
          </div>
          {erro && <p className={s.erro}>{erro}</p>}
          <button className={s.btn} disabled={loading}>
            {loading ? <span className={s.spinner} /> : 'Criar conta e continuar'}
          </button>
          <p className={s.switch}>
            Já tem conta?{' '}
            <button type="button" className={s.switchLink} onClick={() => switchTab('login')}>Entrar</button>
          </p>
        </form>
      )}
    </div>
  )
}

function GateField({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className={s.field}>
      <label className={s.label}>{label}</label>
      <input className={s.input} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}
