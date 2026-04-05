import { useState } from 'react'
import s from './Step.module.css'

const PARENTESCO = ['Pai', 'Mãe', 'Tutor', 'Curador', 'Outro']

/* ── Masks ────────────────────────────────────────── */
function maskCPF(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskCNPJ(v) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

function onlyDigits(v) {
  return v.replace(/\D/g, '')
}

/* ── Validators ───────────────────────────────────── */
function validarCPF(cpf) {
  const n = cpf.replace(/\D/g, '')
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += +n[i] * (10 - i)
  let d1 = (s * 10) % 11
  if (d1 >= 10) d1 = 0
  if (d1 !== +n[9]) return false
  s = 0
  for (let i = 0; i < 10; i++) s += +n[i] * (11 - i)
  let d2 = (s * 10) % 11
  if (d2 >= 10) d2 = 0
  return d2 === +n[10]
}

function validarCNPJ(cnpj) {
  const n = cnpj.replace(/\D/g, '')
  if (n.length !== 14 || /^(\d)\1{13}$/.test(n)) return false
  const calc = (len, weights) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += +n[i] * weights[i]
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  return (
    calc(12, [5,4,3,2,9,8,7,6,5,4,3,2]) === +n[12] &&
    calc(13, [6,5,4,3,2,9,8,7,6,5,4,3,2]) === +n[13]
  )
}

function cpfCnpjValido(valor, tipo) {
  const digits = valor.replace(/\D/g, '')
  if (tipo === 'Física') return digits.length === 11 ? validarCPF(valor) : null
  return digits.length === 14 ? validarCNPJ(valor) : null
}

/* ── Component ────────────────────────────────────── */
export default function StepAutores({ autores, onChange, autorVazio }) {
  const [aberto, setAberto] = useState(0)

  const addAutor = () => {
    onChange([...autores, { ...autorVazio }])
    setAberto(autores.length)
  }

  const removeAutor = (i) => {
    if (autores.length === 1) return
    const novo = autores.filter((_, idx) => idx !== i)
    onChange(novo)
    setAberto(Math.max(0, aberto - 1))
  }

  const setField = (i, field, val) => {
    const novo = autores.map((a, idx) => idx === i ? { ...a, [field]: val } : a)
    onChange(novo)
  }

  const setRep = (i, field, val) => {
    const novo = autores.map((a, idx) =>
      idx === i ? { ...a, representante: { ...a.representante, [field]: val } } : a
    )
    onChange(novo)
  }

  const handleCpfCnpj = (i, raw) => {
    const tipo = autores[i].tipoPessoa
    const masked = tipo === 'Física' ? maskCPF(raw) : maskCNPJ(raw)
    setField(i, 'cpfCnpj', masked)
  }

  const handleRepCpf = (i, raw) => {
    setRep(i, 'cpf', maskCPF(raw))
  }

  return (
    <div className={s.step}>
      <div className={s.stepTitle}>
        <span className={s.stepNum}>2</span>
        <div>
          <h2 className={s.title}>Autores / Requerentes</h2>
          <p className={s.sub}>Adicione todos os autores da obra</p>
        </div>
      </div>

      {autores.map((autor, i) => {
        const docStatus = cpfCnpjValido(autor.cpfCnpj, autor.tipoPessoa)
        const docLabel = autor.tipoPessoa === 'Física' ? 'CPF' : 'CNPJ'

        return (
          <div key={i} className={s.autorCard}>
            <div className={s.autorHeader} onClick={() => setAberto(aberto === i ? -1 : i)}>
              <span className={s.autorNum}>Autor {i + 1}</span>
              <span className={s.autorNome}>{autor.nomeCompleto || 'Sem nome'}</span>
              <div className={s.autorActions}>
                {autores.length > 1 && (
                  <button className={s.btnRemove} onClick={e => { e.stopPropagation(); removeAutor(i) }}>Remover</button>
                )}
                <span className={s.chevron}>{aberto === i ? '▲' : '▼'}</span>
              </div>
            </div>

            {aberto === i && (
              <div className={s.autorBody}>
                <div className={s.grid2}>
                  <div className={s.field}>
                    <label className={s.label}>Tipo de Pessoa *</label>
                    <select
                      className={s.input}
                      value={autor.tipoPessoa}
                      onChange={e => {
                        setField(i, 'tipoPessoa', e.target.value)
                        setField(i, 'cpfCnpj', '') // limpa ao trocar tipo
                      }}
                    >
                      <option>Física</option>
                      <option>Jurídica</option>
                    </select>
                  </div>

                  <div className={s.field}>
                    <label className={s.label}>{autor.tipoPessoa === 'Física' ? 'Nome Completo' : 'Razão Social'} *</label>
                    <input className={s.input} placeholder="Nome completo" value={autor.nomeCompleto} onChange={e => setField(i, 'nomeCompleto', e.target.value)} />
                  </div>

                  <div className={s.field}>
                    <label className={s.label}>{docLabel} *</label>
                    <input
                      className={`${s.input} ${docStatus === false ? s.inputError : docStatus === true ? s.inputOk : ''}`}
                      placeholder={autor.tipoPessoa === 'Física' ? '000.000.000-00' : '00.000.000/0000-00'}
                      value={autor.cpfCnpj}
                      onChange={e => handleCpfCnpj(i, e.target.value)}
                    />
                    {docStatus === false && (
                      <span className={s.fieldError}>{docLabel} inválido</span>
                    )}
                  </div>

                  {autor.tipoPessoa === 'Física' && (<>
                    <div className={s.field}>
                      <label className={s.label}>RG</label>
                      <input
                        className={s.input}
                        placeholder="Somente números"
                        value={autor.rg}
                        onChange={e => setField(i, 'rg', onlyDigits(e.target.value))}
                        inputMode="numeric"
                      />
                    </div>

                    <div className={s.field}>
                      <label className={s.label}>Órgão Expedidor</label>
                      <input className={s.input} placeholder="Ex: SSP-SP" value={autor.rgOrgao} onChange={e => setField(i, 'rgOrgao', e.target.value)} />
                    </div>

                    <div className={s.field}>
                      <label className={s.label}>Data de Nascimento</label>
                      <input className={s.input} type="date" value={autor.dataNascimento} onChange={e => setField(i, 'dataNascimento', e.target.value)} />
                    </div>

                    <div className={s.field}>
                      <label className={s.label}>Naturalidade</label>
                      <input className={s.input} placeholder="Ex: São Paulo - SP" value={autor.naturalidade} onChange={e => setField(i, 'naturalidade', e.target.value)} />
                    </div>

                    <div className={s.field}>
                      <label className={s.label}>Pseudônimo / Nome Artístico</label>
                      <input className={s.input} placeholder="Opcional" value={autor.pseudonimo} onChange={e => setField(i, 'pseudonimo', e.target.value)} />
                    </div>

                    <div className={s.field}>
                      <label className={s.label}>Ocupação / Profissão</label>
                      <input className={s.input} placeholder="Ex: Músico" value={autor.ocupacao} onChange={e => setField(i, 'ocupacao', e.target.value)} />
                    </div>
                  </>)}

                  <div className={s.fieldFull}>
                    <label className={s.label}>Endereço Completo</label>
                    <input className={s.input} placeholder="Rua, número, bairro, cidade, estado" value={autor.endereco} onChange={e => setField(i, 'endereco', e.target.value)} />
                  </div>
                </div>

                {autor.tipoPessoa === 'Física' && (
                  <label className={s.checkboxRow} style={{ marginTop: 16 }}>
                    <input type="checkbox" checked={autor.menorIdade} onChange={e => setField(i, 'menorIdade', e.target.checked)} />
                    <span>Este autor é <strong>menor de 18 anos</strong> (requer representante legal)</span>
                  </label>
                )}

                {autor.menorIdade && (
                  <div className={s.repBox}>
                    <h4 className={s.repTitle}>Representante Legal</h4>
                    <div className={s.grid2}>
                      <div className={s.fieldFull}>
                        <label className={s.label}>Nome do Responsável *</label>
                        <input className={s.input} placeholder="Nome completo" value={autor.representante.nome} onChange={e => setRep(i, 'nome', e.target.value)} />
                      </div>
                      <div className={s.field}>
                        <label className={s.label}>RG do Responsável</label>
                        <input
                          className={s.input}
                          placeholder="Somente números"
                          value={autor.representante.rg}
                          onChange={e => setRep(i, 'rg', onlyDigits(e.target.value))}
                          inputMode="numeric"
                        />
                      </div>
                      <div className={s.field}>
                        <label className={s.label}>Órgão Expedidor</label>
                        <input className={s.input} placeholder="Ex: SSP-SP" value={autor.representante.rgOrgao} onChange={e => setRep(i, 'rgOrgao', e.target.value)} />
                      </div>
                      <div className={s.field}>
                        <label className={s.label}>CPF do Responsável</label>
                        <input
                          className={s.input}
                          placeholder="000.000.000-00"
                          value={autor.representante.cpf}
                          onChange={e => handleRepCpf(i, e.target.value)}
                          inputMode="numeric"
                        />
                        {autor.representante.cpf.replace(/\D/g,'').length === 11 && !validarCPF(autor.representante.cpf) && (
                          <span className={s.fieldError}>CPF inválido</span>
                        )}
                      </div>
                      <div className={s.field}>
                        <label className={s.label}>Grau de Parentesco</label>
                        <select className={s.input} value={autor.representante.parentesco} onChange={e => setRep(i, 'parentesco', e.target.value)}>
                          {PARENTESCO.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <button className={s.btnAddAutor} onClick={addAutor}>+ Adicionar Autor</button>
    </div>
  )
}
