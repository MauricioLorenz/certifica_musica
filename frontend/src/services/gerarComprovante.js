import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

export async function gerarComprovante(musica) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const margin = 18

  // ── Paleta ────────────────────────────────────────────────────────────────
  const blue      = [26, 106, 255]
  const blueDim   = [16, 38, 90]
  const dark      = [6, 13, 30]
  const card      = [13, 22, 53]
  const cardAlt   = [8, 17, 42]
  const white     = [255, 255, 255]
  const muted     = [148, 163, 184]
  const mutedDark = [71, 85, 105]
  const success   = [16, 185, 129]
  const border    = [20, 35, 72]
  const gold      = [251, 191, 36]   // tom dourado para NFT badge

  // ── Fundo ─────────────────────────────────────────────────────────────────
  doc.setFillColor(...dark)
  doc.rect(0, 0, W, H, 'F')
  doc.setFillColor(...blueDim)
  doc.rect(0, 0, W, 2, 'F')

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(...card)
  doc.roundedRect(margin, 8, W - margin * 2, 36, 5, 5, 'F')
  doc.setDrawColor(...blueDim)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, 8, W - margin * 2, 36, 5, 5, 'S')

  // Escudo
  doc.setFillColor(...blue)
  doc.roundedRect(margin + 1, 11.5, 7, 8, 1.5, 1.5, 'F')
  doc.setFillColor(...dark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(...white)
  doc.text('✓', margin + 4.5, 17, { align: 'center' })

  // Marca
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...white)
  doc.text('Certifica', margin + 12, 28)
  const certW = doc.getTextWidth('Certifica')
  doc.setTextColor(...blue)
  doc.text('Música', margin + 12 + certW + 1, 28)

  // Badge NFT
  doc.setFillColor(...gold)
  doc.roundedRect(W - margin - 58, 13, 48, 8, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...dark)
  doc.text('◆ CERTIFICADO NFT ERC-721', W - margin - 34, 18.5, { align: 'center' })

  // Data de emissão
  const dataFormatada = musica.criadoEm
    ? new Date(musica.criadoEm).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...muted)
  doc.text(`Emitido em: ${dataFormatada}`, W - margin - 10, 28, { align: 'right' })

  // Badge VÁLIDO
  doc.setFillColor(...success)
  doc.roundedRect(W - margin - 30, 30, 20, 7, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...dark)
  doc.text('✓ VÁLIDO', W - margin - 20, 35, { align: 'center' })

  // ── ID do Registro ────────────────────────────────────────────────────────
  doc.setFillColor(...cardAlt)
  doc.roundedRect(margin, 50, W - margin * 2, 17, 4, 4, 'F')
  doc.setDrawColor(...border)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, 50, W - margin * 2, 17, 4, 4, 'S')
  doc.setFillColor(...blue)
  doc.roundedRect(margin, 50, 3, 17, 1.5, 1.5, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...mutedDark)
  doc.text('CÓDIGO DO REGISTRO', margin + 8, 57)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...blue)
  doc.text(String(musica.id || '—'), margin + 8, 64)

  // ── Seção: Dados da Obra ──────────────────────────────────────────────────
  let y = 74
  doc.setFillColor(...card)
  doc.roundedRect(margin, y, W - margin * 2, 74, 4, 4, 'F')
  doc.setDrawColor(...border)
  doc.roundedRect(margin, y, W - margin * 2, 74, 4, 4, 'S')
  doc.setFillColor(...blue)
  doc.roundedRect(margin, y, W - margin * 2, 10, 4, 4, 'F')
  doc.rect(margin, y + 5, W - margin * 2, 5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...dark)
  doc.text('DADOS DA OBRA', margin + 8, y + 7)

  const campos = [
    ['Título da Obra',     musica.titulo || '—'],
    ['Gênero',             musica.genero || '—'],
    ['Estado da Obra',     musica.estadoObra || '—'],
    ['Tipo de Composição', musica.tipoComposicao || '—'],
    ['Forma de Pagamento', musica.formaPagamento || '—'],
    ['Status',             musica.status || '—'],
  ]
  const col1x = margin + 8
  const col2x = W / 2 + 4
  const colW  = (W - margin * 2 - 20) / 2
  let cy = y + 20
  campos.forEach(([label, valor], i) => {
    const x = i % 2 === 0 ? col1x : col2x
    if (i % 2 === 0 && i > 0) cy += 18
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...mutedDark)
    doc.text(label.toUpperCase(), x, cy)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(label === 'Status' ? success[0] : white[0],
                     label === 'Status' ? success[1] : white[1],
                     label === 'Status' ? success[2] : white[2])
    const texto = String(valor)
    const truncado = doc.getTextWidth(texto) > colW - 4
      ? doc.splitTextToSize(texto, colW - 4)[0] + '…'
      : texto
    doc.text(truncado, x, cy + 5.5)
  })

  // ── Seção: Autores ────────────────────────────────────────────────────────
  const autores   = Array.isArray(musica.autores) ? musica.autores : []
  const autoresH  = autores.length > 0 ? 14 + autores.length * 20 : 28
  const autoresY  = y + 80
  doc.setFillColor(...card)
  doc.roundedRect(margin, autoresY, W - margin * 2, autoresH, 4, 4, 'F')
  doc.setDrawColor(...border)
  doc.roundedRect(margin, autoresY, W - margin * 2, autoresH, 4, 4, 'S')
  doc.setFillColor(...blue)
  doc.roundedRect(margin, autoresY, W - margin * 2, 10, 4, 4, 'F')
  doc.rect(margin, autoresY + 5, W - margin * 2, 5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...dark)
  doc.text('AUTORES', margin + 8, autoresY + 7)

  if (autores.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...muted)
    doc.text('Nenhum autor registrado', margin + 8, autoresY + 22)
  } else {
    autores.forEach((autor, i) => {
      const ay = autoresY + 18 + i * 20
      doc.setFillColor(...blueDim)
      doc.circle(margin + 12, ay + 1, 4, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...blue)
      doc.text(String(i + 1), margin + 12, ay + 3.5, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(...white)
      doc.text(autor.nomeCompleto || '—', margin + 20, ay + 1.5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...muted)
      const cpfLabel = autor.cpfCnpj || autor.cpf
      const detalhes = [
        autor.tipoPessoa ? `Pessoa ${autor.tipoPessoa}` : null,
        cpfLabel ? `CPF/CNPJ: ${cpfLabel}` : null,
        autor.ocupacao || null,
      ].filter(Boolean).join('  ·  ')
      if (detalhes) doc.text(detalhes, margin + 20, ay + 7.5)
    })
  }

  // ── Seção: NFT ERC-721 ────────────────────────────────────────────────────
  const nftY = autoresY + autoresH + 6
  const nftH = 38
  doc.setFillColor(...card)
  doc.roundedRect(margin, nftY, W - margin * 2, nftH, 4, 4, 'F')
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, nftY, W - margin * 2, nftH, 4, 4, 'S')

  // Header dourado
  doc.setFillColor(...gold)
  doc.roundedRect(margin, nftY, W - margin * 2, 10, 4, 4, 'F')
  doc.rect(margin, nftY + 5, W - margin * 2, 5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...dark)
  doc.text('◆ NFT ERC-721 — ETHEREUM MAINNET', margin + 8, nftY + 7)

  // tokenId
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...mutedDark)
  doc.text('TOKEN ID', margin + 8, nftY + 18)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...gold)
  doc.text(musica.tokenId != null ? `#${musica.tokenId}` : '—', margin + 8, nftY + 26)

  // Contrato
  const contractAddr = musica.nftContractAddress || '—'
  const contractShort = contractAddr !== '—'
    ? `${contractAddr.slice(0, 10)}...${contractAddr.slice(-8)}`
    : '—'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...mutedDark)
  doc.text('CONTRATO ERC-721', margin + 40, nftY + 18)
  doc.setFont('courier', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...muted)
  doc.text(contractShort, margin + 40, nftY + 26)

  // Metadata CID
  const metaCid = musica.metadataCID || ''
  const metaShort = metaCid ? `ipfs://${metaCid.slice(0, 16)}…` : '—'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...mutedDark)
  doc.text('METADATA IPFS (tokenURI)', margin + 8, nftY + 34)
  doc.setFont('courier', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...blue)
  doc.text(metaShort, margin + 50, nftY + 34)

  // ── Seção: Blockchain + QR ────────────────────────────────────────────────
  const blockY = nftY + nftH + 6

  // QR aponta para Etherscan MAINNET
  let qrDataUrl = null
  if (musica.txHash?.startsWith('0x')) {
    const etherscanUrl = `https://etherscan.io/tx/${musica.txHash}`
    try {
      qrDataUrl = await QRCode.toDataURL(etherscanUrl, {
        width: 100, margin: 1,
        color: { dark: '#1a6aff', light: '#08112a' },
      })
    } catch (_) {}
  }

  const blockH = 60
  doc.setFillColor(...card)
  doc.roundedRect(margin, blockY, W - margin * 2, blockH, 4, 4, 'F')
  doc.setDrawColor(...blueDim)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, blockY, W - margin * 2, blockH, 4, 4, 'S')
  doc.setFillColor(...blue)
  doc.roundedRect(margin, blockY, W - margin * 2, 10, 4, 4, 'F')
  doc.rect(margin, blockY + 5, W - margin * 2, 5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...dark)
  doc.text('REGISTRO NA BLOCKCHAIN', margin + 8, blockY + 7)

  // TxHash
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...mutedDark)
  doc.text('TRANSACTION HASH — PROVA CRIPTOGRÁFICA', margin + 8, blockY + 18)
  doc.setFont('courier', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...blue)
  const txHash  = musica.txHash || '—'
  const txMaxW  = qrDataUrl ? W - margin * 2 - 44 : W - margin * 2 - 20
  const txTrunc = doc.getTextWidth(txHash) > txMaxW
    ? doc.splitTextToSize(txHash, txMaxW)[0]
    : txHash
  doc.text(txTrunc, margin + 8, blockY + 25)

  // Rede (MAINNET) + CID principal
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...mutedDark)
  doc.text('REDE', margin + 8, blockY + 34)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...white)
  doc.text('Ethereum Mainnet', margin + 8, blockY + 40)

  const cidPrincipal = musica.cid || ''
  const cidShort = cidPrincipal ? `${cidPrincipal.slice(0, 22)}…` : '—'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...mutedDark)
  doc.text('IPFS CID (obra)', margin + 70, blockY + 34)
  doc.setFont('courier', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...muted)
  doc.text(cidShort, margin + 70, blockY + 40)

  // Hashes SHA-256 (linha compacta)
  if (musica.hashObra || musica.hashLetra) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...mutedDark)
    doc.text('SHA-256 OBRA', margin + 8, blockY + 50)
    doc.setFont('courier', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(...mutedDark)
    const h = musica.hashObra || '—'
    doc.text(h.slice(0, 48) + (h.length > 48 ? '…' : ''), margin + 8, blockY + 55)
  }

  // QR Code
  if (qrDataUrl) {
    const qrSize = 26
    const qrX = W - margin - 6 - qrSize
    const qrY = blockY + 14
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(...mutedDark)
    doc.text('Ver no Etherscan', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' })
  }

  // ── Nota de autenticidade ─────────────────────────────────────────────────
  const notaY = blockY + blockH + 6
  doc.setFillColor(...cardAlt)
  doc.roundedRect(margin, notaY, W - margin * 2, 14, 3, 3, 'F')
  doc.setDrawColor(...border)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, notaY, W - margin * 2, 14, 3, 3, 'S')
  doc.setFillColor(...blue)
  doc.circle(margin + 9, notaY + 7, 3.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...dark)
  doc.text('i', margin + 9, notaY + 9.2, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...muted)
  doc.text(
    'Este certificado NFT ERC-721 foi mintado na Ethereum Mainnet e garante autoria imutável. Verifique em qualquer explorador de blockchain ou no OpenSea.',
    margin + 17, notaY + 5.5,
    { maxWidth: W - margin * 2 - 24 }
  )

  // ── Rodapé ────────────────────────────────────────────────────────────────
  const rodapeY = H - 14
  doc.setDrawColor(...border)
  doc.setLineWidth(0.3)
  doc.line(margin, rodapeY, W - margin, rodapeY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...white)
  doc.text('Certifica', margin, rodapeY + 6)
  doc.setTextColor(...blue)
  const cW = doc.getTextWidth('Certifica')
  doc.text('Música', margin + cW + 0.5, rodapeY + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...mutedDark)
  doc.text('Plataforma de registro de direitos autorais musicais na blockchain', W / 2, rodapeY + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...blue)
  doc.text('certificamusica.com.br', W - margin, rodapeY + 6, { align: 'right' })

  // ── Salvar ────────────────────────────────────────────────────────────────
  doc.save(`certificado-nft-${musica.id || 'certifica'}.pdf`)
}
