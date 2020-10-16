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
    const renterB = accounts[3];
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
            const expiryBlock = parseInt(spaceInfoData[4].toString());
            
            await expect(rentedTo).to.be.equal("0x0000000000000000000000000000000000000000");
            await expect(expiryBlock).to.be.equal(parseInt(nowBlock));
        });
        it('should fail cancel (not rented)', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(2)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerB });
            const tx = await decentramallInstance.buy({ from: ownerB });
            tokenId = tx.logs[1].args[1].toString();
            await decentramallInstance.deposit(tokenId, "375", {from: ownerB});

            await expectRevert(decentramallInstance.cancelRent(tokenId, {from:renterB}), "CANCEL: Token not rented!");
        });
        it('should fail cancel (not renter)', async () => {
            await expectRevert(decentramallInstance.cancelRent(tokenId, {from:renterB}), "CANCEL: Not renter!");
        });
        it('should fail cancel (past 1 day)', async () => {
            for(let i=0; i<8; i++){
                await advanceBlock();
            }

            await expectRevert(decentramallInstance.cancelRent(tokenId, {from:renterA}), "CANCEL: Can't cancel after 1 day!");
        });
        it('should extend successfully', async () => {
            const old = await decentramallInstance.spaceInfo(tokenId, {from:renterA});
            const oldBlock = parseInt(old[4].toString());

            const priceSPACE = toBigNumber(await decentramallInstance.price(2)).toString(); // Some big number for the sake of approving
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: renterA });
            await decentramallInstance.extendRent(tokenId, "100", {from: renterA});
            
            const newData = await decentramallInstance.spaceInfo(tokenId, {from:renterA});
            const rentedTo = newData[0];
            const newBlock = parseInt(newData[4].toString());
            
            await expect(rentedTo).to.be.equal(renterA);
            await expect(newBlock).to.be.equal(oldBlock+100);
        });
        it('should fail extend (not rented)', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(2)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerB });
            const tx = await decentramallInstance.buy({ from: ownerB });
            tokenId = tx.logs[1].args[1].toString();
            await decentramallInstance.deposit(tokenId, "375", {from: ownerB});

            await expectRevert(decentramallInstance.extendRent(tokenId, "1", {from:renterB}), "EXTEND: Token not rented!");
        });
        it('should fail extend (not renter)', async () => {
            await expectRevert(decentramallInstance.extendRent(tokenId, "100", {from:renterB}), "EXTEND: Not renter!");
        });
        it('should fail extend (exceed maxRentableBlock)', async () => {
            await expectRevert(decentramallInstance.extendRent(tokenId, "189", {from:renterA}), "EXTEND: Rent duration exceed maxRentableBlock!");
        });
    });
});