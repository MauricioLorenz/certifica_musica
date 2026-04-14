const { createClient } = require('@libsql/client');

let client;

const initDB = async () => {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL não configurado. Defina as variáveis de ambiente na Vercel.');
  }

  client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

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

  // ── Coluna role em usuarios ───────────────────────────────────────────────────
  await client
    .execute(`ALTER TABLE usuarios ADD COLUMN role TEXT DEFAULT 'user'`)
    .catch((e) => {
      if (!e.message?.includes('duplicate column') && !e.message?.includes('already exists')) {
        console.error('⚠️  Erro ao adicionar coluna role:', e.message);
      }
    });

  // ── Tabela de saldo de créditos ───────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS creditos_usuarios (
      usuario_id   TEXT PRIMARY KEY,
      saldo        INTEGER NOT NULL DEFAULT 0,
      atualizadoEm TEXT
    )
  `);

  // ── Log de movimentações de crédito ──────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS transacoes_creditos (
      id         TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL,
      tipo       TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      referencia TEXT,
      criadoEm   TEXT NOT NULL
    )
  `);

  // Índice único — garante idempotência em retentativas de webhook do Stripe
  await client
    .execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_transacoes_ref ON transacoes_creditos(referencia)`)
    .catch(() => {});

  // ── Vouchers criados pelo admin ───────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id         TEXT PRIMARY KEY,
      codigo     TEXT NOT NULL UNIQUE,
      creditos   INTEGER NOT NULL,
      maxUsos    INTEGER NOT NULL DEFAULT 1,
      usosAtuais INTEGER NOT NULL DEFAULT 0,
      validade   TEXT,
      criadoPor  TEXT NOT NULL,
      criadoEm   TEXT NOT NULL,
      ativo      INTEGER NOT NULL DEFAULT 1
    )
  `);

  // ── Registro de resgates (impede resgate duplo pelo mesmo usuário) ────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS vouchers_usados (
      id         TEXT PRIMARY KEY,
      voucher_id TEXT NOT NULL,
      usuario_id TEXT NOT NULL,
      criadoEm   TEXT NOT NULL,
      UNIQUE(voucher_id, usuario_id)
    )
  `);

  // ── Tokens de redefinição de senha ───────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS reset_tokens (
      id       TEXT PRIMARY KEY,
      email    TEXT NOT NULL,
      token    TEXT NOT NULL UNIQUE,
      expiraEm TEXT NOT NULL,
      usado    INTEGER NOT NULL DEFAULT 0
    )
  `);

  console.log('✅ Turso: tabelas e colunas prontas');
};

module.exports = {
  get client() {
    if (!client) throw new Error('Banco de dados não inicializado. Aguarde o servidor iniciar.');
    return client;
  },
  initDB,
};
