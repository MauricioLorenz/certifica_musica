require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDB } = require('./db/turso');

const app = express();

// Inicializa o banco imediatamente (antes de qualquer rota)
const dbReady = initDB().catch((err) => {
  console.error('❌ Falha ao inicializar Turso:', err.message);
  if (require.main === module) process.exit(1);
});

// ── Raw body para o webhook do Stripe (DEVE vir ANTES do express.json) ──────────
// O Stripe verifica a assinatura usando o body bruto; após express.json() parseá-lo
// a verificação falha. Capturamos o Buffer aqui e o expõe como req.rawBody.
app.use('/api/pagamentos/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body; // Buffer
  next();
});

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // permite requisições sem origin (ex: Postman, mobile) e origens permitidas
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      cb(null, true)
    } else {
      cb(new Error(`CORS bloqueado para: ${origin}`))
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Pasta uploads (apenas em desenvolvimento — na Vercel usa /tmp)
if (process.env.NODE_ENV !== 'production') {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
}

// Garante que o banco está pronto antes de qualquer requisição (cold start serverless)
app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (err) {
    console.error('❌ Banco não disponível:', err.message);
    res.status(503).json({ erro: 'Banco de dados não disponível. Verifique as variáveis de ambiente.' });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/musicas', require('./routes/musicas'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/pagamentos', require('./routes/pagamentos'));
app.use('/api/creditos', require('./routes/creditos'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Turso (libSQL)',
  });
});

// Erro global
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(500).json({ erro: err.message || 'Erro interno do servidor' });
});

// Desenvolvimento local: sobe o servidor HTTP
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  dbReady.then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Certifica Música Backend rodando em http://localhost:${PORT}`);
      console.log(`🗄️  Banco: Turso — ${process.env.TURSO_DATABASE_URL}`);
      console.log(`⛓️  Infura: ${process.env.INFURA_ENDPOINT ? process.env.INFURA_ENDPOINT.substring(0, 40) + '...' : 'não configurado'}\n`);
    });
  });
}

// Exporta o app para o Vercel (serverless)
module.exports = app;
