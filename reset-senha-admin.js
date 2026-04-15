require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');

const NOVA_SENHA = 'sucess10';

async function resetar() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const hash = await bcrypt.hash(NOVA_SENHA, 12);

  const result = await client.execute({
    sql: 'UPDATE usuarios SET senha_hash = ? WHERE email = ?',
    args: [hash, 'mauriciolorenzinvest@gmail.com'],
  });

  if (result.rowsAffected === 0) {
    console.log('❌ Usuário não encontrado. Verifique o email.');
  } else {
    console.log(`✅ Senha do admin resetada para: ${NOVA_SENHA}`);
  }

  process.exit(0);
}

resetar().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
