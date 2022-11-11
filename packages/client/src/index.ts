import { Command } from 'commander';
import { ethers } from 'ethers';
import 'isomorphic-fetch';

const namehash = require('eth-ens-namehash');
const StubAbi = require('../../contracts/artifacts/contracts/l1/OptimismResolverStub.sol/OptimismResolverStub.json').abi
const IResolverAbi = require('../../contracts/artifacts/contracts/l1/OptimismResolverStub.sol/IResolverService.json').abi
const program = new Command();
const { arrayify, hexConcat } = ethers.utils
program
  .requiredOption('-r --registry <address>', 'ENS registry address')
  .option('-l1 --l1_provider_url <url1>', 'L1_PROVIDER_URL', 'http://localhost:9545')
  .option('-l2 --l2_provider_url <url2>', 'L2_PROVIDER_URL')
  .option('-i --chainId <chainId>', 'chainId', '31337')
  .option('-n --chainName <name>', 'chainName', 'unknown')
  .option('-d --debug', 'debug', false)
  .argument('<name>');

program.parse(process.argv);
const options = program.opts();
const ensAddress = options.registry;
const chainId = parseInt(options.chainId);
const { chainName, l1_provider_url, debug } = options
console.log({l1_provider_url, ensAddress, chainId, chainName, debug})
let provider
if(chainId && chainName){
  provider = new ethers.providers.JsonRpcProvider(l1_provider_url, {
      chainId,
      name: chainName,
      ensAddress
    }
  );    
} else {
  provider = new ethers.providers.JsonRpcProvider(options.l1_provider_url);
}
// provider.on("debug", console.log)
const l2provider = new ethers.providers.JsonRpcProvider(options.l2_provider_url);

function numPad(value:any) {
  var result = arrayify(value);
  if (result.length > 32) {
      throw new Error("internal; should not happen");
  }
  var padded = new Uint8Array(32);
  padded.set(result, 32 - result.length);
  return padded;
}
function bytesPad(value:any) {
  if ((value.length % 32) === 0) {
      return value;
  }
  var result = new Uint8Array(Math.ceil(value.length / 32) * 32);
  result.set(value);
  return result;
}

// ABI Encodes a series of (bytes, bytes, ...)
function encodeBytes(datas:any) {
  var result = [];
  var byteCount = 0;
  // Add place-holders for pointers as we add items
  for (var i = 0; i < datas.length; i++) {
      result.push(null);
      byteCount += 32;
  }
  for (var i = 0; i < datas.length; i++) {
      var data = arrayify(datas[i]);
      // Update the bytes offset
      result[i] = numPad(byteCount);
      // The length and padded value of data
      result.push(numPad(data.length));
      result.push(bytesPad(data));
      byteCount += 32 + Math.ceil(data.length / 32) * 32;
  }
  return hexConcat(result);
}

(async () => {
  const l1ChainId = parseInt(await provider.send('eth_chainId', []))
  const l2ChainId = parseInt(await l2provider.send('eth_chainId', []))
  console.log({ l1ChainId, l2ChainId })
  const name = program.args[0];
  const node = namehash.hash(name)
  let r = await provider.getResolver(name);
  if(r){
    const resolver = new ethers.Contract(r.address, StubAbi, provider);
    const iresolver = new ethers.Contract(r.address, IResolverAbi, provider);
    try{
      if(debug){
        // this will throw OffchainLookup error
        console.log(await resolver.callStatic['addr(bytes32)'](node))
      }else{
        const beforeTime = (new Date()).getTime()
        console.log('getAddress           ', await r.getAddress());
        const afterTime = (new Date()).getTime()
        console.log('(call time=', afterTime - beforeTime , ')')
        console.log('getAddress(60)       ', await r.getAddress(60));
        console.log('_fetchBytes          ', await r._fetchBytes('0xf1cb7e06', '0x000000000000000000000000000000000000000000000000000000000000003c'))
        console.log('addr(bytes32)        ', await resolver.callStatic['addr(bytes32)'](node, { ccipReadEnabled:true }))
        console.log('addr(bytes32,uint256)', await resolver.callStatic['addr(bytes32,uint256)'](node, 60, { ccipReadEnabled:true }))
        console.log('resolveName', await provider.resolveName(name));
      }
    }catch(e){
      // Manually calling the gateway
      console.log('error', e)
      if(e.errorArgs){
        const {sender, urls, callData, callbackFunction, extraData } = e.errorArgs
        console.log(1, {sender, urls, callData, callbackFunction, extraData})
        const url = urls[0].replace(/{sender}/, sender).replace(/{data}/, callData)
        console.log(2, {url})
        const fetched = await fetch(url)
        const responseData:any = await (fetched).json()
        if(responseData){
          try{
            const data = hexConcat([ callbackFunction, encodeBytes([ responseData.data, extraData ]) ])
            console.log(3, {data})
            const result = await resolver.provider.call({
              to: resolver.address,
              data
            });
            console.log(4, {result})
            const decodedResult = resolver.interface.decodeFunctionResult("addrWithProof", result);
            console.log(5, {decodedResult})
  
          }catch(ee){
            console.log(6, {ee})
          }  
        }
      }
    }  
  }
})();
