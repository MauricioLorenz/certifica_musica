const { client } = require('../db/turso');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

const SECRET = process.env.JWT_SECRET || 'sound_ledger_secret_key_2024';

const gerarToken = (u) => {
  const isMasterAdmin = u.email === 'mauriciolorenzinvest@gmail.com';
  return jwt.sign({ id: u.id, email: u.email, nome: u.nome, role: isMasterAdmin ? 'admin' : (u.role || 'user') }, SECRET, { expiresIn: '7d' });
};

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

    const isMasterAdmin = email.toLowerCase().trim() === 'mauriciolorenzinvest@gmail.com';
    const usuario = { id, nome: nome.trim(), email: email.toLowerCase().trim(), role: isMasterAdmin ? 'admin' : 'user' };
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

    const isMasterAdmin = row.email === 'mauriciolorenzinvest@gmail.com';
    const usuario = { id: row.id, nome: row.nome, email: row.email, role: isMasterAdmin ? 'admin' : (row.role || 'user') };
    res.json({ success: true, token: gerarToken(usuario), usuario });
  } catch (err) {
    console.error('❌ Erro ao fazer login:', err.message);
    res.status(500).json({ erro: err.message });
  }
};

exports.solicitarReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ erro: 'E-mail obrigatório' });

    // Resposta sempre igual para não revelar se o e-mail existe
    const resposta = { success: true, mensagem: 'Se esse e-mail estiver cadastrado, você receberá um link em instantes.' };

    const result = await client.execute({
      sql: 'SELECT id FROM usuarios WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });
    if (!result.rows.length) return res.json(resposta);

    const token = crypto.randomBytes(32).toString('hex');
    const expiraEm = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const id = `RT-${Date.now()}`;

    await client.execute({
      sql: 'INSERT INTO reset_tokens (id, email, token, expiraEm, usado) VALUES (?,?,?,?,0)',
      args: [id, email.toLowerCase().trim(), token, expiraEm],
    });

    await emailService.enviarResetSenha(email.toLowerCase().trim(), token);
    res.json(resposta);
  } catch (err) {
    const detalhe = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error('❌ Erro ao solicitar reset:', detalhe);
    res.status(500).json({ erro: `Erro ao enviar e-mail: ${detalhe}` });
  }
};

exports.redefinirSenha = async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) return res.status(400).json({ erro: 'Dados incompletos' });
    if (novaSenha.length < 6) return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });

    const agora = new Date().toISOString();
    const result = await client.execute({
      sql: 'SELECT * FROM reset_tokens WHERE token = ? AND usado = 0 AND expiraEm > ?',
      args: [token, agora],
    });
    if (!result.rows.length) return res.status(400).json({ erro: 'Link inválido ou expirado. Solicite um novo.' });

    const row = result.rows[0];
    const hash = await bcrypt.hash(novaSenha, 12);

    await client.execute({
      sql: 'UPDATE usuarios SET senha_hash = ? WHERE email = ?',
      args: [hash, row.email],
    });
    await client.execute({
      sql: 'UPDATE reset_tokens SET usado = 1 WHERE token = ?',
      args: [token],
    });

    res.json({ success: true, mensagem: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error('❌ Erro ao redefinir senha:', err.message);
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
