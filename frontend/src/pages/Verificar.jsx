import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { musicasAPI } from '../services/api'
import styles from './Verificar.module.css'

export default function Verificar() {
  const [searchParams] = useSearchParams()
  const [busca, setBusca] = useState(searchParams.get('id') || '')
  const [loading, setLoading] = useState(false)
  const [obra, setObra] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) buscarObra(id)
  }, [])

  const buscarObra = async (id) => {
    setLoading(true)
    setErro('')
    setObra(null)
    try {
      const res = await musicasAPI.verificar(id)
      setObra(res.data.data)
    } catch (err) {
      setErro(err.response?.status === 404 ? 'Nenhuma obra encontrada com esse ID.' : 'Erro ao buscar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const verificar = (e) => {
    e.preventDefault()
    if (!busca.trim()) return
    buscarObra(busca.trim())
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>

        <div className={styles.header}>
          <span className={styles.badge}>🔍 Verificação Pública</span>
          <h1 className={styles.title}>Verificar Registro de Obra</h1>
          <p className={styles.subtitle}>Digite o ID do registro para consultar os dados da obra e sua prova na blockchain.</p>
        </div>

        <form className={styles.searchBox} onSubmit={verificar}>
          <input
            className={styles.input}
            placeholder="Ex: TL-1775135978285"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <button className={styles.btnBuscar} type="submit" disabled={loading}>
            {loading ? 'Buscando...' : 'Verificar'}
          </button>
        </form>

        {erro && <div className={styles.erro}>⚠️ {erro}</div>}

        {obra && (
          <div className={styles.resultado}>

            {/* Status */}
            <div className={styles.statusRow}>
              <span className={styles.statusBadge}>✓ {obra.status}</span>
              <span className={styles.dataReg}>Registrado em {new Date(obra.criadoEm).toLocaleString('pt-BR')}</span>
            </div>

            {/* Dados da Obra */}
            <section className={styles.secao}>
              <h2 className={styles.secaoTitulo}>Dados da Obra</h2>
              <div className={styles.grid}>
                <Campo label="ID do Registro" valor={obra.id} destaque />
                <Campo label="Título" valor={obra.titulo} />
                <Campo label="Gênero" valor={obra.genero} />
                <Campo label="Estado da Obra" valor={obra.estadoObra} />
                <Campo label="Tipo de Composição" valor={obra.tipoComposicao} />
                <Campo label="Tipo de Serviço" valor={obra.tipoServico} />
              </div>
            </section>

            {/* Autores */}
            <section className={styles.secao}>
              <h2 className={styles.secaoTitulo}>Autores</h2>
              {obra.autores?.length > 0 ? obra.autores.map((a, i) => (
                <div key={i} className={styles.autorCard}>
                  <div className={styles.autorNome}>{a.nomeCompleto || '—'}</div>
                  <div className={styles.autorDetalhes}>
                    {[a.funcao, a.ocupacao, a.nacionalidade].filter(Boolean).join(' · ')}
                  </div>
                </div>
              )) : (
                <p className={styles.semDados}>Nenhum autor registrado.</p>
              )}
            </section>

            {/* Arquivos IPFS */}
            <section className={styles.secao}>
              <h2 className={styles.secaoTitulo}>Arquivos da Obra (IPFS)</h2>
              <div className={styles.blockchainBox}>

                <div className={styles.hashRow}>
                  <span className={styles.hashLabel}>Partitura</span>
                  <span className={styles.hashValue}>{obra.cid || '—'}</span>
                </div>
                {obra.cidUrl && (
                  <a href={obra.cidUrl} target="_blank" rel="noopener noreferrer" className={styles.btnLink}>
                    🎵 Acessar partitura
                  </a>
                )}

                {obra.cidLetra && (
                  <>
                    <div className={styles.divider} />
                    <div className={styles.hashRow}>
                      <span className={styles.hashLabel}>Letra da Música</span>
                      <span className={styles.hashValue}>{obra.cidLetra}</span>
                    </div>
                    {obra.cidLetraUrl && (
                      <a href={obra.cidLetraUrl} target="_blank" rel="noopener noreferrer" className={styles.btnLink}>
                        📝 Acessar letra da música
                      </a>
                    )}
                  </>
                )}

                {obra.cidIdentidade && (
                  <>
                    <div className={styles.divider} />
                    <div className={styles.hashRow}>
                      <span className={styles.hashLabel}>Documentação de Identidade</span>
                      <span className={styles.hashValue}>{obra.cidIdentidade}</span>
                    </div>
                    {obra.cidIdentidadeUrl && (
                      <a href={obra.cidIdentidadeUrl} target="_blank" rel="noopener noreferrer" className={styles.btnLink}>
                        🪪 Acessar documento de identidade
                      </a>
                    )}
                  </>
                )}

                {obra.cidComplementar && (
                  <>
                    <div className={styles.divider} />
                    <div className={styles.hashRow}>
                      <span className={styles.hashLabel}>Documento Complementar</span>
                      <span className={styles.hashValue}>{obra.cidComplementar}</span>
                    </div>
                    {obra.cidComplementarUrl && (
                      <a href={obra.cidComplementarUrl} target="_blank" rel="noopener noreferrer" className={styles.btnLink}>
                        📎 Acessar documento complementar
                      </a>
                    )}
                  </>
                )}

              </div>
            </section>

            {/* NFT ERC-721 */}
            {obra.tokenId != null && (
              <section className={styles.secao}>
                <h2 className={styles.secaoTitulo}>◆ NFT ERC-721</h2>
                <div className={styles.blockchainBox}>
                  <div className={styles.hashRow}>
                    <span className={styles.hashLabel}>Token ID</span>
                    <span className={styles.hashValue} style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1.1em' }}>#{obra.tokenId}</span>
                  </div>
                  <div className={styles.hashRow}>
                    <span className={styles.hashLabel}>Contrato ERC-721</span>
                    <span className={styles.hashValue}>{obra.nftContractAddress || '—'}</span>
                  </div>
                  {obra.tokenURI && (
                    <div className={styles.hashRow}>
                      <span className={styles.hashLabel}>tokenURI (metadata)</span>
                      <span className={styles.hashValue}>{obra.tokenURI}</span>
                    </div>
                  )}
                  <div className={styles.divider} />
                  {obra.metadataUrl && (
                    <a href={obra.metadataUrl} target="_blank" rel="noopener noreferrer" className={styles.btnLink}>
                      📋 Ver metadata no IPFS
                    </a>
                  )}
                  {obra.metadataUrlFallback && (
                    <a href={obra.metadataUrlFallback} target="_blank" rel="noopener noreferrer" className={styles.btnLink} style={{ marginTop: 6, opacity: 0.75, fontSize: '0.88em' }}>
                      🔗 Metadata (ipfs.io)
                    </a>
                  )}
                  {obra.openseaUrl && (
                    <a href={obra.openseaUrl} target="_blank" rel="noopener noreferrer" className={styles.btnLink}>
                      🌊 Ver NFT no OpenSea
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Integridade SHA-256 */}
            {(obra.hashObra || obra.hashLetra) && (
              <section className={styles.secao}>
                <h2 className={styles.secaoTitulo}>Hashes de Integridade (SHA-256)</h2>
                <div className={styles.blockchainBox}>
                  {obra.hashObra && (
                    <div className={styles.hashRow}>
                      <span className={styles.hashLabel}>Obra</span>
                      <span className={styles.hashValue} style={{ fontSize: '0.75em', wordBreak: 'break-all' }}>{obra.hashObra}</span>
                    </div>
                  )}
                  {obra.hashLetra && (
                    <>
                      <div className={styles.divider} />
                      <div className={styles.hashRow}>
                        <span className={styles.hashLabel}>Letra</span>
                        <span className={styles.hashValue} style={{ fontSize: '0.75em', wordBreak: 'break-all' }}>{obra.hashLetra}</span>
                      </div>
                    </>
                  )}
                  {obra.hashIdentidade && (
                    <>
                      <div className={styles.divider} />
                      <div className={styles.hashRow}>
                        <span className={styles.hashLabel}>Identidade</span>
                        <span className={styles.hashValue} style={{ fontSize: '0.75em', wordBreak: 'break-all' }}>{obra.hashIdentidade}</span>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Blockchain */}
            <section className={styles.secao}>
              <h2 className={styles.secaoTitulo}>Prova na Blockchain</h2>
              <div className={styles.blockchainBox}>
                <div className={styles.hashRow}>
                  <span className={styles.hashLabel}>Transaction Hash</span>
                  <span className={styles.hashValue}>{obra.txHash || '—'}</span>
                </div>
                <div className={styles.hashRow}>
                  <span className={styles.hashLabel}>Rede</span>
                  <span className={styles.hashValue}>Ethereum Mainnet</span>
                </div>
                {obra.etherscanUrl && (
                  <a href={obra.etherscanUrl} target="_blank" rel="noopener noreferrer" className={styles.btnLink}>
                    🔗 Verificar no Etherscan
                  </a>
                )}
              </div>
            </section>

          </div>
        )}

      </div>
    </main>
  )
}

function Campo({ label, valor, destaque }) {
  return (
    <div className={styles.campo}>
      <span className={styles.campoLabel}>{label}</span>
      <span className={`${styles.campoValor} ${destaque ? styles.destaque : ''}`}>{valor || '—'}</span>
    </div>
  )
}
