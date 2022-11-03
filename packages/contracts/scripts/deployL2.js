const hre = require("hardhat");
const {ethers} = hre;
const namehash = require('eth-ens-namehash');

const TEST_NODE = namehash.hash('test.test');

async function main() {
  /************************************
   * L2 deploy
   ************************************/
  // Deploy L2 resolver and set addr record for test.test
  const l2accounts = await ethers.getSigners();
  const OptimismResolver = await ethers.getContractFactory("OptimismResolver");
  const resolver = await OptimismResolver.deploy();
  await resolver.deployed();
  console.log(`OptimismResolver deployed to ${resolver.address}`);
  await (await resolver.functions.setAddr(TEST_NODE, l2accounts[0].address)).wait();
  console.log('Address set to', await resolver.addr(TEST_NODE));
  
  /************************************
   * L1 deploy
   ************************************/
  const accounts = await ethers.getSigners();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
