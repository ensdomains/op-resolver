import { Server } from '@chainlink/ccip-read-server';
import { Command } from 'commander';
import { ethers } from 'ethers';
// import fetch from 'node-fetch';
const optimismSDK = require("@eth-optimism/sdk")
// const StubAbi = require('../../contracts/artifacts/contracts/l1/OptimismResolverStub.sol/OptimismResolverStub.json').abi
// const OptimismResolverAbi = require('../../contracts/artifacts/contracts/l2/OptimismResolver.sol/OptimismResolver.json').abi
const IResolverAbi = require('@ensdomains/op-resolver-contracts/artifacts/contracts/l1/OptimismResolverStub.sol/IResolverService.json').abi

// const namehash = require('eth-ens-namehash');

const program = new Command();
program
  .option('-l1 --l1_provider_url <url1>', 'L1_PROVIDER_URL', 'http://localhost:9545')
  .option('-l2 --l2_provider_url <url2>', 'L2_PROVIDER_URL', 'http://localhost:8545')
  .option('-l1 --l1_chain_id <chain1>', 'L1_CHAIN_ID', '31337')
  .option('-l1 --l2_chain_id <chain2>', 'L2_CHAIN_ID', '17')
  .option('-r --l2_resolver_address <address>', 'L2_PROVIDER_URL')
  .option('-p --port <number>', 'Port number to serve on', '8081');
program.parse(process.argv);
const options = program.opts();
console.log({options})
const {l1_provider_url , l2_provider_url , l2_resolver_address, l1_chain_id, l2_chain_id } = options
const l1_provider = new ethers.providers.JsonRpcProvider(l1_provider_url);
const l2_provider = new ethers.providers.JsonRpcProvider(l2_provider_url);
console.log({l1_provider})
const server = new Server();
server.add(IResolverAbi, [
  {
    type: 'addr(bytes32)',
    func: async ([node], {to, data:_callData}) => {
        console.log('***addr1', {node, to, _callData, l1_provider_url , l2_provider_url , l2_resolver_address, l1_chain_id, l2_chain_id})
        // const l1resolverAddress:any = to
        const l2resolverAddress = l2_resolver_address
        // const resolver = new ethers.Contract(l1resolverAddress, StubAbi, l1_provider);
        
        // const l2resolver = new ethers.Contract(l2_resolver_address, OptimismResolverAbi, l2_provider);
        // console.log('**addr102', await l2resolver.addr(node))

        const addrSlot = ethers.utils.keccak256(node + '00'.repeat(31) + '01');
        // const addressData = await l2_provider.getStorageAt(l2resolverAddress, addrSlot)
        console.log('***addr2',{
            addrSlot,
            // addressData,
            // _callData
        })
        // const l1ChainId = parseInt(await l1_provider.send('eth_chainId', []))
        // console.log('***addr3')
        // const l2ChainId = parseInt(await l2_provider.send('eth_chainId', []))
        // console.log('***addr4')
        // console.log(1, l1ChainId)
        // console.log(2, l2ChainId)
        
        const crossChainMessenger = new optimismSDK.CrossChainMessenger({
            l1ChainId: parseInt(l1_chain_id),
            l2ChainId: parseInt(l2_chain_id),
            l1SignerOrProvider: l1_provider,
            l2SignerOrProvider: l2_provider
        })
        console.log('***addr3', {
          l2resolverAddress, addrSlot
        })
        let storageProof
        try{
          console.log('***addr3111')
          storageProof = await crossChainMessenger.getStorageProof(l2resolverAddress, addrSlot, {
            // l1BlocksAgo: 2000
            // blockTag:'finalized'
            blockTag:'latest'
          })
          console.log('***addr312', storageProof)
        }catch(e){
          console.log('***addr4', e)
        }
        // These are just test to verify on l1 resolver directly from the gateway

        // const data =  resolver.interface.encodeFunctionData('addrWithProof', [node, storageProof])
        // console.log('***addr5', data)
        // const result = await resolver.provider.call({
        //     to: l1resolverAddress,
        //     data,
        // });
        // console.log('***addr6', result)
        // let decodedResult
        // try{
        //   decodedResult = resolver.interface.decodeFunctionResult("addrWithProof", result);
        //   console.log('***addr7', {decodedResult})
        // }catch(eee){
        //   console.log('***addr8', {eee})
        // }

        // test end

        return [storageProof]
    }
  }
]);
const app = server.makeApp('/');
app.listen(options.port);
