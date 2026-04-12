const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const ctrl = require('../controllers/adminController');

// Todas as rotas admin exigem role=admin
router.use(adminAuth);

router.get('/stats', ctrl.getStats);
router.post('/vouchers', ctrl.criarVoucher);
router.get('/vouchers', ctrl.listarVouchers);
router.patch('/vouchers/:id', ctrl.toggleVoucher);

module.exports = router;
