# Contracts
This section contains the Ethereum smart contracts for the Decentramall Project. We use [Truffle](https://github.com/trufflesuite/truffle) as a development environment for compiling, testing, and deploying our contracts. They were written in [Solidity](https://github.com/ethereum/solidity).
<br/><br/>

[![Build Status](https://travis-ci.org/decentramall/decentramall.svg?branch=master)](https://travis-ci.org/decentramall/decentramall)

## Idea
The idea is for an owner to purchase a retail SPACE whose price follows a bonding curve. An owner can only own one SPACE 
token, preventing anyone from gaining control of the entire mall by purchasing all the SPACE available
<br/><br/>

## Breakdown
### 🌌 SPACE Token
The SPACE token is created in the DecentramallToken.sol file. It follows a basic ERC721 implementation with nothing unique in particular. <br/>
However, to achieve the unique one-of-a-kind ownership and restriction, the ERC721 tokenID is based a *keccak256 hash* of the owner's
address, making it impossible for an owner to mint an ERC721 token twice.
<br/><br/>

### 🏠 Estate Agent
The EstateAgent houses the bonding curve function as well as purchasing and selling of SPACE tokens. <br />
Since the SPACE tokens have to be minted only when a buyer exists, the bonding curve requires a slight modification to its implementation. It allows for continuous minting of tokens but only up to a certain threshold which is declared during initialization under *_currentLimit*.

### 💵 Rental Agent
Handles the renting of SPACE tokens. Each rental lasts for **1 year** and will cost 1/10 of the current SPACE purchase price.

### 🗳️ Administration
Handles adding/removing admins from control of the contract


## Pre Requisites
### Install Modules
```bash
$ npm install
```

## Usage

```bash
truffle compile --all
truffle migrate --network development
```

Make sure to have a running [Ganache](https://truffleframework.com/ganache) instance in the background.

### Test

```bash
$ npm run test
```
