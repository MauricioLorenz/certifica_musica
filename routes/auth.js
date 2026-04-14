const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/registrar', authController.registrar);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/solicitar-reset', authController.solicitarReset);
router.post('/redefinir-senha', authController.redefinirSenha);

module.exports = router;
