import s from './Step.module.css'

export default function StepArquivos({ data, onChange }) {
  const set = (field, val) => onChange({ ...data, [field]: val })

  return (
    <div className={s.step}>
      <div className={s.stepTitle}>
        <span className={s.stepNum}>3</span>
        <div>
          <h2 className={s.title}>Upload de Arquivos</h2>
          <p className={s.sub}>Todos os arquivos devem estar em formato PDF</p>
        </div>
      </div>

      <UploadField
        label="Documentação de Identidade *"
        info="PDF do CPF (Pessoa Física) ou CNPJ (Pessoa Jurídica) de todos os autores."
        icon="🪪"
        required
        value={data.arquivoIdentidade}
        onChange={f => set('arquivoIdentidade', f)}
      />

      <UploadField
        label="Letra da Música *"
        info="PDF contendo a letra completa da obra. Páginas numeradas, formato A4. Máx. 50MB."
        icon="📝"
        required
        value={data.arquivoLetra}
        onChange={f => set('arquivoLetra', f)}
      />

      <UploadField
        label="Partitura *"
        info="PDF contendo a partitura completa. Páginas numeradas, sem páginas em branco, formato A4. Máx. 50MB."
        icon="🎵"
        required
        value={data.arquivoObra}
        onChange={f => set('arquivoObra', f)}
      />

      <UploadField
        label="Documentos Complementares"
        info="Opcional. Ex: comprovante de residência."
        icon="📎"
        value={data.arquivoComplementar}
        onChange={f => set('arquivoComplementar', f)}
      />

      {data.arquivoComplementar && (
        <div className={s.field}>
          <label className={s.label}>Descrição do Documento Complementar</label>
          <input
            className={s.input}
            placeholder="Ex: Comprovante de residência"
            value={data.descricaoComplementar}
            onChange={e => set('descricaoComplementar', e.target.value)}
          />
        </div>
      )}

      <div className={s.alertInfo}>
        📄 <strong>Requisitos do arquivo da obra:</strong> Páginas numeradas sequencialmente, sem páginas em branco, formato A4, máximo 50MB, contendo letra e partitura da(s) música(s).
      </div>
    </div>
  )
}

function UploadField({ label, info, icon, value, onChange, required }) {
  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { alert('Apenas arquivos PDF são aceitos.'); return }
    if (file.size > 50 * 1024 * 1024) { alert('Arquivo maior que 50MB.'); return }
    onChange(file)
  }

  return (
    <div className={s.uploadBox}>
      <div className={s.uploadHeader}>
        <span className={s.uploadIcon}>{icon}</span>
        <div>
          <div className={s.uploadLabel}>{label}</div>
          <div className={s.uploadInfo}>{info}</div>
        </div>
      </div>

      <label className={`${s.uploadArea} ${value ? s.uploadDone : ''}`}>
        <input type="file" accept=".pdf,application/pdf" onChange={handleChange} style={{ display: 'none' }} />
        {value ? (
          <div className={s.uploadSuccess}>
            <span>✅</span>
            <span className={s.uploadFileName}>{value.name}</span>
            <span className={s.uploadSize}>({(value.size / 1024).toFixed(0)} KB)</span>
          </div>
        ) : (
          <div className={s.uploadPrompt}>
            <span className={s.uploadArrow}>⬆</span>
            <span>Clique para selecionar PDF</span>
            {required && <span className={s.required}>Obrigatório</span>}
          </div>
        )}
      </label>

      {value && (
        <button className={s.btnRemoveFile} onClick={() => onChange(null)}>✕ Remover arquivo</button>
      )}
    </div>
  )
}
