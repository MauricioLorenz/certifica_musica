import s from './Step.module.css'

const PAGAMENTOS = [
  { value: 'PIX', label: 'Pix', icon: '⚡' },
  { value: 'Débito', label: 'Débito', icon: '💳' },
  { value: 'Crédito', label: 'Crédito', icon: '🏦' },
]

export default function StepPagamento({ data, onChange }) {
  const set = (field, val) => onChange({ ...data, [field]: val })

  return (
    <div className={s.step}>
      <div className={s.stepTitle}>
        <span className={s.stepNum}>4</span>
        <div>
          <h2 className={s.title}>Pagamento</h2>
          <p className={s.sub}>Escolha a forma de pagamento para finalizar</p>
        </div>
      </div>

      <div className={s.field}>
        <label className={s.label}>Forma de Pagamento *</label>
        <div className={s.payGrid}>
          {PAGAMENTOS.map(p => (
            <label key={p.value} className={`${s.payCard} ${data.formaPagamento === p.value ? s.payActive : ''}`}>
              <input type="radio" name="pagamento" value={p.value} checked={data.formaPagamento === p.value} onChange={() => set('formaPagamento', p.value)} style={{ display: 'none' }} />
              <span className={s.payIcon}>{p.icon}</span>
              <span className={s.payLabel}>{p.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={s.divider} />

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
        🔒 Após o pagamento confirmado, seus dados serão <strong>registrados de forma imutável na blockchain Ethereum</strong> e armazenados no IPFS via Lighthouse.
      </div>
    </div>
  )
}
