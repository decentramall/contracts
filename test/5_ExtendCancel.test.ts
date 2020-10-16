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

    describe('Cancel & Extend Rent', () => {
        beforeEach(async () => {
            daiInstance = await DAI.new([accounts[0], accounts[1], accounts[2], accounts[3]]);
            decentramallInstance = await Decentramall.new(1200, 2500, 100000, daiInstance.address);
            const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            tokenId = tx.logs[1].args[1].toString();
            await decentramallInstance.deposit(tokenId, "375", {from: ownerA});
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', "187", { from: renterA })
        });

        it('should cancel successfully', async () => {
            await decentramallInstance.cancelRent(tokenId, {from: renterA});
            
            const nowBlock = await web3.eth.getBlockNumber();
            const spaceInfoData = await decentramallInstance.spaceInfo(tokenId, {from:renterA});
            const rentedTo = spaceInfoData[0];
            const expiryBlock = spaceInfoData[4];
            
            await expect(rentedTo).to.be.equal("0x0000000000000000000000000000000000000000");
            await expect(expiryBlock).to.be.equal(nowBlock);
        });
        it('should fail cancel (too short)', async () => {
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            const previousBalance = parseFloat(toBigNumber(await daiInstance.balanceOf(renterA)).toString());
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await expectRevert(decentramallInstance.rent(tokenId, 'some-fake-cid', "186", { from: renterA }), "RENT: Rent duration has to be more than 187714 blocks!");
        });
        it('should fail rent (not enough funds)', async () => {
            const rentPriceSPACE = Math.floor(parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(22520).multipliedBy(187).toString())).toString();
            // console.log("rent price", rentPriceSPACE);
            // const bal = await daiInstance.balanceOf(noMoney);
            // console.log(bal.toString());
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: noMoney });
            await expectRevert(decentramallInstance.rent(tokenId, 'some-fake-cid', "187", { from: noMoney }), "ERC20: transfer amount exceeds balance");
        });
        it('should fail rent (already rented)', async () => {
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', "187", { from: renterA });
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterB });
            await expectRevert(decentramallInstance.rent(tokenId, 'some-fake-cid', "187", { from: renterB }), "RENT: Token is already rented!");
        });
        it('should fail rent (nonexistent token)', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(2)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerB });
            const tx = await decentramallInstance.buy({ from: ownerB });
            tokenId = tx.logs[1].args[1].toString();
            const rentPriceSPACE = Math.floor(parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString())).toString();
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await expectRevert(decentramallInstance.rent(tokenId, 'some-fake-cid', "187", { from: renterA }), "RENT: Doesn't exist!");
        });
        it('should claim rent successfully', async () => {
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', "187", { from: renterA });
            
            const spaceInfoData = await decentramallInstance.spaceInfo(tokenId, {from:renterA});
            const oldBalance = parseFloat(spaceInfoData[1].toString());

            for(let i=0; i<7; i++){
                await advanceBlock();
            }
            
            await decentramallInstance.claim(tokenId, {from:ownerA});
            const newData = await decentramallInstance.spaceInfo(tokenId, {from:renterA});
            const newBalance = parseFloat(newData[1].toString());

            expect(oldBalance > newBalance).to.be.equal(true);
        });
        it('should fail claim rent', async () => {
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', "187", { from: renterA });
            const prevBalance = parseFloat(toBigNumber(await daiInstance.balanceOf(ownerA)).toString());
            await expectRevert(decentramallInstance.claim(tokenId, {from: ownerA}), "CLAIM: Can't claim before 1 day!");
        });
        it('should fail claim other persons rent', async () => {
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', "187", { from: renterA });
            await expectRevert(decentramallInstance.claim(tokenId, {from: renterA}), "CLAIM: Not owner!");
        });
        it('should fail rent as space owner', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(2)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: renterA });
            await decentramallInstance.buy({ from: renterA });
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await expectRevert(decentramallInstance.rent(tokenId, 'some-fake-cid', "187", {from: renterA}), "RENT: Can't rent if address owns SPACE token"); 
        });
        it('should claim rent via withdraw successfully', async () => {
            const rentPriceSPACE = parseFloat(toBigNumber(await decentramallInstance.price(2)).dividedBy(110).toString()).toString(); //For more allowane
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', "187", { from: renterA });
            await decentramallInstance.cancelRent(tokenId, { from: renterA });
            
            const spaceInfoData = await decentramallInstance.spaceInfo(tokenId, {from:renterA});
            const oldBalance = parseFloat(spaceInfoData[1].toString());

            for(let i=0; i<375; i++){
                await advanceBlock();
            }

            const withdrawTx = await decentramallInstance.withdraw(tokenId, {from: ownerA});
            const newData = await decentramallInstance.spaceInfo(tokenId, {from:renterA});
            const newBalance = parseFloat(newData[1].toString());

            expect(oldBalance > newBalance).to.be.equal(true);
        });
    });
});