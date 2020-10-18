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
    const ownerB = accounts[2];
    let decentramallInstance: DecentramallInstance;
    let daiInstance: ERC20Instance;
    let tokenId: string;

    describe('Price', () => {
        beforeEach(async () => {
            daiInstance = await DAI.new(accounts);
            decentramallInstance = await Decentramall.new(1200, 2500, 100000, daiInstance.address);
        });
        it('Should return roughly 289.00 DAI for 1st SPACE', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
            expect(priceSPACE > "288500000000000000000" || priceSPACE < "289500000000000000000").to.be.equal(true);
        });
        it('Should return roughly 2389.00 DAI for 586th SPACE', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(586)).toString();
            expect(priceSPACE > "2388500000000000000000" || priceSPACE < "2389500000000000000000").to.be.equal(true);
        });
        it('Should return roughly 4711.00 DAI for 1200th SPACE', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(1200)).toString();
            expect(priceSPACE > "4710500000000000000000" || priceSPACE < "4711500000000000000000").to.be.equal(true);
        });
    });
});