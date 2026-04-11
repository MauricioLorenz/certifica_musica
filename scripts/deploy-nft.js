/**
 * Deploy do contrato CertificaMusica (ERC-721)
 *
 * Pré-requisitos:
 *   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
 *
 * Uso:
 *   npx hardhat run scripts/deploy-nft.js --network mainnet
 *   npx hardhat run scripts/deploy-nft.js --network sepolia   (para testes)
 *
 * Após o deploy, copie o CONTRACT_ADDRESS exibido e atualize no Vercel.
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('🔨 Deploy do contrato CertificaMusica (ERC-721)');
  console.log(`📬 Carteira: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Saldo:    ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    console.error('❌ Saldo insuficiente para pagar o gas!');
    process.exit(1);
  }

  const Factory = await ethers.getContractFactory('CertificaMusica');
  console.log('⏳ Enviando transação de deploy...');
  const contract = await Factory.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`\n✅ Contrato deployado com sucesso!`);
  console.log(`📋 Endereço: ${address}`);
  console.log(`\n👉 Adicione/atualize no Vercel e no .env:`);
  console.log(`   CONTRACT_ADDRESS=${address}`);

  // Salva ABI compilada pelo Hardhat para referência (backend usa ABI inline)
  const artifact = await ethers.getContractFactory('CertificaMusica');
  const abi = JSON.parse(artifact.interface.formatJson());
  fs.writeFileSync(
    path.join(__dirname, '../contracts/CertificaMusica.abi.json'),
    JSON.stringify(abi, null, 2)
  );
  console.log('📄 ABI salva em contracts/CertificaMusica.abi.json');
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
