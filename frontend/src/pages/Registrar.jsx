import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function validarCPF(cpf) {
  const n = cpf.replace(/\D/g, '')
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += +n[i] * (10 - i)
  let d1 = (s * 10) % 11; if (d1 >= 10) d1 = 0
  if (d1 !== +n[9]) return false
  s = 0
  for (let i = 0; i < 10; i++) s += +n[i] * (11 - i)
  let d2 = (s * 10) % 11; if (d2 >= 10) d2 = 0
  return d2 === +n[10]
}

function validarCNPJ(cnpj) {
  const n = cnpj.replace(/\D/g, '')
  if (n.length !== 14 || /^(\d)\1{13}$/.test(n)) return false
  const calc = (len, w) => {
    let s = 0; for (let i = 0; i < len; i++) s += +n[i] * w[i]
    const r = s % 11; return r < 2 ? 0 : 11 - r
  }
  return calc(12,[5,4,3,2,9,8,7,6,5,4,3,2]) === +n[12] && calc(13,[6,5,4,3,2,9,8,7,6,5,4,3,2]) === +n[13]
}
import { musicasAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StepObra from '../components/registro/StepObra'
import StepAutores from '../components/registro/StepAutores'
import StepArquivos from '../components/registro/StepArquivos'
import StepPagamento from '../components/registro/StepPagamento'
import AuthGate from '../components/AuthGate'
import styles from './Registrar.module.css'

const STEPS = ['Dados da Obra', 'Autores', 'Arquivos', 'Pagamento']

const AUTOR_VAZIO = {
  tipoPessoa: 'Física', nomeCompleto: '', cpfCnpj: '', rg: '', rgOrgao: '',
  dataNascimento: '', naturalidade: '', pseudonimo: '', ocupacao: '', endereco: '',
  menorIdade: false,
  representante: { nome: '', rg: '', rgOrgao: '', cpf: '', parentesco: 'Pai' }
}

export default function Registrar() {
  const navigate = useNavigate()
  const { isAuth } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')

  const [obra, setObra] = useState({
    titulo: '', genero: 'Música', estadoObra: 'Inédita',
    totalPaginas: '', tipoComposicao: 'Obra original', coletanea: false
  })

  const [autores, setAutores] = useState([{ ...AUTOR_VAZIO }])

  const [arquivos, setArquivos] = useState({
    arquivoLetra: null, arquivoObra: null, arquivoIdentidade: null,
    arquivoComplementar: null, descricaoComplementar: ''
  })

  const [pagamento, setPagamento] = useState({
    formaPagamento: 'PIX', termoAceito: false
  })

  const validarStep = () => {
    setErro('')
    if (step === 0) {
      if (!obra.titulo.trim()) { setErro('Título da obra é obrigatório.'); return false }
      if (!obra.totalPaginas) { setErro('Número de páginas é obrigatório.'); return false }
    }
    if (step === 1) {
      for (let i = 0; i < autores.length; i++) {
        const a = autores[i]
        if (!a.nomeCompleto.trim()) { setErro(`Nome do autor ${i + 1} é obrigatório.`); return false }
        if (!a.cpfCnpj.trim()) { setErro(`CPF/CNPJ do autor ${i + 1} é obrigatório.`); return false }
        const digits = a.cpfCnpj.replace(/\D/g, '')
        if (a.tipoPessoa === 'Física' && digits.length === 11) {
          if (!validarCPF(a.cpfCnpj)) { setErro(`CPF do autor ${i + 1} é inválido.`); return false }
        } else if (a.tipoPessoa === 'Jurídica' && digits.length === 14) {
          if (!validarCNPJ(a.cpfCnpj)) { setErro(`CNPJ do autor ${i + 1} é inválido.`); return false }
        }
      }
    }
    if (step === 2) {
      if (!arquivos.arquivoLetra) { setErro('A letra da música (PDF) é obrigatória.'); return false }
      if (!arquivos.arquivoObra) { setErro('A partitura (PDF) é obrigatória.'); return false }
      if (!arquivos.arquivoIdentidade) { setErro('O documento de identidade (PDF) é obrigatório.'); return false }
    }
    if (step === 3) {
      if (!pagamento.termoAceito) { setErro('Você deve aceitar o termo de declaração.'); return false }
    }
    return true
  }

  const avancar = () => { if (validarStep()) setStep(s => s + 1) }
  const voltar = () => { setErro(''); setStep(s => s - 1) }

  const submeter = async () => {
    if (!validarStep()) return
    setLoading(true)
    setErro('')
    try {
      const fd = new FormData()
      Object.entries(obra).forEach(([k, v]) => fd.append(k, v))
      fd.append('autores', JSON.stringify(autores))
      if (arquivos.arquivoLetra) fd.append('arquivoLetra', arquivos.arquivoLetra)
      if (arquivos.arquivoObra) fd.append('arquivoObra', arquivos.arquivoObra)
      if (arquivos.arquivoIdentidade) fd.append('arquivoIdentidade', arquivos.arquivoIdentidade)
      if (arquivos.arquivoComplementar) fd.append('arquivoComplementar', arquivos.arquivoComplementar)
      if (arquivos.descricaoComplementar) fd.append('descricaoComplementar', arquivos.descricaoComplementar)
      fd.append('formaPagamento', pagamento.formaPagamento)
      fd.append('termoAceito', pagamento.termoAceito)

      const res = await musicasAPI.criar(fd)
      setResultado(res.data.data)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao registrar. Verifique se o backend está rodando.')
    } finally {
      setLoading(false)
    }
  }

  if (resultado) return <Sucesso resultado={resultado} onNovo={() => { setResultado(null); setStep(0) }} onDash={() => navigate('/dashboard')} />

  return (
    <main className={styles.main}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.badge}>⛓️ Registro de Direitos Autorais</span>
          <h1 className={styles.title}>Registrar Obra Musical</h1>
          <p className={styles.subtitle}>Preencha todas as informações para gerar o certificado imutável na blockchain.</p>
        </div>

        {/* Progress */}
        <div className={styles.progress}>
          {STEPS.map((label, i) => (
            <div key={i} className={`${styles.progressStep} ${i === step ? styles.progressActive : ''} ${i < step ? styles.progressDone : ''}`}>
              <div className={styles.progressDot}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={styles.progressLabel}>{label}</span>
              {i < STEPS.length - 1 && <div className={`${styles.progressLine} ${i < step ? styles.progressLineDone : ''}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className={styles.card}>
          {step === 0 && <StepObra data={obra} onChange={setObra} />}
          {step === 1 && <StepAutores autores={autores} onChange={setAutores} autorVazio={AUTOR_VAZIO} />}
          {step === 2 && <StepArquivos data={arquivos} onChange={setArquivos} />}
          {step === 3 && (isAuth
            ? <StepPagamento data={pagamento} onChange={setPagamento} />
            : <AuthGate />
          )}

          {erro && <div className={styles.erro}>⚠️ {erro}</div>}

          {!(step === 3 && !isAuth) && (
            <div className={styles.navBtns}>
              {step > 0 && (
                <button className={styles.btnBack} onClick={voltar} disabled={loading}>← Voltar</button>
              )}
              <div style={{ flex: 1 }} />
              {step < STEPS.length - 1 ? (
                <button className={styles.btnNext} onClick={avancar}>Continuar →</button>
              ) : (
                <button className={styles.btnSubmit} onClick={submeter} disabled={loading}>
                  {loading ? <><span className={styles.spinner} /> Registrando...</> : 'Registrar na Blockchain'}
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}

function Sucesso({ resultado, onNovo, onDash }) {
  return (
    <main style={{ paddingTop: 68, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✅</div>
        <h2 className={styles.successTitle}>Obra Registrada!</h2>
        <p className={styles.successSub}>Certificado imutável gerado na Ethereum com sucesso.</p>

        <div className={styles.resultGrid}>
          <ResultItem label="ID do Registro" value={resultado.id} />
          <ResultItem label="Título" value={resultado.titulo} />
          <ResultItem label="Gênero" value={resultado.genero} />
          <ResultItem label="Estado" value={resultado.estadoObra} />
          <ResultItem label="Pagamento" value={resultado.formaPagamento} />
          <ResultItem label="Status" value={resultado.status} green />
          <ResultItem label="CID IPFS" value={resultado.cid} mono full />
          <ResultItem label="TxHash Blockchain" value={resultado.txHash} mono full />
        </div>

        <div className={styles.successBtns}>
          <button className={styles.btnOutline} onClick={onNovo}>Registrar outra</button>
          <button className={styles.btnPrimary} onClick={onDash}>Ver Dashboard →</button>
        </div>
      </div>
    </main>
  )
}

function ResultItem({ label, value, green, mono, full }) {
  return (
    <div className={styles.resultItem} style={full ? { gridColumn: '1 / -1' } : {}}>
      <span className={styles.resultLabel}>{label}</span>
      <span className={`${styles.resultValue} ${green ? styles.green : ''} ${mono ? styles.mono : ''}`}>{value}</span>
    </div>
  )
}
