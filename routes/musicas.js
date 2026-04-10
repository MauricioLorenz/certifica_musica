const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const musicasController = require('../controllers/musicasController');
const authMiddleware = require('../middleware/auth');

// Na Vercel (serverless) apenas /tmp é gravável; localmente usa ./uploads
const UPLOADS_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp'
  : path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Apenas arquivos PDF são aceitos'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const uploadFields = upload.fields([
  { name: 'arquivoLetra', maxCount: 1 },
  { name: 'arquivoObra', maxCount: 1 },
  { name: 'arquivoIdentidade', maxCount: 1 },
  { name: 'arquivoComplementar', maxCount: 1 },
]);

router.get('/:id/verificar', musicasController.verificarObra);          // público
router.post('/', authMiddleware, uploadFields, musicasController.criarMusica);
router.get('/', authMiddleware, musicasController.obterMusicas);
router.get('/:id/status', authMiddleware, musicasController.verificarStatus);
router.get('/:id', authMiddleware, musicasController.obterMusica);
router.put('/:id', authMiddleware, musicasController.atualizarMusica);
router.delete('/:id', authMiddleware, musicasController.deletarMusica);

module.exports = router;
