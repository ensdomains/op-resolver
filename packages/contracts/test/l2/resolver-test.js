const { expect } = require("chai");
const hre = require("hardhat")
const ethers = hre.ethers
const NODE = "0xeb4f647bea6caa36333c816d7b46fdcb05f9466ecacc140ea8c66faf15b3d9f1"; // namehash('test.eth')
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("OptimismResolver", function() {
  it.only("Should return an address once set", async function() {
    const accounts = await ethers.getSigners();
    const address = await accounts[0].getAddress();

    const Resolver = await ethers.getContractFactory("OptimismResolver");
    const resolver = await Resolver.deploy();
    await resolver.deployed();

    await resolver.setAddr(NODE, address);
    expect(await resolver['addr(bytes32)'](NODE)).to.equal(address);
    const provider = hre.network.provider
    console.log(helpers.getStorageAt)
    const addrSlot = ethers.utils.keccak256(NODE + '00'.repeat(31) + '01');
    addressData = await helpers.getStorageAt(resolver.address, addrSlot)
    console.log({
      addressData
    })
  });
});
