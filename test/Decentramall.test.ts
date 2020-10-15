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

    describe('Buy & Sell', () => {
        beforeEach(async () => {
            daiInstance = await DAI.new(accounts);
            decentramallInstance = await Decentramall.new(1200, 2500, 100000, daiInstance.address);
        });

        it('should be able to buy the first space with success', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
            const previousBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
            // console.log("Space Price: ", priceSPACE);
            // console.log("Prev Balance: ", previousBalance.toString());
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            const isOwner = await decentramallInstance.ownerOf(tx.logs[1].args[1].toString());
            expect(isOwner).to.be.eq(ownerA);
            const currentBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
            // console.log("Current Balance: ", currentBalance.toString());
            expect(currentBalance.toString()).to.be.eq(previousBalance.minus(priceSPACE).toString());
        });

        it('should be able to sell the first bought space with success', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            const tokenId = tx.logs[1].args[1].toString();
            const previousBalance = toBigNumber(await daiInstance.balanceOf(ownerA));

            await decentramallInstance.sell(tokenId, { from: ownerA })
            const currentBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
            expect(currentBalance.toString()).to.be.eq(previousBalance.plus(priceSPACE).toString());
        });
    });

    describe('Deposit & Withdraw', () => {
        beforeEach(async () => {
            daiInstance = await DAI.new(accounts);
            decentramallInstance = await Decentramall.new(1200, 2500, 100000, daiInstance.address);
        });

        it('should deposit successfully', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            const tokenId = tx.logs[1].args[1].toString();
            const isOwner = await decentramallInstance.ownerOf(tokenId);
            // console.log("tx log object", tx);
            expect(isOwner).to.be.eq(ownerA);
            const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
            // console.log("tx log object", depositTx);
            const newOwner = await decentramallInstance.ownerOf(tokenId);
            expect(newOwner).to.be.eq(decentramallInstance.address);
        });
        // it('should maintain ownership', async () => {
        //     const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
        //     await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
        //     const tx = await decentramallInstance.buy({ from: ownerA });
        //     const tokenId = tx.logs[1].args[1].toString();
        //     const isOwner = await decentramallInstance.ownerOf(tokenId);
        //     const isRentableOwner = await decentramallInstance.spaceInfo.call(ownerA);
        //     console.log(isRentableOwner);
        //     console.log("tx log object", tx);
        //     expect(isOwner).to.be.eq(ownerA);
        //     // console.log("tx log object", depositTx);
        //     const newOwner = await decentramallInstance.ownerOf(tokenId);
        //     expect(newOwner).to.be.eq(decentramallInstance.address);
        // });

        it('should withdraw successfully', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            const tokenId = tx.logs[1].args[1].toString();
            const isOwner = await decentramallInstance.ownerOf(tokenId);
            expect(isOwner).to.be.eq(ownerA);
            console.log("Token ID:", tokenId);
            const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
            const mallOwner = await decentramallInstance.ownerOf(tokenId);
            expect(mallOwner).to.be.eq(decentramallInstance.address);
            console.log("Hopefully same Token ID:", depositTx.logs[1].args[2].toString());
            const withdrawTx = await decentramallInstance.withdraw(tokenId, {from: ownerA});
            console.log("Hopefully same Token ID AGAIN:", withdrawTx.logs[1].args[2].toString());
            const newOwner = await decentramallInstance.ownerOf(tokenId);
            expect(newOwner).to.be.eq(ownerA);
        });

        // it('should not allow someone else to deposit', async () => {
        //     const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
        //     await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
        //     const tx = await decentramallInstance.buy({ from: ownerA });
        //     const tokenId = tx.logs[1].args[1].toString();
        //     const isOwner = await decentramallInstance.ownerOf(tokenId);
        //     expect(isOwner).to.be.eq(ownerA);

        //     const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
        //     const newOwner = await decentramallInstance.ownerOf(tokenId);
        //     expect(newOwner).to.be.eq(decentramallInstance.address);
        // });

        // it('should not allow someone else to deposit (wrong hash)', async () => {
        //     const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
        //     await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
        //     const tx = await decentramallInstance.buy({ from: ownerA });
        //     const tokenId = tx.logs[1].args[1].toString();
        //     const isOwner = await decentramallInstance.ownerOf(tokenId);
        //     expect(isOwner).to.be.eq(ownerA);

        //     const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
        //     const newOwner = await decentramallInstance.ownerOf(tokenId);
        //     expect(newOwner).to.be.eq(decentramallInstance.address);
        // });

        // it('should not allow someone else to withdraw', async () => {
        //     const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
        //     await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
        //     const tx = await decentramallInstance.buy({ from: ownerA });
        //     const tokenId = tx.logs[1].args[1].toString();
        //     const isOwner = await decentramallInstance.ownerOf(tokenId);
        //     expect(isOwner).to.be.eq(ownerA);

        //     const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
        //     const newOwner = await decentramallInstance.ownerOf(tokenId);
        //     expect(newOwner).to.be.eq(decentramallInstance.address);
        // });

        // it('should not allow withdraw as it doesnt exist in contract', async () => {
        //     const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
        //     await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
        //     const tx = await decentramallInstance.buy({ from: ownerA });
        //     const tokenId = tx.logs[1].args[1].toString();
        //     const isOwner = await decentramallInstance.ownerOf(tokenId);
        //     expect(isOwner).to.be.eq(ownerA);

        //     const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
        //     const newOwner = await decentramallInstance.ownerOf(tokenId);
        //     expect(newOwner).to.be.eq(decentramallInstance.address);
        // });
    });
});