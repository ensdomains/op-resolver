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
$ RESOLVER_ADDRESS=  yarn hardhat --network localhost run scripts/deployL1.js
```

Make note of the ENS registry address logged to the console.

Now run the gateway service:

```
$ cd ../gateway
$ yarn
$ yarn start --l1_provider_url http://localhost:9545 --l2_provider_url http://localhost:8545 --l2_resolver_address L2_RESOLVER_ADDRESS
```

In a third console window, serve up the demo app:

```
$ cd ../client
$ yarn start --registry L1_REGISTRY_ADDRESS test.test --l1_provider_url http://localhost:9545
```

If you want to see extra debugging info, pass `--debug` option to both command

## How to deploy to public net (goerli for example)

### Deploy l2 contract

L1_PROVIDER_URL=L1_PROVIDER_URL L2_PROVIDER_URL=L2_PROVIDER_URL PRIVATE_KEY=PRIVATE_KEY
npx hardhat --network optimismGoerli run scripts/deployL2.js

### Deploy l1 contract

L1_PROVIDER_URL=L1_PROVIDER_URL L2_PROVIDER_URL=L2_PROVIDER_URL PRIVATE_KEY=PRIVATE_KEY
RESOLVER_ADDRESS=RESOLVER_ADDRESS yarn hardhat --network goerli run scripts/deployL1.js

### Verify l1 contract

RESOLVER_ADDRESS= L1_PROVIDER_URL= ETHERSCAN_API_KEY= npx hardhat verify --network goerli --constructor-args scripts/arguments.js CONTRACT_ADDRESS

## Deployed contracts

- op goerli resolver = 0x470B48eE90Cec0eb6834B986fEA4F3698C986AC4
- goerli (gateway points to 'https://op-resolver-example.uc.r.appspot.com/{sender}/{data}.json' ) = [0x0AF7BfB9bC54E4ca0D48C30d6c0396B919c5abd7](https://goerli.etherscan.io/address/0x0AF7BfB9bC54E4ca0D48C30d6c0396B919c5abd7)
- test domain = [opresolver.eth](https://app.ens.domains/name/opresolver.eth/details)

## Deploy gateway

Create secret.yaml and update credentials

```
cd gateway
cp secret.yaml.org secret.yaml
```

Deploy to app engine

```
gcloud app deploy goeril.app.yml
```

## Components

### [Client](client)

A very simple script that tests if ccip-read integration is working

### [Contracts](contracts)

`OptimismResolverStub` is a L1 (Ethereum) ENS resolver contract that implements the proposed protocol, with
functions to return the gateway address and required prefix for a query, and to verify the response from the gateway.

`OptimismResolver` is an L2 (Optimism) ENS resolver contract that stores and returns the data necessary to resolve an ENS name.

### [Gateway](gateway)

A node-based gateway server that answers queries for l2 gateway function calls relating to Optimism-based L2 resolvers.
