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

    describe('Rent & Claim Rent', () => {
        beforeEach(async () => {
            daiInstance = await DAI.new(accounts);
            decentramallInstance = await Decentramall.new(1200, 2500, 100000, daiInstance.address);
            const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            tokenId = tx.logs[1].args[1].toString();
            await decentramallInstance.deposit(tokenId, {from: ownerA});
        });

        it('should rent successfully', async () => {
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            const previousBalance = parseInt(toBigNumber(await daiInstance.balanceOf(renterA)).toString());
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renterA })
            const currentBalance = parseInt(toBigNumber(await daiInstance.balanceOf(renterA)).toString());
            expect(currentBalance < previousBalance).to.be.equal(true);
        });
        it('should fail rent (not enough funds)', async () => {
            const rentPriceSPACE = Math.floor(parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(120).toString())).toString();
            await daiInstance.approve(ownerA, "5000000000000000000000", { from: renterA });
            await daiInstance.transfer(ownerA, "5000000000000000000000", {from:renterA});
            const balance = toBigNumber(await daiInstance.balanceOf(renterA));
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await expectRevert(decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renterA }), "ERC20: transfer amount exceeds balance");
        });
        it('should fail rent (already rented)', async () => {
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renterA });
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await expectRevert(decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renterA }), "RENT: Token is already rented!");
        });
        it('should fail rent (nonexistent token)', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(2)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerB });
            const tx = await decentramallInstance.buy({ from: ownerB });
            tokenId = tx.logs[1].args[1].toString();
            const rentPriceSPACE = Math.floor(parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString())).toString();
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await expectRevert(decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renterA }), "RENT: Doesn't exist!");
        });
        it('should claim rent successfully', async () => {
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renterA });
            const prevBalance = parseFloat(toBigNumber(await daiInstance.balanceOf(ownerA)).toString());
            // console.log("prev", prevBalance)
            const tx = await decentramallInstance.claim(tokenId, {from: ownerA});
            const newBalance = parseFloat(toBigNumber(await daiInstance.balanceOf(ownerA)).toString());
            // console.log("newBalance", newBalance)
            expect(newBalance > prevBalance).to.be.equal(true);
        });
        it('should fail claim other persons rent', async () => {
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renterA });
            await expectRevert(decentramallInstance.claim(tokenId, {from: renterA}), "CLAIM: Not owner!");
        });
        it('should fail rent as space owner', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(2)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: renterA });
            await decentramallInstance.buy({ from: renterA });
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await expectRevert(decentramallInstance.rent(tokenId, 'some-fake-cid',{from: renterA}), "RENT: Can't rent if address owns SPACE token"); 
        });
        it('should claim rent via withdraw successfully', async () => {
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renterA });
            const prevBalance = parseFloat(toBigNumber(await daiInstance.balanceOf(ownerA)).toString());
            const withdrawTx = await decentramallInstance.withdraw(tokenId, {from: ownerA});
            const newBalance = parseFloat(toBigNumber(await daiInstance.balanceOf(ownerA)).toString());
            expect(newBalance > prevBalance).to.be.equal(true);
        });
    });
});