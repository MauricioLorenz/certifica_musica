const { ethers } = require('ethers');

// ABI mínimo do contrato ERC-721 CertificaMusica — apenas o que o backend usa
const NFT_ABI = [
  'function mint(address to, string calldata uri) external returns (uint256)',
  'function nextTokenId() external view returns (uint256)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
];

class EthereumService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.INFURA_ENDPOINT);
    this.contractAddress = process.env.CONTRACT_ADDRESS;

    if (process.env.ETHEREUM_PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY, this.provider);
    }
  }

  _getContract(comAssinatura = false) {
    if (!this.contractAddress) throw new Error('CONTRACT_ADDRESS não configurado');
    const signer = comAssinatura ? this.wallet : this.provider;
    return new ethers.Contract(this.contractAddress, NFT_ABI, signer);
  }

  /**
   * Lê o próximo tokenId do contrato (view call, sem gas).
   * Usado antes do mint para salvar o tokenId otimisticamente no banco.
   */
  async getNextTokenId() {
    const contract = this._getContract(false);
    const next = await contract.nextTokenId();
    return next.toString();
  }

  /**
   * Minta um NFT ERC-721 para `to` com tokenURI apontando para metadata no IPFS.
   * Não aguarda confirmação (evita timeout no Vercel) — status fica 'pendente'.
   *
   * @param {string} to        Endereço do recebedor
   * @param {string} tokenURI  URI no formato "ipfs://CID"
   * @returns {{ txHash, tokenId, tokenURI, status }}
   */
  async mintNFT(to, tokenURI) {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`⛓️  Rede conectada (Block: ${blockNumber})`);

      // Lê tokenId antes do mint (nonce sequencial = valor confiável)
      const tokenId = await this.getNextTokenId();

      const contract = this._getContract(true);
      const tx = await contract.mint(to, tokenURI);

      console.log(`⏳ Mint enviado: ${tx.hash} | tokenId previsto: ${tokenId}`);

      return {
        success: true,
        transaction: {
          txHash: tx.hash,
          tokenId,
          tokenURI,
          contractAddress: this.contractAddress,
          timestamp: Math.floor(Date.now() / 1000),
          status: 'pendente',
        },
        message: 'NFT mintado — confirmação on-chain em andamento',
      };
    } catch (error) {
      console.error('❌ Erro ao mintar NFT:', error.message);
      throw new Error(`Falha ao registrar no blockchain: ${error.message}`);
    }
  }

  /**
   * Verifica o status de uma transação pelo hash.
   * Funciona para qualquer tx — mint ou registro antigo.
   */
  async verificarRegistro(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) return { success: false, message: 'Transação não encontrada' };

      const receipt = await this.provider.getTransactionReceipt(txHash);
      const confirmado = !!receipt && receipt.status === 1;

      return {
        success: true,
        transaction: {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          blockNumber: tx.blockNumber,
          status: confirmado ? 'confirmado' : 'pendente',
        },
      };
    } catch (error) {
      console.error('❌ Erro ao verificar:', error.message);
      throw new Error(`Falha ao verificar transação: ${error.message}`);
    }
  }

  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      return {
        name: network.name,
        chainId: network.chainId.toString(),
        blockNumber,
        contractAddress: this.contractAddress,
      };
    } catch (error) {
      throw new Error(`Erro ao obter rede: ${error.message}`);
    }
  }
}

module.exports = new EthereumService();
