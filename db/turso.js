const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const initDB = async () => {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      criadoEm TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS musicas (
      id TEXT PRIMARY KEY,
      usuario_id TEXT,
      titulo TEXT NOT NULL,
      genero TEXT DEFAULT 'Música',
      estadoObra TEXT DEFAULT 'Inédita',
      totalPaginas INTEGER,
      tipoComposicao TEXT,
      coletanea INTEGER DEFAULT 0,
      autores TEXT DEFAULT '[]',
      arquivoLetra TEXT,
      arquivoObra TEXT,
      arquivoIdentidade TEXT,
      arquivoComplementar TEXT,
      descricaoComplementar TEXT,
      tipoServico TEXT DEFAULT 'Registro Simples',
      formaPagamento TEXT,
      cid TEXT,
      cidIdentidade TEXT,
      cidComplementar TEXT,
      txHash TEXT,
      status TEXT DEFAULT 'Pendente',
      termoAceito INTEGER DEFAULT 0,
      criadoEm TEXT
    )
  `);

  for (const col of ['arquivoLetra', 'cidLetra', 'cidIdentidade', 'cidComplementar', 'usuario_id']) {
    await client.execute(`ALTER TABLE musicas ADD COLUMN ${col} TEXT`).catch((e) => {
      if (!e.message?.includes('duplicate column') && !e.message?.includes('already exists')) {
        console.error(`⚠️  Erro ao adicionar coluna ${col}:`, e.message);
      }
    });
  }

  console.log('✅ Turso: tabelas prontas');
};

module.exports = { client, initDB };
