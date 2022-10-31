require("@nomiclabs/hardhat-ethers");
require('@eth-optimism/plugins/hardhat/compiler');

module.exports = {
  networks: {
    "goerli": {
      url: `https://eth-goerli.g.alchemy.com/v2/q5D9_dtbdeOEfdXSzWs1DyVter172KF-`,
      l2url: `https://opt-goerli.g.alchemy.com/v2/oSCIVXdCPv0CSHRAECX_Y9ANvTsl-HC2`,
      accounts: ['0xd07afb698cea6d156890a007833e5f21892cc706dd2ee91ea4bd90d7648b124a']
    },
    "optimism-goerli": {
      url: `https://opt-goerli.g.alchemy.com/v2/oSCIVXdCPv0CSHRAECX_Y9ANvTsl-HC2`,
      accounts: ['0xd07afb698cea6d156890a007833e5f21892cc706dd2ee91ea4bd90d7648b124a']
    },
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
