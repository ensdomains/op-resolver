require("@nomiclabs/hardhat-ethers");
require('@eth-optimism/plugins/hardhat/compiler');

module.exports = {
  networks: {
    hardhat: {
      // throwOnCallFailures: false,
      chainId: 31337,
      gatewayurl:'http://localhost:8080/{sender}/{data}.json',
      batchgatewayurl: 'http://localhost:8081/{sender}/{data}.json',
    },
    localhost: {
      // throwOnCallFailures: false,
      url: 'http://localhost:9545',
      accounts: {
        mnemonic: "test test test test test test test test test test test junk"
      }
    },
    optimismLocalhost: {
      url: 'http://localhost:8545',
      accounts: {
        mnemonic: "test test test test test test test test test test test junk"
      }
    },
    goerli: {
      url: process.env.L1_PROVIDER_URL || 'http://localhost:9545',
      accounts: [process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' ]
    },
    optimismGoerli: {
      url: process.env.L2_PROVIDER_URL || 'http://localhost:8545',
      accounts: [process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80']
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  namedAccounts: {
    deployer: {
      default: 0
    }
  },
  solidity: {
    version: "0.8.9",
  },
};
