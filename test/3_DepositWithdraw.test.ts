import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import { DecentramallInstance, ERC20Instance } from '../types/truffle-contracts';
import {advanceBlock} from './helpers/truffleTestHelper';

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

    describe('Deposit & Withdraw', () => {
        beforeEach(async () => {
            daiInstance = await DAI.new(accounts);
            decentramallInstance = await Decentramall.new(1200, 2500, 100000, daiInstance.address);
            const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            // console.log("tx log object", tx);
            tokenId = tx.logs[1].args[1].toString();
        });
        it('should deposit successfully', async () => {
            await decentramallInstance.deposit(tokenId, "375428", {from: ownerA});
            const newOwner = await decentramallInstance.ownerOf(tokenId);
            expect(newOwner).to.be.eq(decentramallInstance.address);
        });
        it('should fail deposit', async () => {
            await expectRevert(decentramallInstance.deposit(tokenId, "374", {from: ownerA}), "DEPOSIT: Stake duration has to be more than 375428 blocks!");
        });
        it('should withdraw successfully [WARNING! Remember to change the block times!]', async () => {
            await decentramallInstance.deposit(tokenId, "375",{from: ownerA});
            for(let i=0; i<375; i++){
                await advanceBlock();
            }
            await decentramallInstance.withdraw(tokenId, {from: ownerA});
            const newOwner = await decentramallInstance.ownerOf(tokenId);
            expect(newOwner).to.be.eq(ownerA);
        });
        it('should fail withdraw (locked)', async () => {
            await decentramallInstance.deposit(tokenId, "375428",{from: ownerA});
            await expectRevert(decentramallInstance.withdraw(tokenId, {from: ownerA}), "WITHDRAW: Token is locked!");
        });
        it('should not allow someone else to deposit', async () => {
            await expectRevert(decentramallInstance.deposit(tokenId, "375428",{from: renterA}), "DEPOSIT: Not owner!");
        });
        it('should not allow someone else to withdraw', async () => {
            await decentramallInstance.deposit(tokenId, "375428",{from: ownerA});
            await expectRevert(decentramallInstance.withdraw(tokenId, {from: renterA}), "WITHDRAW: Not owner!");
        });
        it('should not allow withdraw as it doesnt exist in contract', async () => {
            await expectRevert(decentramallInstance.withdraw(tokenId, {from: ownerA}), "WITHDRAW: Doesn't exist!");
        });
    });
});