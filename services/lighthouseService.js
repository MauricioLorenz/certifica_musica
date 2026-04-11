const axios = require('axios');
const FormData = require('form-data');

class LighthouseService {
  constructor() {
    this.apiKey = process.env.LIGHTHOUSE_API_KEY;
    this.uploadUrl = 'https://node.lighthouse.storage/api/v0/add';
  }

  // Upload buffer para IPFS via API REST do Lighthouse (sem fs-extra)
  async uploadBuffer(buffer, filename) {
    try {
      console.log(`📤 Enviando para IPFS: ${filename}`);
      const form = new FormData();
      form.append('file', buffer, { filename });

      const response = await axios.post(this.uploadUrl, form, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const cid = response.data.Hash;
      console.log(`✅ Upload IPFS bem-sucedido: ${cid}`);
      return { success: true, cid };
    } catch (error) {
      const msg = error.response?.data || error.message;
      console.error('❌ Erro Lighthouse:', msg);
      throw new Error(`Falha ao fazer upload IPFS: ${JSON.stringify(msg)}`);
    }
  }

  // URL pública de acesso ao arquivo
  getGatewayUrl(cid) {
    return `https://gateway.lighthouse.storage/ipfs/${cid}`;
  }
}

module.exports = new LighthouseService();
