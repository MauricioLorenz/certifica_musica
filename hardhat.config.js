require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    mainnet: {
      url: process.env.INFURA_ENDPOINT || "",
      accounts: process.env.ETHEREUM_PRIVATE_KEY
        ? [process.env.ETHEREUM_PRIVATE_KEY]
        : [],
      chainId: 1,
    },
    sepolia: {
      url: process.env.INFURA_ENDPOINT_SEPOLIA || "",
      accounts: process.env.ETHEREUM_PRIVATE_KEY
        ? [process.env.ETHEREUM_PRIVATE_KEY]
        : [],
      chainId: 11155111,
    },
  },
};
