import s from './Step.module.css'

export default function StepObra({ data, onChange }) {
  const set = (field, val) => onChange({ ...data, [field]: val })

  return (
    <div className={s.step}>
      <div className={s.stepTitle}>
        <span className={s.stepNum}>1</span>
        <div>
          <h2 className={s.title}>Dados da Obra Intelectual</h2>
          <p className={s.sub}>Informações sobre a obra a ser registrada</p>
        </div>
      </div>

      <div className={s.grid2}>
        <div className={s.fieldFull}>
          <label className={s.label}>Título da Obra *</label>
          <input className={s.input} placeholder="Ex: Noite Estrelada" value={data.titulo} onChange={e => set('titulo', e.target.value)} />
          {data.coletanea && <span className={s.hint}>Para coletâneas, adicione "e outras" após o título principal</span>}
        </div>

        <div className={s.field}>
          <label className={s.label}>Gênero *</label>
          <select className={s.input} value={data.genero} onChange={e => set('genero', e.target.value)}>
            <option>Música</option>
            <option>Literatura</option>
            <option>Poesia</option>
            <option>Teatro</option>
          </select>
        </div>

        <div className={s.field}>
          <label className={s.label}>Estado da Obra *</label>
          <select className={s.input} value={data.estadoObra} onChange={e => set('estadoObra', e.target.value)}>
            <option>Inédita</option>
            <option>Publicada</option>
          </select>
        </div>

        <div className={s.field}>
          <label className={s.label}>Nº Total de Páginas *</label>
          <input className={s.input} type="number" min="1" placeholder="Ex: 8" value={data.totalPaginas} onChange={e => set('totalPaginas', e.target.value)} />
          <span className={s.hint}>Contar apenas páginas com conteúdo no PDF</span>
        </div>

        <div className={s.field}>
          <label className={s.label}>Tipo de Composição *</label>
          <select className={s.input} value={data.tipoComposicao} onChange={e => set('tipoComposicao', e.target.value)}>
            <option>Obra original</option>
            <option>Adaptação</option>
            <option>Tradução</option>
            <option>Ambas</option>
          </select>
        </div>
      </div>

      <label className={s.checkboxRow}>
        <input type="checkbox" checked={data.coletanea} onChange={e => set('coletanea', e.target.checked)} />
        <span>Esta obra é uma <strong>coletânea</strong> (várias músicas)</span>
      </label>

      {data.coletanea && (
        <div className={s.alertInfo}>
          📋 <strong>Atenção:</strong> Para coletâneas, inclua um <strong>índice no início do PDF</strong> com o título de cada música.
        </div>
      )}

      <div className={s.alertInfo}>
        🎵 <strong>Importante:</strong> Para músicas, o arquivo da obra deve conter <strong>letra e partitura (melodia)</strong> juntas para garantir proteção total dos direitos autorais.
      </div>
    </div>
  )
}
