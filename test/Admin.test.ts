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
    const rogueA = accounts[1];
    const ownerB = accounts[2];
    let decentramallInstance: DecentramallInstance;
    let daiInstance: ERC20Instance;
    let tokenId: string;

    describe('Change & Mint', () => {
        beforeEach(async () => {
            daiInstance = await DAI.new(accounts);
            decentramallInstance = await Decentramall.new(1200, 2500, 100000, daiInstance.address);
        });
        it('Should change dai address', async () => {
            const newDaiInstance = await DAI.new(accounts);
            await decentramallInstance.changeDaiAddress(newDaiInstance.address, {from:ownerA});
            expect(await decentramallInstance.dai({from:ownerA})).to.be.equal(newDaiInstance.address);
        });
        it('Should fail change dai address', async () => {
            const newDaiInstance = await DAI.new(accounts);
            await expectRevert(decentramallInstance.changeDaiAddress(newDaiInstance.address, {from:ownerB}), "ADMIN: Not allowed!");
        });
        it('Should change admin', async () => {
            await decentramallInstance.changeAdmin(ownerB, {from:ownerA});
            expect(await decentramallInstance.admin({from:ownerA})).to.be.equal(ownerB);
        });
        it('Should fail change admin', async () => {
            await expectRevert(decentramallInstance.changeAdmin(ownerB, {from:ownerA}), "ADMIN: Not allowed!");
        });
        // it('Should mint dai', async () => {
        //     const priceSPACE = toBigNumber(await decentramallInstance.price(1200)).toString();
        //     expect(priceSPACE > "4710500000000000000000" || priceSPACE < "4711500000000000000000").to.be.equal(true);
        // });
        // it('Should fail mint dai', async () => {
        //     const priceSPACE = toBigNumber(await decentramallInstance.price(1200)).toString();
        //     expect(priceSPACE > "4710500000000000000000" || priceSPACE < "4711500000000000000000").to.be.equal(true);
        // });
    });
});