# Contracts

This section contains the Ethereum smart contracts for the Decentramall Project. We use [Truffle](https://github.com/trufflesuite/truffle) as a development environment for compiling, testing, and deploying our contracts. They were written in [Solidity](https://github.com/ethereum/solidity).
<br/><br/>

[![Build Status](https://travis-ci.org/decentramall/decentramall.svg?branch=master)](https://travis-ci.org/decentramall/decentramall)

## About

The idea is for an owner to purchase a retail SPACE whose price follows a bonding curve. An owner can only own one SPACE
token, preventing anyone from gaining control of the entire mall by purchasing all the SPACE available

## Breakdown

### 🌌 SPACE Token

The price of SPACE tokens follow a Sigmoid function curve. This is because we want the price to increase rapidly near the beginning, but stabilize at the end. This means that if you are an early adopter, you will be rewarded. This also benefits late comers as they will not suffer an insane price that comes with quadratic curves. Each space is unique to and only one owner can own ONE(1) SPACE. This is to avoid monopolies. Since the SPACE tokens have to be minted only when a buyer exists, the bonding curve requires a slight modification to its implementation. It allows for continuous minting of tokens but only up to a certain threshold which is declared during initialization under _currentLimit_.

To achieve the unique one-of-a-kind ownership and restriction, the ERC721 tokenID is based a _keccak256 hash_ of the owner's
address, making it impossible for an owner to mint an ERC721 token twice.

### 💵 Staking & Rental

For a SPACE to be made available to rent, it has to be deposited and staked for a period of time. During this stake period, renters will be able to rent as long as they want until the final block number as found in _maxRentableBlock_. The minimum stake duration is 2 months, roughly _375428_ blocks. For rents, the minimum duration is 1 month, roughtly _187714_. This is to avoid the issue where a SPACE becomes ineligible for rent after roughly 14 seconds (1 block).

To find the price of rent, we can refer to the equation below. Generally, rent will cost 1/10 the price to purchase a new SPACE per year.

```
rentPrice = rentDuration/2252571 * buyPrice/10

where 2252571 is roughly 1 year with a 14 second block time
```

## Installation

```bash
$ npm install
```

## Usage

To start a local network and deploy contracts, using `npm run devenv` should be enough, but in case it fails, you can start it by hand doing the following.

First start a [Ganache](https://truffleframework.com/ganache) network with `npx ganache-cli --mnemonic "hood return pride refuse resemble connect initial" --gasLimit 0xfffffffffff --networkId 1337 --port 8545`.

Leave that running and deploy the contracts with `npx truffle deploy --network development --reset`.

In order to make it work with the webui, you also need to run `npm run generate-types`, because the UI uses types for easier and safer development.

## Test & Coverage

```bash
$ npm run test
$ npm run coverage
```
