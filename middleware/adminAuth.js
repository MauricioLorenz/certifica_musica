const jwt = require('jsonwebtoken');
const { client } = require('../db/turso');

const SECRET = process.env.JWT_SECRET || 'sound_ledger_secret_key_2024';

module.exports = async function adminAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const token = auth.slice(7);
    const decoded = jwt.verify(token, SECRET);

    // Re-verifica role no banco para detectar mudanças desde a emissão do JWT
    const r = await client.execute({
      sql: 'SELECT role, email FROM usuarios WHERE id = ?',
      args: [decoded.id],
    });

    if (!r.rows.length || r.rows[0].email !== 'mauriciolorenzinvest@gmail.com') {
      return res.status(403).json({ erro: 'Acesso restrito a administradores' });
    }

    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido' });
  }
};
