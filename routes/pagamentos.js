const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ctrl = require('../controllers/pagamentosController');

// Cria PaymentIntent para compra de 1 crédito (R$40)
router.post('/criar-intencao', authMiddleware, ctrl.criarIntencao);

// Webhook do Stripe — sem autenticação JWT, usa assinatura Stripe
// O raw body é capturado no server.js antes do express.json()
router.post('/webhook', ctrl.webhook);

module.exports = router;
