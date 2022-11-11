import { Command } from 'commander';
import { ethers } from 'ethers';
import 'isomorphic-fetch';

const namehash = require('eth-ens-namehash');
const StubAbi = require('../../contracts/artifacts/contracts/l1/OptimismResolverStub.sol/OptimismResolverStub.json').abi
const IResolverAbi = require('../../contracts/artifacts/contracts/l1/OptimismResolverStub.sol/IResolverService.json').abi
const program = new Command();
program
  .requiredOption('-r --registry <address>', 'ENS registry address')
  .option('-l1 --l1_provider_url <url1>', 'L1_PROVIDER_URL')
  .option('-l2 --l2_provider_url <url2>', 'L2_PROVIDER_URL')
  .option('-i --chainId <chainId>', 'chainId', '31337')
  .option('-n --chainName <name>', 'chainName', 'unknown')
  .argument('<name>');

program.parse(process.argv);
const options = program.opts();
const ensAddress = options.registry;
const chainId = parseInt(options.chainId);
const chainName = options.chainName;
console.log({provider:options.provider, ensAddress, chainId, chainName})
const provider = new ethers.providers.JsonRpcProvider(options.l1_provider_url
//   , {
//   chainId,
//   name: chainName,
//   ensAddress
// }
);
// provider.on("debug", console.log)
const l2provider = new ethers.providers.JsonRpcProvider(options.l2_provider_url);

(async () => {
  console.log('11', (await provider.getBlock('latest')).number)
  console.log('111', (await l2provider.getBlock('latest')).number)
  const l1ChainId = parseInt(await provider.send('eth_chainId', []))
  const l2ChainId = parseInt(await l2provider.send('eth_chainId', []))
  console.log(1, l1ChainId)
  console.log(2, l2ChainId)

  const name = program.args[0];
  console.log('12', name)

  let r = await provider.getResolver(name);
  console.log('13', r)
  const node = namehash.hash(name)
  if(r){
    const resolver = new ethers.Contract(r.address, StubAbi, provider);
    const iresolver = new ethers.Contract(r.address, IResolverAbi, provider);
    try{
      console.log('14')
      // const beforeTime = (new Date()).getTime()
      // console.log('141', await r.getAddress());
      // const afterTime = (new Date()).getTime()
      // console.log('*** before calling getStorageProof', afterTime)
      // console.log('*** Time took', afterTime - beforeTime)
      // let r = await provider.getResolver('opresolver.eth');
      // console.log('1401', await r.getAddress());
      console.log('1402', await r.getAddress(60));
      console.log('1403', await r._fetchBytes('0xf1cb7e06', '0x000000000000000000000000000000000000000000000000000000000000003c'))
      // console.log('141', await resolver.callStatic['addr(bytes32)'](node, { ccipReadEnabled:true }))
      // console.log('142', await resolver.callStatic['addr(bytes32,uint256)'](node, 60, { ccipReadEnabled:true }))
      
      // console.log(await resolver.callStatic['addr(bytes32)'](node))
      console.log('143', await provider.resolveName(name));
    }catch(e){
      // Manually calling the gateway
      console.log('15', e)
      if(e.errorArgs){
        const {sender, urls, callData, callbackFunction, extraData } = e.errorArgs
        console.log(16,{sender, urls, callData, callbackFunction, extraData})
        const url = urls[0].replace(/{sender}/, sender).replace(/{data}/, callData)
        console.log({url})
        const responseData:any = await (await fetch(url)).json()
        const storageProof = iresolver.interface.decodeFunctionResult("addr", responseData.data);
        const data =  resolver.interface.encodeFunctionData('addrWithProof', [node, storageProof])

        if(responseData){
          console.log(18, {node, responseData})
          const storageProofs = iresolver.interface.decodeFunctionResult("addr", responseData.data);
          console.log(181, storageProofs)
          const string = 'addrWithProof(bytes32,(bytes32,(uint256,bytes32,uint256,uint256,bytes),(uint256,bytes32[]),bytes,bytes))'  
          try{
            console.log('1811')
        
            const data =  resolver.interface.encodeFunctionData('addrWithProof', [node, storageProofs[0]])
            console.log('1812', {data})
            const result = await resolver.provider.call({
              to: resolver.address,
              data,
            });
            console.log('1813', {result})
            const decodedResult = resolver.interface.decodeFunctionResult("addrWithProof", result);
            console.log('1814', {decodedResult})
  
          }catch(ee){
            console.log({ee})
          }  
        }
      }
    }  
  }
})();
