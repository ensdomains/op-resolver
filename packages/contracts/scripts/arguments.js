const CONSTANTS = require('./constants')
const hre = require("hardhat");
let RESOLVER_ADDRESS
if(process.env.RESOLVER_ADDRESS){
  RESOLVER_ADDRESS = process.env.RESOLVER_ADDRESS
}else{
  throw('Set RESOLVER_ADDRESS=')
}
module.exports = [
  CONSTANTS.OVM_ADDRESS_MANAGERS[hre.network.name],
  [ hre.network.config.gatewayurl ],
  RESOLVER_ADDRESS
]