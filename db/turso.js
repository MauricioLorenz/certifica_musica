const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const initDB = async () => {
  // Tabela de usuários
  await client.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      criadoEm TEXT
    )
  `);

  // Tabela principal de músicas (schema base)
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
      cidLetra TEXT,
      cidIdentidade TEXT,
      cidComplementar TEXT,
      txHash TEXT,
      status TEXT DEFAULT 'Pendente',
      termoAceito INTEGER DEFAULT 0,
      criadoEm TEXT
    )
  `);

  // Migrations incrementais — adicionam colunas sem recriar a tabela
  const novasColunas = [
    // Colunas legadas que podem estar ausentes em instâncias antigas
    'arquivoLetra TEXT',
    'cidLetra TEXT',
    'cidIdentidade TEXT',
    'cidComplementar TEXT',
    'usuario_id TEXT',
    // NFT ERC-721
    'metadataCID TEXT',
    'tokenId TEXT',
    'nftContractAddress TEXT',
    // Hashes SHA-256 de integridade
    'hashObra TEXT',
    'hashLetra TEXT',
    'hashIdentidade TEXT',
    'hashComplementar TEXT',
  ];

  for (const colDef of novasColunas) {
    const colName = colDef.split(' ')[0];
    await client
      .execute(`ALTER TABLE musicas ADD COLUMN ${colDef}`)
      .catch((e) => {
        if (
          !e.message?.includes('duplicate column') &&
          !e.message?.includes('already exists')
        ) {
          console.error(`⚠️  Erro ao adicionar coluna ${colName}:`, e.message);
        }
      });
  }

  console.log('✅ Turso: tabelas e colunas prontas');
};

module.exports = { client, initDB };
