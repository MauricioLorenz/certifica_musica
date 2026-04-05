const lighthouse = require('@lighthouse-web3/sdk');

class LighthouseService {
  constructor() {
    this.apiKey = process.env.LIGHTHOUSE_API_KEY;
  }

  // Upload arquivo para IPFS via Lighthouse
  async uploadArquivo(filePath) {
    try {
      console.log(`📤 Enviando para IPFS: ${filePath}`);
      const response = await lighthouse.upload(filePath, this.apiKey);
      const cid = response.data.Hash;
      console.log(`✅ Upload IPFS bem-sucedido: ${cid}`);
      return { success: true, cid };
    } catch (error) {
      console.error('❌ Erro Lighthouse:', error.message);
      throw new Error(`Falha ao fazer upload IPFS: ${error.message}`);
    }
  }

  // URL pública de acesso ao arquivo
  getGatewayUrl(cid) {
    return `https://gateway.lighthouse.storage/ipfs/${cid}`;
  }
}

module.exports = new LighthouseService();
