# Optimism Resolver

## Usage

In a terminal window, download, build, and run Optimism repository. Read [here](https://community.optimism.io/docs/developers/build/dev-node/#setting-up-the-environment) for more detail

```
$ git clone https://github.com/ethereum-optimism/optimism.git
$ cd optimism
$ cd ops
$ docker-compose pull
$ docker-compose up
```

In a second terminal window, deploy our code to the L1 and L2 chains exposed by optimism-integration:

```
$ git clone git@github.com:ensdomains/op-resolver.git
$ cd op-resolver/contracts
$ yarn
$ yarn hardhat --network optimismLocalhost run scripts/deployL2.js
$ // take notes the resolver address
$ RESOLVER_ADDRESS=RESOLVER_ADDRESS yarn hardhat --network localhost run scripts/deployL1.js
```

Make note of the ENS registry address logged to the console.

Now run the gateway service:

```
$ cd ../gateway
$ yarn
$ yarn start --l1_provider_url http://localhost:9545 --l2_provider_url http://localhost:8545 --l2_resolver_address 0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f
```

In a third console window, serve up the demo app:

```
$ cd ../client
$ yarn start --registry 0x59b670e9fA9D0A427751Af201D676719a970857b test.test

## Components

### [Client](client)

A very simple script that tests if ccip-read integration is working

### [Contracts](contracts)

`OptimismResolverStub` is a L1 (Ethereum) ENS resolver contract that implements the proposed protocol, with
functions to return the gateway address and required prefix for a query, and to verify the response from the gateway.

`OptimismResolver` is an L2 (Optimism) ENS resolver contract that stores and returns the data necessary to resolve an ENS name.

### [Gateway](gateway)

A node-based gateway server that answers queries for l2 gateway function calls relating to Optimism-based L2 resolvers.
```
