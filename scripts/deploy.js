require('dotenv').config();
const { ethers } = require('ethers');
const solc = require('solc');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔨 Compilando contrato TrackLock.sol...');

  const source = fs.readFileSync(
    path.join(__dirname, '../contracts/TrackLock.sol'),
    'utf8'
  );

  const input = {
    language: 'Solidity',
    sources: { 'TrackLock.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const erros = output.errors.filter(e => e.severity === 'error');
    if (erros.length) {
      console.error('❌ Erros de compilação:', erros);
      process.exit(1);
    }
  }

  const contract = output.contracts['TrackLock.sol']['TrackLock'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  // Salvar ABI para uso no ethereumService
  fs.writeFileSync(
    path.join(__dirname, '../contracts/TrackLock.abi.json'),
    JSON.stringify(abi, null, 2)
  );

  console.log('✅ Compilado com sucesso!');
  console.log('🚀 Fazendo deploy na Sepolia...');

  const provider = new ethers.JsonRpcProvider(process.env.INFURA_ENDPOINT);
  const wallet = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY, provider);

  console.log(`📬 Carteira: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Saldo: ${ethers.formatEther(balance)} ETH`);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployed = await factory.deploy();

  console.log('⏳ Aguardando confirmação...');
  await deployed.waitForDeployment();

  const address = await deployed.getAddress();

  console.log(`\n✅ Contrato deployado com sucesso!`);
  console.log(`📋 CONTRACT_ADDRESS=${address}`);
  console.log(`\n👉 Adicione no seu .env:`);
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log(`ETHEREUM_NETWORK=mainnet`);
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
