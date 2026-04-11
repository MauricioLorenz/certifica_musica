const axios = require('axios');
const FormData = require('form-data');

class IpfsService {
  constructor() {
    this.pinataJwt = process.env.PINATA_JWT;
    this.uploadUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  }

  // Upload buffer para IPFS via Pinata (serverless-friendly)
  async uploadBuffer(buffer, filename) {
    try {
      console.log(`📤 Enviando para IPFS (Pinata): ${filename}`);
      const form = new FormData();
      form.append('file', buffer, { filename });

      const response = await axios.post(this.uploadUrl, form, {
        headers: {
          Authorization: `Bearer ${this.pinataJwt}`,
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000, // 60s
      });

      const cid = response.data.IpfsHash;
      console.log(`✅ Upload IPFS bem-sucedido: ${cid}`);
      return { success: true, cid };
    } catch (error) {
      const msg = error.response?.data || error.message;
      console.error('❌ Erro IPFS (Pinata):', msg);
      throw new Error(`Falha ao fazer upload IPFS: ${JSON.stringify(msg)}`);
    }
  }

  // URL pública de acesso ao arquivo
  getGatewayUrl(cid) {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
}

module.exports = new IpfsService();
