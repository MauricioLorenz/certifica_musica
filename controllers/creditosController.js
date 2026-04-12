const { client } = require('../db/turso');
const creditosService = require('../services/creditosService');

// POST /api/creditos/resgatar-voucher
exports.resgatarVoucher = async (req, res) => {
  try {
    const { codigo } = req.body;
    if (!codigo?.trim()) return res.status(400).json({ erro: 'Código do voucher é obrigatório' });

    const usuarioId = req.usuario.id;
    const codigoUpper = codigo.trim().toUpperCase();

    // 1. Busca o voucher
    const vr = await client.execute({
      sql: 'SELECT * FROM vouchers WHERE codigo = ? AND ativo = 1',
      args: [codigoUpper],
    });
    if (!vr.rows.length) return res.status(404).json({ erro: 'Voucher não encontrado ou inativo' });
    const voucher = vr.rows[0];

    // 2. Verifica validade
    if (voucher.validade && new Date(voucher.validade) < new Date()) {
      return res.status(410).json({ erro: 'Voucher expirado' });
    }

    // 3. Verifica limite de usos
    if (Number(voucher.usosAtuais) >= Number(voucher.maxUsos)) {
      return res.status(409).json({ erro: 'Voucher esgotado' });
    }

    // 4. Verifica se este usuário já resgatou
    const ur = await client.execute({
      sql: 'SELECT id FROM vouchers_usados WHERE voucher_id = ? AND usuario_id = ?',
      args: [voucher.id, usuarioId],
    });
    if (ur.rows.length) return res.status(409).json({ erro: 'Voucher já utilizado por este usuário' });

    // 5. Registra o uso e incrementa contador em batch atômico
    const usadoId = `VU-${Date.now()}`;
    const agora = new Date().toISOString();
    await client.batch(
      [
        {
          sql: `INSERT INTO vouchers_usados (id, voucher_id, usuario_id, criadoEm) VALUES (?, ?, ?, ?)`,
          args: [usadoId, voucher.id, usuarioId, agora],
        },
        {
          sql: `UPDATE vouchers SET usosAtuais = usosAtuais + 1 WHERE id = ?`,
          args: [voucher.id],
        },
      ],
      'write'
    );

    // 6. Adiciona créditos
    await creditosService.adicionarCreditos(
      usuarioId,
      Number(voucher.creditos),
      'voucher',
      codigoUpper
    );

    res.json({
      success: true,
      creditosAdicionados: Number(voucher.creditos),
      mensagem: `${voucher.creditos} crédito(s) adicionado(s) com sucesso`,
    });
  } catch (err) {
    console.error('❌ Erro ao resgatar voucher:', err.message);
    res.status(500).json({ erro: err.message });
  }
};

// GET /api/creditos/saldo
exports.getSaldo = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const [saldo, historico] = await Promise.all([
      creditosService.getSaldo(usuarioId),
      creditosService.getHistorico(usuarioId),
    ]);
    res.json({ success: true, saldo, historico });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};
