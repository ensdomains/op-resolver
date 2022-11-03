import { Command } from 'commander';
import { ethers } from 'ethers';
import fetch from 'node-fetch';
const namehash = require('eth-ens-namehash');
const StubAbi = require('../../contracts/artifacts/contracts/l1/OptimismResolverStub.sol/OptimismResolverStub.json').abi
const IResolverAbi = require('../../contracts/artifacts/contracts/l1/OptimismResolverStub.sol/IResolverService.json').abi
const program = new Command();
program
  .requiredOption('-r --registry <address>', 'ENS registry address')
  .option('-p --provider <url>', 'web3 provider URL', 'http://localhost:9545')
  .option('-i --chainId <chainId>', 'chainId', '31337')
  .option('-n --chainName <name>', 'chainName', 'unknown')
  .argument('<name>');

program.parse(process.argv);
const options = program.opts();
const ensAddress = options.registry;
const chainId = parseInt(options.chainId);
const chainName = options.chainName;
console.log({provider:options.provider, ensAddress, chainId, chainName})
const provider = new ethers.providers.JsonRpcProvider(options.provider, {
  chainId,
  name: chainName,
  ensAddress,
});
// const l2provider = new ethers.providers.JsonRpcProvider('http://localhost:8545', {
//   chainId:17,
//   name: chainName,
//   ensAddress,
// });
const l2provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

(async () => {
  console.log('11', (await provider.getBlock('latest')).number)
  console.log('111', (await l2provider.getBlock('latest')).number)
  const name = program.args[0];
  console.log('12', name)

  let r = await provider.getResolver(name);
  // console.log('13', r)
  const node = namehash.hash(name)
  if(r){
    const resolver = new ethers.Contract(r.address, StubAbi, provider);
    const iresolver = new ethers.Contract(r.address, IResolverAbi, provider);
    try{
      console.log('14')
      console.log(await resolver.callStatic['addr(bytes32)'](node))
      
      // When all works, these should return an address
      // console.log('142', await r.getAddress());
      // console.log('143', await provider.resolveName(name));
    }catch(e){
      // Manually calling the gateway
      console.log('15', e.errorArgs)
      if(e.errorArgs){
        const {sender, urls, callData, callbackFunction, extraData } = e.errorArgs
        console.log(16,{sender, urls, callData, callbackFunction, extraData})
        const url = `${urls[0]}/${sender}/${callData}.json`
        console.log(17, {url})
        const responseData = await (await fetch(url)).json()
        console.log(18, {node, responseData})
        const storageProof = iresolver.interface.decodeFunctionResult("addr", responseData.data);
        console.log(181, storageProof)
        const string = 'addrWithProof(bytes32,(bytes32,(uint256,bytes32,uint256,uint256,bytes),(uint256,bytes32[]),bytes,bytes))'
        try{
          console.log('1811', await resolver.callStatic[string](node, storageProof))
          // alternative way to call the function
          // const data =  resolver.interface.encodeFunctionData('addrWithProof', [node, storageProof])
          // const result = await resolver.provider.call({
          //   to: resolver.address,
          //   data,
          // });

        }catch(ee){
          console.log({ee})
        }
      }
    }  
  }
})();
