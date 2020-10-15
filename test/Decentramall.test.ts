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

    // describe('Price', () => {
    //     beforeEach(async () => {
    //         daiInstance = await DAI.new(accounts);
    //         decentramallInstance = await Decentramall.new(1200, 2500, 100000, daiInstance.address);
    //     });
    //     it('Should return roughly 289.00 DAI for 1st SPACE', async () => {
    //         const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
    //         expect(priceSPACE > "288500000000000000000" || priceSPACE < "289500000000000000000").to.be.equal(true);
    //     });
    //     it('Should return roughly 2389.00 DAI for 586th SPACE', async () => {
    //         const priceSPACE = toBigNumber(await decentramallInstance.price(586)).toString();
    //         expect(priceSPACE > "2388500000000000000000" || priceSPACE < "2389500000000000000000").to.be.equal(true);
    //     });
    //     it('Should return roughly 4711.00 DAI for 1200th SPACE', async () => {
    //         const priceSPACE = toBigNumber(await decentramallInstance.price(1200)).toString();
    //         expect(priceSPACE > "4710500000000000000000" || priceSPACE < "4711500000000000000000").to.be.equal(true);
    //     });
    // });

    // describe('Buy & Sell', () => {
    //     beforeEach(async () => {
    //         daiInstance = await DAI.new(accounts);
    //         decentramallInstance = await Decentramall.new(1200, 2500, 100000, daiInstance.address);
    //     });

    //     it('should be able to buy the first space with success', async () => {
    //         const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
    //         const previousBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
    //         // console.log("Space Price: ", priceSPACE);
    //         // console.log("Prev Balance: ", previousBalance.toString());
    //         await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
    //         const tx = await decentramallInstance.buy({ from: ownerA });
    //         const isOwner = await decentramallInstance.ownerOf(tx.logs[1].args[1].toString());
    //         expect(isOwner).to.be.eq(ownerA);
    //         const currentBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
    //         // console.log("Current Balance: ", currentBalance.toString());
    //         expect(currentBalance.toString()).to.be.eq(previousBalance.minus(priceSPACE).toString());
    //     });

    //     it('should be able to sell the first bought space with success', async () => {
    //         const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
    //         await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
    //         const tx = await decentramallInstance.buy({ from: ownerA });
    //         const tokenId = tx.logs[1].args[1].toString();
    //         const previousBalance = toBigNumber(await daiInstance.balanceOf(ownerA));

    //         await decentramallInstance.sell(tokenId, { from: ownerA });
    //         const currentBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
    //         expect(currentBalance.toString()).to.be.eq(previousBalance.plus(priceSPACE).toString());
    //     });

    //     it('should fail selling someone else space', async () => {
    //         const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
    //         await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
    //         const tx = await decentramallInstance.buy({ from: ownerA });
    //         const tokenId = tx.logs[1].args[1].toString();
    //         const previousBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
    //         await expectRevert(decentramallInstance.sell(tokenId, { from: renterA }), 'WITHDRAW: Not owner!');
    //     });
    //     it('should fail buying two space', async () => {
    //         const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
    //         await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
    //         const tx = await decentramallInstance.buy({ from: ownerA });
    //         const newPrice = toBigNumber(await decentramallInstance.price(2)).toString();
    //         await daiInstance.approve(decentramallInstance.address, newPrice, { from: ownerA });
    //         await expectRevert(decentramallInstance.buy({ from: ownerA }), 'ERC721: token already minted');
    //     });
    //     it('Todo: Fail buying 1201 space', async () => {
            
    //     });
    // });

    // describe('Deposit & Withdraw', () => {
    //     beforeEach(async () => {
    //         daiInstance = await DAI.new(accounts);
    //         decentramallInstance = await Decentramall.new(1200, 2500, 100000, daiInstance.address);
    //         const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
    //         await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
    //         const tx = await decentramallInstance.buy({ from: ownerA });
    //         // console.log("tx log object", tx);
    //         tokenId = tx.logs[1].args[1].toString();
    //     });

    //     it('should deposit successfully', async () => {
    //         const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
    //         // console.log("tx log object", depositTx);
    //         const newOwner = await decentramallInstance.ownerOf(tokenId);
    //         expect(newOwner).to.be.eq(decentramallInstance.address);
    //     });
    //     // it('should maintain ownership', async () => {
    //     //     const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
    //     //     await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
    //     //     const tx = await decentramallInstance.buy({ from: ownerA });
    //     //     const tokenId = tx.logs[1].args[1].toString();
    //     //     const isOwner = await decentramallInstance.ownerOf(tokenId);
    //     //     const isRentableOwner = await decentramallInstance.spaceInfo.call(ownerA);
    //     //     console.log(isRentableOwner);
    //     //     console.log("tx log object", tx);
    //     //     expect(isOwner).to.be.eq(ownerA);
    //     //     // console.log("tx log object", depositTx);
    //     //     const newOwner = await decentramallInstance.ownerOf(tokenId);
    //     //     expect(newOwner).to.be.eq(decentramallInstance.address);
    //     // });

    //     it('should withdraw successfully', async () => {
    //         const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
    //         const withdrawTx = await decentramallInstance.withdraw(tokenId, {from: ownerA});
    //         const newOwner = await decentramallInstance.ownerOf(tokenId);
    //         expect(newOwner).to.be.eq(ownerA);
    //     });

    //     // it('should not allow someone else to deposit', async () => {
    //     //     const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
    //     //     await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
    //     //     const tx = await decentramallInstance.buy({ from: ownerA });
    //     //     const tokenId = tx.logs[1].args[1].toString();
    //     //     const isOwner = await decentramallInstance.ownerOf(tokenId);
    //     //     expect(isOwner).to.be.eq(ownerA);

    //     //     const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
    //     //     const newOwner = await decentramallInstance.ownerOf(tokenId);
    //     //     expect(newOwner).to.be.eq(decentramallInstance.address);
    //     // });

    //     // it('should not allow someone else to deposit (wrong hash)', async () => {
    //     //     const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
    //     //     await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
    //     //     const tx = await decentramallInstance.buy({ from: ownerA });
    //     //     const tokenId = tx.logs[1].args[1].toString();
    //     //     const isOwner = await decentramallInstance.ownerOf(tokenId);
    //     //     expect(isOwner).to.be.eq(ownerA);

    //     //     const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
    //     //     const newOwner = await decentramallInstance.ownerOf(tokenId);
    //     //     expect(newOwner).to.be.eq(decentramallInstance.address);
    //     // });

    //     // it('should not allow someone else to withdraw', async () => {
    //     //     const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
    //     //     await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
    //     //     const tx = await decentramallInstance.buy({ from: ownerA });
    //     //     const tokenId = tx.logs[1].args[1].toString();
    //     //     const isOwner = await decentramallInstance.ownerOf(tokenId);
    //     //     expect(isOwner).to.be.eq(ownerA);

    //     //     const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
    //     //     const newOwner = await decentramallInstance.ownerOf(tokenId);
    //     //     expect(newOwner).to.be.eq(decentramallInstance.address);
    //     // });

    //     // it('should not allow withdraw as it doesnt exist in contract', async () => {
    //     //     const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
    //     //     await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
    //     //     const tx = await decentramallInstance.buy({ from: ownerA });
    //     //     const tokenId = tx.logs[1].args[1].toString();
    //     //     const isOwner = await decentramallInstance.ownerOf(tokenId);
    //     //     expect(isOwner).to.be.eq(ownerA);

    //     //     const depositTx = await decentramallInstance.deposit(tokenId, {from: ownerA});
    //     //     const newOwner = await decentramallInstance.ownerOf(tokenId);
    //     //     expect(newOwner).to.be.eq(decentramallInstance.address);
    //     // });
    // });

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