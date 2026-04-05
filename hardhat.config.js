require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    mainnet: {
      url: process.env.INFURA_ENDPOINT,
      accounts: [process.env.ETHEREUM_PRIVATE_KEY],
      chainId: 1,
    },
  },
};
