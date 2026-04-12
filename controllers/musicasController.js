const crypto = require('crypto');
const { client } = require('../db/turso');
const ethereumService = require('../services/ethereumService');
const ipfsService = require('../services/lighthouseService');
const creditosService = require('../services/creditosService');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sha256 = (buffer) =>
  crypto.createHash('sha256').update(buffer).digest('hex');

const toObj = (row) => ({
  id: row.id,
  usuario_id: row.usuario_id,
  titulo: row.titulo,
  genero: row.genero,
  estadoObra: row.estadoObra,
  totalPaginas: row.totalPaginas,
  tipoComposicao: row.tipoComposicao,
  coletanea: Boolean(row.coletanea),
  autores: JSON.parse(row.autores || '[]'),
  arquivoLetra: row.arquivoLetra,
  arquivoObra: row.arquivoObra,
  arquivoIdentidade: row.arquivoIdentidade,
  arquivoComplementar: row.arquivoComplementar,
  descricaoComplementar: row.descricaoComplementar,
  tipoServico: row.tipoServico,
  formaPagamento: row.formaPagamento,
  // IPFS CIDs
  cid: row.cid,
  cidLetra: row.cidLetra,
  cidIdentidade: row.cidIdentidade,
  cidComplementar: row.cidComplementar,
  metadataCID: row.metadataCID,
  // Hashes SHA-256
  hashObra: row.hashObra,
  hashLetra: row.hashLetra,
  hashIdentidade: row.hashIdentidade,
  hashComplementar: row.hashComplementar,
  // NFT
  tokenId: row.tokenId,
  nftContractAddress: row.nftContractAddress,
  txHash: row.txHash,
  status: row.status,
  termoAceito: Boolean(row.termoAceito),
  criadoEm: row.criadoEm,
});

// ─── Registro (NFT ERC-721) ───────────────────────────────────────────────────

exports.criarMusica = async (req, res) => {
  try {
    const {
      titulo, genero, estadoObra, totalPaginas, tipoComposicao, coletanea,
      autores, tipoServico, formaPagamento, termoAceito, descricaoComplementar,
    } = req.body;

    if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório' });
    if (!termoAceito) return res.status(400).json({ erro: 'Aceite o termo de declaração' });

    // ── 0. Gate de crédito ────────────────────────────────────────────────────
    const usuario_id_gate = req.usuario?.id;
    if (!usuario_id_gate) return res.status(401).json({ erro: 'Não autenticado' });

    const saldoAtual = await creditosService.getSaldo(usuario_id_gate);
    if (saldoAtual < 1) {
      return res.status(402).json({
        erro: 'Saldo insuficiente. Adquira créditos para certificar obras.',
        code: 'SALDO_INSUFICIENTE',
      });
    }

    const autoresArr = typeof autores === 'string'
      ? JSON.parse(autores)
      : (autores || []);
    const compositor = autoresArr[0]?.nomeCompleto || 'Desconhecido';
    const arquivos = req.files || {};

    // ── 1. Gerar SHA-256 de cada arquivo ──────────────────────────────────────
    const fileObra        = arquivos.arquivoObra?.[0];
    const fileLetra       = arquivos.arquivoLetra?.[0];
    const fileIdentidade  = arquivos.arquivoIdentidade?.[0];
    const fileComplementar = arquivos.arquivoComplementar?.[0];

    const hashObra        = fileObra        ? sha256(fileObra.buffer)        : null;
    const hashLetra       = fileLetra       ? sha256(fileLetra.buffer)       : null;
    const hashIdentidade  = fileIdentidade  ? sha256(fileIdentidade.buffer)  : null;
    const hashComplementar = fileComplementar ? sha256(fileComplementar.buffer) : null;

    // ── 2. Upload dos arquivos para IPFS (paralelo) ───────────────────────────
    const uploadSe = async (file) => {
      if (!file) return null;
      const r = await ipfsService.uploadBuffer(file.buffer, file.originalname);
      return r.cid;
    };

    const [cidObra, cidLetra, cidIdentidade, cidComplementar] = await Promise.all([
      uploadSe(fileObra),
      uploadSe(fileLetra),
      uploadSe(fileIdentidade),
      uploadSe(fileComplementar),
    ]);

    // cid principal = obra; fallback gerado se não houver arquivo
    const cid = cidObra || `QmPH${Date.now().toString(36).toUpperCase()}`;

    // ── 3. Montar metadata ERC-721 ────────────────────────────────────────────
    const id        = `SL-${Date.now()}`;
    const criadoEm  = new Date().toISOString();
    const walletOwner = process.env.ETHEREUM_ADDRESS || '';

    const metadata = {
      name: titulo,
      description: `Registro de autoria musical via CertificaMusica. Obra: "${titulo}" — compositor(es): ${autoresArr.map(a => a.nomeCompleto).join(', ') || compositor}. Registrado em ${criadoEm}.`,
      image: cidObra
        ? `ipfs://${cidObra}`
        : 'ipfs://QmRFsqEMBT1xGMKXYJfx4R3kG5A3VFYiZQ8YpG9VDd31k', // placeholder genérico
      animation_url: cidObra ? `ipfs://${cidObra}` : undefined,
      external_url: `https://certificamusica.com.br/verificar/${id}`,
      attributes: [
        { trait_type: 'ID do Registro',       value: id },
        { trait_type: 'Título',                value: titulo },
        { trait_type: 'Compositor Principal',  value: compositor },
        { trait_type: 'Gênero',                value: genero || 'Música' },
        { trait_type: 'Tipo de Composição',    value: tipoComposicao || 'Obra original' },
        { trait_type: 'Estado da Obra',        value: estadoObra || 'Inédita' },
        { trait_type: 'Tipo de Serviço',       value: tipoServico || 'Registro Simples' },
        { trait_type: 'Data de Registro',      value: criadoEm },
        { trait_type: 'Wallet Registrador',    value: walletOwner },
        // CIDs IPFS
        ...(cidObra        ? [{ trait_type: 'CID Obra IPFS',        value: cidObra }]        : []),
        ...(cidLetra       ? [{ trait_type: 'CID Letra IPFS',       value: cidLetra }]       : []),
        ...(cidIdentidade  ? [{ trait_type: 'CID Identidade IPFS',  value: cidIdentidade }]  : []),
        ...(cidComplementar ? [{ trait_type: 'CID Complementar IPFS', value: cidComplementar }] : []),
        // Hashes SHA-256 (prova de integridade dos arquivos originais)
        ...(hashObra        ? [{ trait_type: 'SHA-256 Obra',        value: hashObra }]        : []),
        ...(hashLetra       ? [{ trait_type: 'SHA-256 Letra',       value: hashLetra }]       : []),
        ...(hashIdentidade  ? [{ trait_type: 'SHA-256 Identidade',  value: hashIdentidade }]  : []),
        ...(hashComplementar ? [{ trait_type: 'SHA-256 Complementar', value: hashComplementar }] : []),
        // Autores
        ...autoresArr.map((a, i) => ({
          trait_type: `Autor ${i + 1}`,
          value: [a.nomeCompleto, a.cpf ? `CPF: ${a.cpf}` : ''].filter(Boolean).join(' — '),
        })),
      ].filter(Boolean),
    };

    // ── 4. Upload da metadata JSON para IPFS ──────────────────────────────────
    const { cid: metadataCID } = await ipfsService.uploadJSON(
      metadata,
      `${id}-metadata`
    );
    const tokenURI = `ipfs://${metadataCID}`;

    // ── 5. Mint do NFT no contrato ERC-721 ────────────────────────────────────
    const mintResult = await ethereumService.mintNFT(walletOwner || req.usuario?.wallet || walletOwner, tokenURI);
    const { txHash, tokenId, contractAddress: nftContractAddress } = mintResult.transaction;

    // ── 6. Persistir no banco ─────────────────────────────────────────────────
    const usuario_id = req.usuario?.id || null;

    await client.execute({
      sql: `INSERT INTO musicas (
              id, usuario_id, titulo, genero, estadoObra, totalPaginas, tipoComposicao,
              coletanea, autores, arquivoLetra, arquivoObra, arquivoIdentidade,
              arquivoComplementar, descricaoComplementar, tipoServico, formaPagamento,
              cid, cidLetra, cidIdentidade, cidComplementar, metadataCID,
              hashObra, hashLetra, hashIdentidade, hashComplementar,
              tokenId, nftContractAddress, txHash, status, termoAceito, criadoEm
            ) VALUES (
              ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
            )`,
      args: [
        id,
        usuario_id,
        titulo,
        genero || 'Música',
        estadoObra || 'Inédita',
        parseInt(totalPaginas) || null,
        tipoComposicao || 'Obra original',
        coletanea === 'true' || coletanea === true ? 1 : 0,
        JSON.stringify(autoresArr),
        fileLetra?.originalname       || null,
        fileObra?.originalname        || null,
        fileIdentidade?.originalname  || null,
        fileComplementar?.originalname || null,
        descricaoComplementar || null,
        tipoServico || 'Registro Simples',
        formaPagamento || 'PIX',
        cid,
        cidLetra,
        cidIdentidade,
        cidComplementar,
        metadataCID,
        hashObra,
        hashLetra,
        hashIdentidade,
        hashComplementar,
        tokenId,
        nftContractAddress,
        txHash,
        'Pendente',
        1,
        criadoEm,
      ],
    });

    const result = await client.execute({
      sql: 'SELECT * FROM musicas WHERE id = ?',
      args: [id],
    });
    const musica = toObj(result.rows[0]);

    // ── 7. Consome 1 crédito (somente após sucesso total) ─────────────────────
    await creditosService.consumirCredito(usuario_id_gate, id);

    console.log(`✅ NFT mintado | tokenId: ${tokenId} | tx: ${txHash}`);

    res.status(201).json({
      success: true,
      data: {
        ...musica,
        tokenURI,
        // Gateway público primário (cloudflare) + fallback (ipfs.io)
        metadataUrl: ipfsService.getGatewayUrl(metadataCID),
        metadataUrlFallback: `https://ipfs.io/ipfs/${metadataCID}`,
        cidUrl: cidObra ? ipfsService.getGatewayUrl(cidObra) : null,
        // OpenSea: usa o tokenId real retornado pelo contrato
        openseaUrl: nftContractAddress && tokenId != null
          ? `https://opensea.io/assets/ethereum/${nftContractAddress}/${tokenId}`
          : null,
      },
      message: 'Obra registrada como NFT com sucesso',
    });
  } catch (error) {
    console.error('❌ Erro ao registrar:', error.message);
    res.status(500).json({ erro: error.message });
  }
};

// ─── Leitura ──────────────────────────────────────────────────────────────────

exports.obterMusicas = async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM musicas WHERE usuario_id = ? ORDER BY criadoEm DESC',
      args: [req.usuario.id],
    });
    res.json({ success: true, total: result.rows.length, data: result.rows.map(toObj) });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.obterMusica = async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM musicas WHERE id = ?',
      args: [req.params.id],
    });
    if (!result.rows.length) return res.status(404).json({ erro: 'Obra não encontrada' });
    res.json({ success: true, data: toObj(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.atualizarMusica = async (req, res) => {
  try {
    const fields = Object.keys(req.body);
    if (!fields.length) return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
    const sets   = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => req.body[f]);
    await client.execute({
      sql: `UPDATE musicas SET ${sets} WHERE id = ?`,
      args: [...values, req.params.id],
    });
    const result = await client.execute({
      sql: 'SELECT * FROM musicas WHERE id = ?',
      args: [req.params.id],
    });
    if (!result.rows.length) return res.status(404).json({ erro: 'Obra não encontrada' });
    res.json({ success: true, data: toObj(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.deletarMusica = async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM musicas WHERE id = ?',
      args: [req.params.id],
    });
    if (!result.rows.length) return res.status(404).json({ erro: 'Obra não encontrada' });
    const musica = toObj(result.rows[0]);
    if (musica.usuario_id && musica.usuario_id !== req.usuario.id)
      return res.status(403).json({ erro: 'Sem permissão' });
    await client.execute({ sql: 'DELETE FROM musicas WHERE id = ?', args: [req.params.id] });
    res.json({ success: true, data: musica });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// ─── Verificação pública ──────────────────────────────────────────────────────

exports.verificarObra = async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM musicas WHERE id = ?',
      args: [req.params.id],
    });
    if (!result.rows.length) return res.status(404).json({ erro: 'Obra não encontrada' });
    const m = toObj(result.rows[0]);

    res.json({
      success: true,
      data: {
        id: m.id,
        titulo: m.titulo,
        genero: m.genero,
        estadoObra: m.estadoObra,
        tipoComposicao: m.tipoComposicao,
        tipoServico: m.tipoServico,
        autores: m.autores,
        status: m.status,
        criadoEm: m.criadoEm,
        // NFT
        tokenId: m.tokenId,
        nftContractAddress: m.nftContractAddress,
        tokenURI: m.metadataCID ? `ipfs://${m.metadataCID}` : null,
        // Gateways públicos para metadata — cloudflare primário, ipfs.io como fallback
        metadataUrl: m.metadataCID ? ipfsService.getGatewayUrl(m.metadataCID) : null,
        metadataUrlFallback: m.metadataCID ? `https://ipfs.io/ipfs/${m.metadataCID}` : null,
        // OpenSea — tokenId pode ser "0" (string), comparar com != null
        openseaUrl: m.nftContractAddress && m.tokenId != null
          ? `https://opensea.io/assets/ethereum/${m.nftContractAddress}/${m.tokenId}`
          : null,
        // Arquivos
        cidUrl:           m.cid            ? ipfsService.getGatewayUrl(m.cid)            : null,
        cidLetraUrl:      m.cidLetra       ? ipfsService.getGatewayUrl(m.cidLetra)       : null,
        cidIdentidadeUrl: m.cidIdentidade  ? ipfsService.getGatewayUrl(m.cidIdentidade)  : null,
        cidComplementarUrl: m.cidComplementar ? ipfsService.getGatewayUrl(m.cidComplementar) : null,
        // Hashes de integridade
        hashObra:        m.hashObra,
        hashLetra:       m.hashLetra,
        hashIdentidade:  m.hashIdentidade,
        hashComplementar: m.hashComplementar,
        // Blockchain
        txHash:      m.txHash,
        etherscanUrl: m.txHash ? `https://etherscan.io/tx/${m.txHash}` : null,
      },
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.verificarStatus = async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM musicas WHERE id = ?',
      args: [req.params.id],
    });
    if (!result.rows.length) return res.status(404).json({ erro: 'Obra não encontrada' });
    const m = toObj(result.rows[0]);
    const blockchainStatus = await ethereumService.verificarRegistro(m.txHash);

    // Atualiza status no banco se confirmado on-chain
    if (blockchainStatus?.transaction?.status === 'confirmado' && m.status === 'Pendente') {
      await client.execute({
        sql: 'UPDATE musicas SET status = ? WHERE id = ?',
        args: ['Validado', m.id],
      });
    }

    res.json({
      success: true,
      data: {
        id: m.id,
        titulo: m.titulo,
        tokenId: m.tokenId,
        blockchain: blockchainStatus,
        status: blockchainStatus?.transaction?.status === 'confirmado' ? 'Validado' : m.status,
      },
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
