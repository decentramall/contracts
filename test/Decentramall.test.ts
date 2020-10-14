import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import { DecentramallInstance, ERC20Instance } from '../types/truffle-contracts';

const { BN, ether, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const Decentramall = artifacts.require('Decentramall');
const DAI = artifacts.require('DAI');


// truffle uses BN, bug ethers and typechain use different BigNumber modules.
function toBigNumber(bigNumber: BigNumber) {
    return new BigNumber(bigNumber.toString())
}

contract('Decentramall', (accounts) => {
    const ownerA = accounts[0];
    const renterA = accounts[1];
    let decentramallInstance: DecentramallInstance;
    let daiInstance: ERC20Instance;
    let tokenId: string;

    describe('Price', () => {
        beforeEach(async () => {
            daiInstance = await DAI.new(accounts);
            decentramallInstance = await Decentramall.new(1200, 2500, 100000, daiInstance.address);
        });
        it('Should return roughly 289.00 DAI for 1st SPACE', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price()).toString();
            console.log("Price SPACE:", priceSPACE)
        })
    });
});