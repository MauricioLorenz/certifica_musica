const express = require('express');
const router = express.Router();
const ethereumService = require('../services/ethereumService');

router.get('/balance', async (req, res) => {
  try {
    const balance = await ethereumService.getBalance();
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

router.post('/verificar/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const result = await ethereumService.verificarRegistro(txHash);
    res.json(result);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

router.get('/network', async (req, res) => {
  try {
    const info = await ethereumService.getNetworkInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
