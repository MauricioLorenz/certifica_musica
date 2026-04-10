const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class EthereumService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.INFURA_ENDPOINT);
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.network = process.env.ETHEREUM_NETWORK;

    if (process.env.ETHEREUM_PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY, this.provider);
    }

    // Carregar ABI do contrato compilado
    const abiPath = path.join(__dirname, '../contracts/TrackLock.abi.json');
    if (fs.existsSync(abiPath)) {
      this.abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    }
  }

  _getContract(comAssinatura = false) {
    if (!this.contractAddress) throw new Error('CONTRACT_ADDRESS não configurado no .env');
    if (!this.abi) throw new Error('ABI do contrato não encontrada');
    const signer = comAssinatura ? this.wallet : this.provider;
    return new ethers.Contract(this.contractAddress, this.abi, signer);
  }

  // CREATE: Registrar música no blockchain
  async registrarMusica(titulo, compositor, cidPartitura, cidLetra = '', cidIdentidade = '', cidComplementar = '') {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`⛓️  Conectado à Mainnet (Block: ${blockNumber})`);

      const contract = this._getContract(true);
      const tx = await contract.registrar(titulo, compositor, cidPartitura, cidLetra, cidIdentidade, cidComplementar);

      console.log(`⏳ Transação enviada: ${tx.hash}`);
      // Não aguardamos a confirmação para evitar timeout em serverless (Vercel)
      // A tx foi enviada e o hash já é válido; confirmação ocorre on-chain em ~15s

      return {
        success: true,
        transaction: {
          txHash: tx.hash,
          blockNumber: null,
          titulo,
          compositor,
          cid: cidPartitura,
          timestamp: Math.floor(Date.now() / 1000),
          status: 'pendente'
        },
        message: 'Transação enviada — confirmação on-chain em andamento'
      };
    } catch (error) {
      console.error('❌ Erro ao registrar:', error.message);
      throw new Error(`Falha ao registrar no blockchain: ${error.message}`);
    }
  }

  // READ: Verificar registro no blockchain
  async verificarRegistro(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);

      if (!tx) {
        return { success: false, message: 'Transação não encontrada' };
      }

      console.log(`✅ Transação verificada: ${txHash}`);
      return {
        success: true,
        transaction: {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          blockNumber: tx.blockNumber,
          status: 'confirmado'
        }
      };
    } catch (error) {
      console.error('❌ Erro ao verificar:', error.message);
      throw new Error(`Falha ao verificar transação: ${error.message}`);
    }
  }

  // UTILITÁRIO: Obter saldo da conta
  async getBalance() {
    try {
      const address = this.wallet ? this.wallet.address : process.env.ETHEREUM_ADDRESS;
      const balanceWei = await this.provider.getBalance(address);
      const balanceEth = ethers.formatEther(balanceWei);

      return { address, balanceWei: balanceWei.toString(), balanceEth };
    } catch (error) {
      throw new Error(`Erro ao obter saldo: ${error.message}`);
    }
  }

  // UTILITÁRIO: Verificar conexão com a rede
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        name: network.name,
        chainId: network.chainId.toString(),
        blockNumber,
        contractAddress: this.contractAddress
      };
    } catch (error) {
      throw new Error(`Erro ao obter rede: ${error.message}`);
    }
  }
}

module.exports = new EthereumService();
