const axios = require('axios');
const FormData = require('form-data');

class IpfsService {
  constructor() {
    this.pinataJwt = process.env.PINATA_JWT;
    this.uploadFileUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    this.uploadJsonUrl = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  }

  // Upload de arquivo (Buffer) para IPFS via Pinata
  async uploadBuffer(buffer, filename) {
    try {
      console.log(`📤 IPFS upload: ${filename}`);
      const form = new FormData();
      form.append('file', buffer, { filename });

      const response = await axios.post(this.uploadFileUrl, form, {
        headers: {
          Authorization: `Bearer ${this.pinataJwt}`,
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000,
      });

      const cid = response.data.IpfsHash;
      console.log(`✅ IPFS OK: ${cid}`);
      return { success: true, cid };
    } catch (error) {
      const msg = error.response?.data || error.message;
      console.error('❌ IPFS upload erro:', msg);
      throw new Error(`Falha ao fazer upload IPFS: ${JSON.stringify(msg)}`);
    }
  }

  // Upload de JSON (metadata ERC-721) para IPFS via Pinata
  async uploadJSON(obj, name) {
    try {
      console.log(`📤 IPFS JSON upload: ${name}`);
      const response = await axios.post(
        this.uploadJsonUrl,
        {
          pinataContent: obj,
          pinataMetadata: { name },
        },
        {
          headers: {
            Authorization: `Bearer ${this.pinataJwt}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const cid = response.data.IpfsHash;
      console.log(`✅ IPFS JSON OK: ${cid}`);
      return { success: true, cid };
    } catch (error) {
      const msg = error.response?.data || error.message;
      console.error('❌ IPFS JSON erro:', msg);
      throw new Error(`Falha ao fazer upload da metadata: ${JSON.stringify(msg)}`);
    }
  }

  // URL pública de acesso ao arquivo via gateway IPFS público
  // Usa o gateway do cloudflare (público, sem autenticação)
  // Fallback: https://ipfs.io/ipfs/${cid}
  getGatewayUrl(cid) {
    return `https://cloudflare-ipfs.com/ipfs/${cid}`;
  }

  // URL alternativa via gateway.pinata.cloud (requer autenticação)
  getPrivateGatewayUrl(cid) {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
}

module.exports = new IpfsService();
