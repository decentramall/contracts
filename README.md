# Contracts

This section contains the Ethereum smart contracts for the Decentramall Project. We use [Truffle](https://github.com/trufflesuite/truffle) as a development environment for compiling, testing, and deploying our contracts. They were written in [Solidity](https://github.com/ethereum/solidity).
<br/><br/>

[![Build Status](https://travis-ci.org/decentramall/decentramall.svg?branch=master)](https://travis-ci.org/decentramall/decentramall)

## About

The idea is for an owner to purchase a retail SPACE whose price follows a bonding curve. An owner can only own one SPACE
token, preventing anyone from gaining control of the entire mall by purchasing all the SPACE available

## Breakdown

### 🌌 SPACE Token

The SPACE token is created in the DecentramallToken.sol file. It follows a basic ERC721 implementation with nothing unique in particular.

However, to achieve the unique one-of-a-kind ownership and restriction, the ERC721 tokenID is based a _keccak256 hash_ of the owner's
address, making it impossible for an owner to mint an ERC721 token twice.

### 🏠 Estate Agent

The EstateAgent houses the bonding curve function as well as purchasing and selling of SPACE tokens.

Since the SPACE tokens have to be minted only when a buyer exists, the bonding curve requires a slight modification to its implementation. It allows for continuous minting of tokens but only up to a certain threshold which is declared during initialization under _\_currentLimit_.

### 💵 Rental Agent

Handles the renting of SPACE tokens. Each rental lasts for **1 year** and will cost 1/10 of the current SPACE purchase price.

### 🗳️ Administration

Handles adding/removing admins from control of the contract

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

## To-Do

- [] Add cancel rent
- [] Add extend rent
- [] Add testing
