import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { creditosAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import s from './Step.module.css'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

const CARD_STYLE = {
  style: {
    base: {
      color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif',
      fontSize: '15px',
      '::placeholder': { color: '#64748b' },
    },
    invalid: { color: '#f87171' },
  },
}

// ─── Formulário de pagamento (dentro do Elements provider) ────────────────────
function FormaPagamento({ onSucesso }) {
  const stripe = useStripe()
  const elements = useElements()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const pagar = async () => {
    if (!stripe || !elements) return
    setCarregando(true)
    setErro('')

    try {
      const { data } = await creditosAPI.criarIntencao()
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      })

      if (result.error) {
        setErro(result.error.message)
        setCarregando(false)
        return
      }

      // Pagamento confirmado pelo Stripe — aguarda webhook processar (polling)
      let tentativas = 0
      const poll = async () => {
        tentativas++
        try {
          const r = await creditosAPI.saldo()
          if (r.data.saldo >= 1) {
            onSucesso()
            return
          }
        } catch (_) {}

        if (tentativas < 6) {
          setTimeout(poll, 1500)
        } else {
          setErro('Crédito em processamento. Atualize a página em instantes.')
          setCarregando(false)
        }
      }
      poll()
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao processar pagamento')
      setCarregando(false)
    }
  }

  return (
    <div className={s.stripeWrap}>
      <div className={s.stripeField}>
        <CardElement options={CARD_STYLE} />
      </div>
      {erro && <p className={s.erroMsg}>{erro}</p>}
      <button
        type="button"
        className={s.btnPagar}
        onClick={pagar}
        disabled={carregando || !stripe}
      >
        {carregando ? 'Processando...' : 'Pagar R$40,00 — 1 Crédito'}
      </button>
    </div>
  )
}

// ─── Input de voucher ─────────────────────────────────────────────────────────
function VoucherInput({ onSucesso }) {
  const [codigo, setCodigo] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const resgatar = async () => {
    if (!codigo.trim()) return
    setCarregando(true)
    setErro('')
    try {
      await creditosAPI.resgatarVoucher(codigo.trim())
      onSucesso()
    } catch (err) {
      setErro(err.response?.data?.erro || 'Voucher inválido')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={s.voucherRow}>
      <input
        className={s.voucherInput}
        placeholder="Código do voucher"
        value={codigo}
        onChange={e => setCodigo(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && resgatar()}
      />
      <button
        type="button"
        className={s.btnVoucher}
        onClick={resgatar}
        disabled={carregando || !codigo.trim()}
      >
        {carregando ? '...' : 'Resgatar'}
      </button>
      {erro && <p className={s.erroMsg}>{erro}</p>}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function StepPagamento({ data, onChange }) {
  const { isAuth } = useAuth()
  const set = (field, val) => onChange({ ...data, [field]: val })

  const [saldo, setSaldo] = useState(null) // null = carregando
  const [mostrarVoucher, setMostrarVoucher] = useState(false)

  const carregarSaldo = () => {
    if (!isAuth) { setSaldo(0); return }
    creditosAPI.saldo()
      .then(r => setSaldo(r.data.saldo))
      .catch(() => setSaldo(0))
  }

  useEffect(() => { carregarSaldo() }, [isAuth])

  const onCreditoAdicionado = () => {
    carregarSaldo()
    setMostrarVoucher(false)
  }

  return (
    <div className={s.step}>
      <div className={s.stepTitle}>
        <span className={s.stepNum}>4</span>
        <div>
          <h2 className={s.title}>Pagamento</h2>
          <p className={s.sub}>1 crédito = R$40,00 = 1 certificação na blockchain</p>
        </div>
      </div>

      {/* ── Bloco de créditos ── */}
      {saldo === null ? (
        <div className={s.creditoLoading}>Verificando créditos...</div>
      ) : saldo >= 1 ? (
        <div className={s.creditoBox}>
          <div className={s.creditoIcone}>✅</div>
          <div>
            <div className={s.creditoTitulo}>
              Você tem <strong>{saldo} crédito{saldo > 1 ? 's' : ''}</strong>
            </div>
            <div className={s.creditoSub}>1 crédito será consumido ao finalizar o registro.</div>
          </div>
        </div>
      ) : (
        <div className={s.semCredito}>
          <p className={s.semCreditoMsg}>Você não tem créditos. Adquira abaixo para certificar:</p>

          <Elements stripe={stripePromise}>
            <FormaPagamento onSucesso={onCreditoAdicionado} />
          </Elements>
        </div>
      )}

      {/* ── Voucher (sempre disponível para adicionar mais créditos) ── */}
      {saldo !== null && (
        <div className={s.voucherSection}>
          <button
            type="button"
            className={s.btnToggleVoucher}
            onClick={() => setMostrarVoucher(v => !v)}
          >
            {mostrarVoucher ? '▲ Fechar voucher' : '🎟 Tenho um código de voucher'}
          </button>
          {mostrarVoucher && (
            <VoucherInput onSucesso={onCreditoAdicionado} />
          )}
        </div>
      )}

      <div className={s.divider} />

      {/* ── Termo de declaração ── */}
      <div className={s.termoBox}>
        <h4 className={s.termoTitle}>📜 Termo de Declaração</h4>
        <p className={s.termoText}>
          Declaro, sob as penas da lei, que sou o legítimo autor da obra intelectual descrita neste requerimento,
          que as informações prestadas são verdadeiras e que não estou infringindo direitos de terceiros.
          Estou ciente de que a falsidade das informações prestadas implicará nas sanções previstas no art. 299 do Código Penal Brasileiro.
        </p>
        <label className={`${s.checkboxRow} ${s.termoCheck}`}>
          <input
            type="checkbox"
            checked={data.termoAceito}
            onChange={e => set('termoAceito', e.target.checked)}
          />
          <span>Li e aceito o <strong>Termo de Declaração</strong> acima, confirmando a veracidade dos dados e a autoria da obra.</span>
        </label>
      </div>

      <div className={s.alertInfo}>
        🔒 Após a confirmação, seus dados serão <strong>registrados de forma imutável na blockchain Ethereum</strong> e armazenados no IPFS.
      </div>
    </div>
  )
}
