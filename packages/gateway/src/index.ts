import { Server } from '@chainlink/ccip-read-server';
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { ethers } from 'ethers';
import { hexConcat, Result } from 'ethers/lib/utils';
const optimismSDK = require("@eth-optimism/sdk")
const StubAbi = require('../../contracts/artifacts/contracts/l1/OptimismResolverStub.sol/OptimismResolverStub.json').abi
const IResolverAbi = require('../../contracts/artifacts/contracts/l1/OptimismResolverStub.sol/IResolverService.json').abi

const program = new Command();
program
  .option('-l1 --l1_provider_url <url1>', 'L1_PROVIDER_URL')
  .option('-l2 --l2_provider_url <url2>', 'L2_PROVIDER_URL')
  .option('-r --l2_resolver_address <address>', 'L2_PROVIDER_URL')
  .option('-p --port <number>', 'Port number to serve on', '8081');
program.parse(process.argv);
const options = program.opts();
console.log({options})
const {l1_provider_url , l2_provider_url , l2_resolver_address } = options
const l1_provider = new ethers.providers.JsonRpcProvider(l1_provider_url);
const l2_provider = new ethers.providers.JsonRpcProvider(l2_provider_url);
const server = new Server();
server.add(IResolverAbi, [
  {
    type: 'addr(bytes32)',
    func: async ([node], {to, data:_callData}) => {
        console.log('***addr1', {node, to})
        const l1resolverAddress:any = to
        const l2resolverAddress = l2_resolver_address
        const resolver = new ethers.Contract(l1resolverAddress, StubAbi, l1_provider);
        // test.test
        const addrSlot = ethers.utils.keccak256(node + '00'.repeat(31) + '01');
        const addressData = await l2_provider.getStorageAt(l2resolverAddress, addrSlot)
        console.log('***addr2',{
            addrSlot,
            addressData
        })
        const crossChainMessenger = new optimismSDK.CrossChainMessenger({
            l1ChainId: 31337,
            l2ChainId: 17,
            l1SignerOrProvider: l1_provider,
            l2SignerOrProvider: l2_provider
        })
        console.log('***addr3', {
          l2resolverAddress, addrSlot
        })
        let storageProof
        const proof = await l2_provider.send('eth_getProof', [
          l2resolverAddress,
          [addrSlot],
          'latest'
        ]);
        console.log('***addr31', proof)
        try{
          console.log('***addr311')
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
        const data =  resolver.interface.encodeFunctionData('addrWithProof', [node, storageProof])
        console.log('***addr5', data)
        const result = await resolver.provider.call({
            to: l1resolverAddress,
            data,
        });
        console.log('***addr6', result)
        let decodedResult
        try{
          decodedResult = resolver.interface.decodeFunctionResult("addrWithProof", result);
          console.log('***addr7', {decodedResult})
        }catch(eee){
          ///
          // ***addr8 {
          // eee: Error: call revert exception; VM Exception while processing transaction: reverted with reason string "Invalid large internal hash" [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="addrWithProof(bytes32,(bytes32,(uint256,bytes32,uint256,uint256,bytes),(uint256,bytes32[]),bytes,bytes))", data="0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001b496e76616c6964206c6172676520696e7465726e616c20686173680000000000", errorArgs=["Invalid large internal hash"], errorName="Error", errorSignature="Error(string)", reason="Invalid large internal hash", code=CALL_EXCEPTION, version=abi/5.7.0)
          //     at Logger.makeError (/Users/makoto/work/ens/op-resolver/node_modules/@ethersproject/logger/lib/index.js:238:21)
          //     at Logger.throwError (/Users/makoto/work/ens/op-resolver/node_modules/@ethersproject/logger/lib/index.js:247:20)
          //     at Interface.decodeFunctionResult (/Users/makoto/work/ens/op-resolver/node_modules/@ethersproject/abi/lib/interface.js:388:23)
          //     at _callee$ (/Users/makoto/work/ens/op-resolver/packages/gateway/dist/op-resolver-gateway.cjs.development.js:432:55)
          //     at tryCatch (/Users/makoto/work/ens/op-resolver/packages/gateway/dist/op-resolver-gateway.cjs.development.js:48:17)
          //     at Generator.<anonymous> (/Users/makoto/work/ens/op-resolver/packages/gateway/dist/op-resolver-gateway.cjs.development.js:129:22)
          //     at Generator.next (/Users/makoto/work/ens/op-resolver/packages/gateway/dist/op-resolver-gateway.cjs.development.js:73:21)
          //     at asyncGeneratorStep (/Users/makoto/work/ens/op-resolver/packages/gateway/dist/op-resolver-gateway.cjs.development.js:315:24)
          //     at _next (/Users/makoto/work/ens/op-resolver/packages/gateway/dist/op-resolver-gateway.cjs.development.js:334:9)
          //     at processTicksAndRejections (node:internal/process/task_queues:96:5) {
          //   reason: 'Invalid large internal hash',
          //   code: 'CALL_EXCEPTION',
          //   method: 'addrWithProof(bytes32,(bytes32,(uint256,bytes32,uint256,uint256,bytes),(uint256,bytes32[]),bytes,bytes))',
          //   data: '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001b496e76616c6964206c6172676520696e7465726e616c20686173680000000000',
          //   errorArgs: [ 'Invalid large internal hash' ],
          //   errorName: 'Error',
          //   errorSignature: 'Error(string)'
          // }
          // }
          console.log('***addr8', {eee})
        }
        // test end

        return [storageProof]
    }
  }
]);
const app = server.makeApp('/query/');
app.listen(options.port);
