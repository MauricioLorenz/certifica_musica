require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDB } = require('./db/turso');

const app = express();

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

// Pasta uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/musicas', require('./routes/musicas'));
app.use('/api/blockchain', require('./routes/blockchain'));

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

const PORT = process.env.PORT || 3001;

const iniciar = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 Certifica Música Backend rodando em http://localhost:${PORT}`);
      console.log(`🗄️  Banco: Turso — ${process.env.TURSO_DATABASE_URL}`);
      console.log(`⛓️  Infura: ${process.env.INFURA_ENDPOINT ? process.env.INFURA_ENDPOINT.substring(0, 40) + '...' : 'não configurado'}\n`);
    });
  } catch (err) {
    console.error('❌ Falha ao conectar ao Turso:', err.message);
    process.exit(1);
  }
};

iniciar();
