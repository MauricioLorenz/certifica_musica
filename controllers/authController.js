const { client } = require('../db/turso');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'sound_ledger_secret_key_2024';

const gerarToken = (u) =>
  jwt.sign({ id: u.id, email: u.email, nome: u.nome, role: u.role || 'user' }, SECRET, { expiresIn: '7d' });

exports.registrar = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome?.trim() || !email?.trim() || !senha)
      return res.status(400).json({ erro: 'Preencha todos os campos' });
    if (senha.length < 6)
      return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });

    const existe = await client.execute({
      sql: 'SELECT id FROM usuarios WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });
    if (existe.rows.length)
      return res.status(400).json({ erro: 'E-mail já cadastrado' });

    const senhaHash = await bcrypt.hash(senha, 12);
    const id = `USR-${Date.now()}`;
    const criadoEm = new Date().toISOString();

    await client.execute({
      sql: 'INSERT INTO usuarios (id, nome, email, senha_hash, criadoEm) VALUES (?,?,?,?,?)',
      args: [id, nome.trim(), email.toLowerCase().trim(), senhaHash, criadoEm],
    });

    // Inicializa saldo de créditos zerado para o novo usuário
    await client.execute({
      sql: 'INSERT OR IGNORE INTO creditos_usuarios (usuario_id, saldo, atualizadoEm) VALUES (?, 0, ?)',
      args: [id, criadoEm],
    });

    const usuario = { id, nome: nome.trim(), email: email.toLowerCase().trim(), role: 'user' };
    res.status(201).json({ success: true, token: gerarToken(usuario), usuario });
  } catch (err) {
    console.error('❌ Erro ao registrar usuário:', err.message);
    res.status(500).json({ erro: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email?.trim() || !senha)
      return res.status(400).json({ erro: 'Preencha todos os campos' });

    const result = await client.execute({
      sql: 'SELECT * FROM usuarios WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });
    if (!result.rows.length)
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });

    const row = result.rows[0];
    const senhaOk = await bcrypt.compare(senha, row.senha_hash);
    if (!senhaOk)
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });

    const usuario = { id: row.id, nome: row.nome, email: row.email, role: row.role || 'user' };
    res.json({ success: true, token: gerarToken(usuario), usuario });
  } catch (err) {
    console.error('❌ Erro ao fazer login:', err.message);
    res.status(500).json({ erro: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT id, nome, email, criadoEm FROM usuarios WHERE id = ?',
      args: [req.usuario.id],
    });
    if (!result.rows.length)
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    const row = result.rows[0];
    res.json({ success: true, usuario: { id: row.id, nome: row.nome, email: row.email, criadoEm: row.criadoEm } });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};
