import { Server } from '@chainlink/ccip-read-server';
import { Command } from 'commander';
import { ethers } from 'ethers';

const optimismSDK = require("@eth-optimism/sdk")
// const StubAbi = require('../../contracts/artifacts/contracts/l1/OptimismResolverStub.sol/OptimismResolverStub.json').abi
// const OptimismResolverAbi = require('../../contracts/artifacts/contracts/l2/OptimismResolver.sol/OptimismResolver.json').abi
const IResolverAbi = require('@ensdomains/op-resolver-contracts/artifacts/contracts/l1/OptimismResolverStub.sol/IResolverService.json').abi

// const namehash = require('eth-ens-namehash');

const program = new Command();
program
  .option('-l1p --l1_provider_url <url1>', 'L1_PROVIDER_URL', 'http://localhost:9545')
  .option('-l2p --l2_provider_url <url2>', 'L2_PROVIDER_URL', 'http://localhost:8545')
  .option('-l1c --l1_chain_id <chain1>', 'L1_CHAIN_ID', '31337')
  .option('-l2c --l2_chain_id <chain2>', 'L2_CHAIN_ID', '17')
  .option('-r --l2_resolver_address <address>', 'L2_PROVIDER_URL')
  .option('-d --debug', 'debug', false)
  .option('-v --verification_option <value>', 'VERIFICATION_OPTION', 'fewhoursold')
  .option('-p --port <number>', 'Port number to serve on', '8081');
program.parse(process.argv);
const options = program.opts();
console.log({options})
const {l1_provider_url , l2_provider_url , l2_resolver_address, l1_chain_id, l2_chain_id, debug, verification_option } = options
const l1_provider = new ethers.providers.JsonRpcProvider(l1_provider_url);
const l2_provider = new ethers.providers.JsonRpcProvider(l2_provider_url);
const server = new Server();
server.add(IResolverAbi, [
  {
    type: 'addr(bytes32)',
    func: async ([node], {to, data:_callData}) => {
      const l2resolverAddress = l2_resolver_address
      const addrSlot = ethers.utils.keccak256(node + '00'.repeat(31) + '01');

      if(debug){
        console.log(1, {node, to, _callData, l1_provider_url , l2_provider_url , l2_resolver_address, l1_chain_id, l2_chain_id})
        const blockNumber = (await l2_provider.getBlock('latest')).number
        console.log(2, {blockNumber, addrSlot})
        let addressData
        try{
          addressData = await l2_provider.getStorageAt(l2resolverAddress, addrSlot)
        }catch(e){
          console.log(3, {e})
        }
        console.log(4,{
          addressData
        })
      }        
      const crossChainMessenger = new optimismSDK.CrossChainMessenger({
        l1ChainId: parseInt(l1_chain_id),
        l2ChainId: parseInt(l2_chain_id),
        l1SignerOrProvider: l1_provider,
        l2SignerOrProvider: l2_provider
      })
      let storageOption, storageProof
      try{
        switch (verification_option) {
          case 'latest':
          case 'finalized':
            storageOption = {
              blockTag:verification_option
            }
            break;
          default:
            storageOption = {
              l1BlocksAgo: 2000
            }
        }
        if(debug) console.log({storageOption})
        storageProof = await crossChainMessenger.getStorageProof(l2resolverAddress, addrSlot, storageOption)
        if(debug) console.log({storageProof})
        console.log(storageProof)
      }catch(e){
        console.log(e)
      }
      return [storageProof]
    }
  }
]);
const app = server.makeApp('/');
app.listen(options.port);
