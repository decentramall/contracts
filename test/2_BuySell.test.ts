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

            await decentramallInstance.sell(tokenId, { from: ownerA });
            const currentBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
            expect(currentBalance.toString()).to.be.eq(previousBalance.plus(priceSPACE).toString());
        });

        it('should fail selling someone else space', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            const tokenId = tx.logs[1].args[1].toString();
            const previousBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
            await expectRevert(decentramallInstance.sell(tokenId, { from: renterA }), 'SELL: Not owner!');
        });
        it('should fail buying two space', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(1)).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            const newPrice = toBigNumber(await decentramallInstance.price(2)).toString();
            await daiInstance.approve(decentramallInstance.address, newPrice, { from: ownerA });
            await expectRevert(decentramallInstance.buy({ from: ownerA }), 'ERC721: token already minted');
        });
        it('Todo: Fail buying 1201 space', async () => {
            
        });
    });
});