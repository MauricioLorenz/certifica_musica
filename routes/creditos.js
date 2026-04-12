const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ctrl = require('../controllers/creditosController');

router.get('/saldo', authMiddleware, ctrl.getSaldo);
router.post('/resgatar-voucher', authMiddleware, ctrl.resgatarVoucher);

module.exports = router;
