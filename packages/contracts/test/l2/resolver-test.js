const { expect } = require("chai");
const hre = require("hardhat")
const ethers = hre.ethers
const NODE = "0xeb4f647bea6caa36333c816d7b46fdcb05f9466ecacc140ea8c66faf15b3d9f1"; // namehash('test.eth')
const COIN_TYPE_ETH = 60;
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { BigNumber, utils } = ethers
const { hexZeroPad } = utils

function bytes32ify(value) {
  return hexZeroPad(BigNumber.from(value).toHexString(), 32);
}

describe("OptimismResolver", function() {
  it.only("Should return an address once set", async function() {
    const accounts = await ethers.getSigners();
    const address = await accounts[0].getAddress();

    const Resolver = await ethers.getContractFactory("OptimismResolver");
    const resolver = await Resolver.deploy();
    await resolver.deployed();
    console.log(1, address)
    const addrBytes = bytes32ify(address)
    // const addrBytes = ethers.utils.formatBytes32String('hello')

    console.log({
      address,
      addrBytes
    })
    await resolver.setAddr(NODE, COIN_TYPE_ETH, addrBytes);
    console.log(await resolver['addr(bytes32)'](NODE))
    const nodeLoc = await resolver.mapIntLocation(1, NODE);
    const coinLoc = await resolver.mapLocation(nodeLoc, COIN_TYPE_ETH);
    const addr2Value = await helpers.getStorageAt(resolver.address, coinLoc);
    console.log({nodeLoc, coinLoc, addr2Value})
  });
});
