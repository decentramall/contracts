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

    describe('Space Owner', () => {
        beforeEach(async () => {
            daiInstance = await DAI.new(accounts);
            decentramallInstance = await Decentramall.new(10, 1, daiInstance.address);
        });

        it('should be able to buy the first space with success', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(1))
                .multipliedBy(await decentramallInstance.multiplier()).toString();
            const previousBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            const isOwner = await decentramallInstance.ownerOf(tx.logs[1].args[2].toString());
            expect(isOwner).to.be.eq(ownerA);
            const currentBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
            expect(currentBalance.toString()).to.be.eq(previousBalance.minus(priceSPACE).toString());
        });

        it('should be able to sell the first bought space with success', async () => {
            const priceSPACE = toBigNumber(await decentramallInstance.price(1))
                .multipliedBy(await decentramallInstance.multiplier()).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            // get tokenid from BuyToken event
            const tokenId = tx.logs[0].args[2].toString();
            const previousBalance = toBigNumber(await daiInstance.balanceOf(ownerA));

            await decentramallInstance.sell(tokenId, { from: ownerA })
            const currentBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
            expect(currentBalance.toString()).to.be.eq(previousBalance.plus(priceSPACE).toString());
        });
    });


    describe('Rental', () => {
        beforeEach(async () => {
            daiInstance = await DAI.new(accounts);
            decentramallInstance = await Decentramall.new(10, 1, daiInstance.address);
            //
            const priceSPACE = toBigNumber(await decentramallInstance.price(1))
                .multipliedBy(await decentramallInstance.multiplier()).toString();
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: ownerA });
            const tx = await decentramallInstance.buy({ from: ownerA });
            // get tokenid from BuyToken event
            tokenId = tx.logs[0].args[2].toString();
        });

        it('should be able to rent', async () => {
            const rentPriceSPACE = Math.floor(parseFloat(toBigNumber(await decentramallInstance.price(2))
                .multipliedBy(await decentramallInstance.multiplier()).dividedBy(120).toString()));
            const previousBalance = toBigNumber(await daiInstance.balanceOf(renterA));
            console.log("Rent price: " + rentPriceSPACE)
            console.log("Prev bal: " + previousBalance)
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renterA })
            const currentBalance = toBigNumber(await daiInstance.balanceOf(renterA));
            expect(currentBalance.toString()).to.be.eq(previousBalance.minus(rentPriceSPACE).toString());
        });

        it('should be able to claim rent', async () => {
            const rentPriceSPACE = Math.floor(parseFloat(toBigNumber(await decentramallInstance.price(2))
                .multipliedBy(await decentramallInstance.multiplier()).dividedBy(120).toString()));
            await daiInstance.approve(decentramallInstance.address, rentPriceSPACE, { from: renterA });
            await decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renterA })
            const previousBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
            await decentramallInstance.claim(tokenId, { from: ownerA })
            const currentBalance = toBigNumber(await daiInstance.balanceOf(ownerA));
            expect(currentBalance.toString()).to.be.eq(previousBalance.plus(rentPriceSPACE).toString());
        });

        // it('Should let me rent a total of two times', async function () {
        //     const tx = await decentramallInstance.buy({ from: buy1, value: ether('2') })
        //     const tokenId = tx.logs[0].args[2].toString();
        //     //Rent
        //     await decentramallInstance.rent(tokenId, 'some-fake-cid', { from: rent1, value: ether('2') })

        //     // expect(await decentramallInstance.checkDelegatedOwner(tokenId, { from: rent1 })).to.be.equal(rent1);

        //     const tx2 = await decentramallInstance.buy({ from: buy2, value: ether('2') })
        //     const tokenId2 = tx2.logs[0].args[2].toString();
        //     //Rent
        //     console.log('Rented To 1: ' + (await decentramallInstance.spaceInfo(tokenId, { from: admin }))[1])
        //     console.log('Rented To 2: ' + (await decentramallInstance.spaceInfo(tokenId2, { from: admin }))[1])

        //     await decentramallInstance.rent(tokenId2, 'some-fake-cid', { from: rent2, value: ether('2') })
        //     // expect(await decentramallInstance.checkDelegatedOwner(tokenId2, { from: rent2 })).to.be.equal(rent2);
        // });
    });
});