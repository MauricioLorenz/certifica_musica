const { client } = require('../db/turso');
const ethereumService = require('../services/ethereumService');
const lighthouseService = require('../services/lighthouseService');
const path = require('path');

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
  cid: row.cid,
  cidLetra: row.cidLetra,
  cidIdentidade: row.cidIdentidade,
  cidComplementar: row.cidComplementar,
  txHash: row.txHash,
  status: row.status,
  termoAceito: Boolean(row.termoAceito),
  criadoEm: row.criadoEm,
});

exports.criarMusica = async (req, res) => {
  try {
    const {
      titulo, genero, estadoObra, totalPaginas, tipoComposicao, coletanea,
      autores, tipoServico, formaPagamento, termoAceito, descricaoComplementar
    } = req.body;

    if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório' });
    if (!termoAceito) return res.status(400).json({ erro: 'Aceite o termo de declaração' });

    const autoresArr = typeof autores === 'string' ? JSON.parse(autores) : (autores || []);
    const compositor = autoresArr[0]?.nomeCompleto || 'Desconhecido';

    // Upload de todos os arquivos para IPFS
    const arquivos = req.files || {};
    let cid = null, cidIdentidade = null, cidComplementar = null;

    const UPLOADS_DIR = process.env.NODE_ENV === 'production'
      ? '/tmp'
      : path.join(__dirname, '../uploads');

    const uploadSe = async (campo) => {
      if (!arquivos[campo]?.[0]) return null;
      const filePath = path.join(UPLOADS_DIR, arquivos[campo][0].filename);
      console.log(`📤 Enviando ${campo} para IPFS...`);
      const r = await lighthouseService.uploadArquivo(filePath);
      return r.cid;
    };

    const cidLetra  = await uploadSe('arquivoLetra');
    cid             = await uploadSe('arquivoObra') || `QmTL${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    cidIdentidade   = await uploadSe('arquivoIdentidade');
    cidComplementar = await uploadSe('arquivoComplementar');

    const blockchainResult = await ethereumService.registrarMusica(
      titulo, compositor,
      cid,
      cidLetra || '',
      cidIdentidade || '',
      cidComplementar || ''
    );

    const id = `SL-${Date.now()}`;
    const criadoEm = new Date().toISOString();
    const usuario_id = req.usuario?.id || null;

    await client.execute({
      sql: `INSERT INTO musicas (
        id, usuario_id, titulo, genero, estadoObra, totalPaginas, tipoComposicao, coletanea,
        autores, arquivoLetra, arquivoObra, arquivoIdentidade, arquivoComplementar, descricaoComplementar,
        tipoServico, formaPagamento, cid, cidLetra, cidIdentidade, cidComplementar, txHash, status, termoAceito, criadoEm
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        arquivos.arquivoLetra?.[0]?.filename || null,
        arquivos.arquivoObra?.[0]?.filename || null,
        arquivos.arquivoIdentidade?.[0]?.filename || null,
        arquivos.arquivoComplementar?.[0]?.filename || null,
        descricaoComplementar || null,
        tipoServico || 'Registro Simples',
        formaPagamento || 'PIX',
        cid,
        cidLetra,
        cidIdentidade,
        cidComplementar,
        blockchainResult.transaction.txHash,
        'Validado',
        1,
        criadoEm,
      ],
    });

    const result = await client.execute({ sql: 'SELECT * FROM musicas WHERE id = ?', args: [id] });
    const musica = toObj(result.rows[0]);

    console.log(`✅ Obra registrada no Turso: ${id}`);
    const cidUrl = cid ? lighthouseService.getGatewayUrl(cid) : null;
    res.status(201).json({ success: true, data: { ...musica, cidUrl }, message: 'Obra registrada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao registrar:', error.message);
    res.status(500).json({ erro: error.message });
  }
};

exports.obterMusicas = async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM musicas WHERE usuario_id = ? ORDER BY criadoEm DESC',
      args: [req.usuario.id],
    });
    const musicas = result.rows.map(toObj);
    res.json({ success: true, total: musicas.length, data: musicas });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.obterMusica = async (req, res) => {
  try {
    const result = await client.execute({ sql: 'SELECT * FROM musicas WHERE id = ?', args: [req.params.id] });
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

    const sets = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => req.body[f]);

    await client.execute({ sql: `UPDATE musicas SET ${sets} WHERE id = ?`, args: [...values, req.params.id] });
    const result = await client.execute({ sql: 'SELECT * FROM musicas WHERE id = ?', args: [req.params.id] });
    if (!result.rows.length) return res.status(404).json({ erro: 'Obra não encontrada' });
    res.json({ success: true, data: toObj(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.deletarMusica = async (req, res) => {
  try {
    const result = await client.execute({ sql: 'SELECT * FROM musicas WHERE id = ?', args: [req.params.id] });
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

exports.verificarObra = async (req, res) => {
  try {
    const result = await client.execute({ sql: 'SELECT * FROM musicas WHERE id = ?', args: [req.params.id] });
    if (!result.rows.length) return res.status(404).json({ erro: 'Obra não encontrada' });
    const musica = toObj(result.rows[0]);
    const cidUrl           = musica.cid            ? lighthouseService.getGatewayUrl(musica.cid)            : null;
    const cidLetraUrl      = musica.cidLetra       ? lighthouseService.getGatewayUrl(musica.cidLetra)       : null;
    const cidIdentidadeUrl = musica.cidIdentidade  ? lighthouseService.getGatewayUrl(musica.cidIdentidade)  : null;
    const cidComplementarUrl = musica.cidComplementar ? lighthouseService.getGatewayUrl(musica.cidComplementar) : null;
    const etherscanUrl     = musica.txHash         ? `https://sepolia.etherscan.io/tx/${musica.txHash}`     : null;

    res.json({
      success: true,
      data: {
        id: musica.id,
        titulo: musica.titulo,
        genero: musica.genero,
        estadoObra: musica.estadoObra,
        tipoComposicao: musica.tipoComposicao,
        tipoServico: musica.tipoServico,
        autores: musica.autores,
        status: musica.status,
        criadoEm: musica.criadoEm,
        cid: musica.cid,
        cidUrl,
        cidLetra: musica.cidLetra,
        cidLetraUrl,
        cidIdentidade: musica.cidIdentidade,
        cidIdentidadeUrl,
        cidComplementar: musica.cidComplementar,
        cidComplementarUrl,
        txHash: musica.txHash,
        etherscanUrl,
      }
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.verificarStatus = async (req, res) => {
  try {
    const result = await client.execute({ sql: 'SELECT * FROM musicas WHERE id = ?', args: [req.params.id] });
    if (!result.rows.length) return res.status(404).json({ erro: 'Obra não encontrada' });
    const musica = toObj(result.rows[0]);
    const blockchainStatus = await ethereumService.verificarRegistro(musica.txHash);
    res.json({ success: true, data: { id: musica.id, titulo: musica.titulo, blockchain: blockchainStatus, status: musica.status } });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
