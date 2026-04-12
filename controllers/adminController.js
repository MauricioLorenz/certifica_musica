const { client } = require('../db/turso');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [
      usuariosR, musicasR, vouchersR,
      comprasR, usosR, voucherCreditosR,
    ] = await Promise.all([
      client.execute('SELECT COUNT(*) as total FROM usuarios'),
      client.execute('SELECT COUNT(*) as total FROM musicas'),
      client.execute('SELECT COUNT(*) as total FROM vouchers'),
      client.execute(`SELECT COALESCE(SUM(quantidade), 0) as total FROM transacoes_creditos WHERE tipo = 'compra'`),
      client.execute(`SELECT COALESCE(SUM(ABS(quantidade)), 0) as total FROM transacoes_creditos WHERE tipo = 'uso'`),
      client.execute(`SELECT COALESCE(SUM(quantidade), 0) as total FROM transacoes_creditos WHERE tipo = 'voucher'`),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsuarios:      Number(usuariosR.rows[0].total),
        totalMusicas:       Number(musicasR.rows[0].total),
        totalVouchers:      Number(vouchersR.rows[0].total),
        creditosVendidos:   Number(comprasR.rows[0].total),
        certificacoes:      Number(usosR.rows[0].total),
        creditosViaVoucher: Number(voucherCreditosR.rows[0].total),
        receitaTotal:       Number(comprasR.rows[0].total) * 40,
      },
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// POST /api/admin/vouchers
exports.criarVoucher = async (req, res) => {
  try {
    const { codigo, creditos, maxUsos, validade } = req.body;

    if (!codigo?.trim()) return res.status(400).json({ erro: 'Código é obrigatório' });
    if (!creditos || Number(creditos) < 1) return res.status(400).json({ erro: 'Mínimo 1 crédito' });
    if (maxUsos && Number(maxUsos) < 1) return res.status(400).json({ erro: 'maxUsos mínimo é 1' });

    const codigoUpper = codigo.trim().toUpperCase();

    // Verifica unicidade
    const existe = await client.execute({
      sql: 'SELECT id FROM vouchers WHERE codigo = ?',
      args: [codigoUpper],
    });
    if (existe.rows.length) return res.status(409).json({ erro: 'Código já existe' });

    const id = `VCH-${Date.now()}`;
    const criadoEm = new Date().toISOString();

    await client.execute({
      sql: `INSERT INTO vouchers (id, codigo, creditos, maxUsos, usosAtuais, validade, criadoPor, criadoEm, ativo)
            VALUES (?, ?, ?, ?, 0, ?, ?, ?, 1)`,
      args: [
        id,
        codigoUpper,
        Number(creditos),
        Number(maxUsos || 1),
        validade || null,
        req.usuario.id,
        criadoEm,
      ],
    });

    res.status(201).json({
      success: true,
      voucher: { id, codigo: codigoUpper, creditos, maxUsos: Number(maxUsos || 1), validade: validade || null },
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// GET /api/admin/vouchers
exports.listarVouchers = async (req, res) => {
  try {
    const r = await client.execute(
      'SELECT * FROM vouchers ORDER BY criadoEm DESC'
    );
    res.json({ success: true, vouchers: r.rows });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// PATCH /api/admin/vouchers/:id
exports.toggleVoucher = async (req, res) => {
  try {
    await client.execute({
      sql: `UPDATE vouchers SET ativo = CASE WHEN ativo = 1 THEN 0 ELSE 1 END WHERE id = ?`,
      args: [req.params.id],
    });
    const r = await client.execute({
      sql: 'SELECT * FROM vouchers WHERE id = ?',
      args: [req.params.id],
    });
    if (!r.rows.length) return res.status(404).json({ erro: 'Voucher não encontrado' });
    res.json({ success: true, voucher: r.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// GET /api/admin/usuarios
exports.listarUsuarios = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.nome, u.email, u.criadoEm, u.role,
             COALESCE(cu.saldo, 0) AS saldo_creditos,
             (SELECT COUNT(*) FROM musicas m WHERE m.usuario_id = u.id) AS total_musicas
      FROM usuarios u
      LEFT JOIN creditos_usuarios cu ON u.id = cu.usuario_id
      ORDER BY u.criadoEm DESC
    `;
    const r = await client.execute(query);
    res.json({ success: true, usuarios: r.rows });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// PUT /api/admin/usuarios/:id
exports.editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;

    if (!nome?.trim() || !email?.trim()) {
      return res.status(400).json({ erro: 'Nome e Email são obrigatórios' });
    }

    const emailLower = email.toLowerCase().trim();

    // Verifica se já existe outro usuário com o mesmo email
    const existe = await client.execute({
      sql: 'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      args: [emailLower, id],
    });

    if (existe.rows.length) {
      return res.status(409).json({ erro: 'E-mail já está em uso por outro cliente' });
    }

    await client.execute({
      sql: 'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?',
      args: [nome.trim(), emailLower, id],
    });

    res.json({ success: true, mensagem: 'Usuário atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// DELETE /api/admin/usuarios/:id
exports.excluirUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Impede o master admin de ser deletado acidentalmente
    const target = await client.execute({
      sql: 'SELECT email FROM usuarios WHERE id = ?',
      args: [id]
    });
    if (target.rows.length && target.rows[0].email === 'mauriciolorenzinvest@gmail.com') {
      return res.status(403).json({ erro: 'O admin principal não pode ser excluído.' });
    }

    // Exclusão em cascata (musicas, transacoes_creditos e depois creditos e o usuario si)
    await client.execute({ sql: 'DELETE FROM musicas WHERE usuario_id = ?', args: [id] });
    await client.execute({ sql: 'DELETE FROM transacoes_creditos WHERE usuario_id = ?', args: [id] });
    await client.execute({ sql: 'DELETE FROM creditos_usuarios WHERE usuario_id = ?', args: [id] });
    await client.execute({ sql: 'DELETE FROM usuarios WHERE id = ?', args: [id] });

    res.json({ success: true, mensagem: 'Usuário e dados vinculados foram removidos' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};
