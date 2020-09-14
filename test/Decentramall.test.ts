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

contract('Decentramall', function (accounts) {

    describe('EstateAgent', () => {
        const admin = accounts[0];
        const agent = accounts[1];
        const purchaser = accounts[2];
        const renter = accounts[3];
        const hacker = accounts[4];
        const userA = accounts[5];
        let decentramallInstance: DecentramallInstance;
        let daiInstance: ERC20Instance;
        //Before each unit test  
        beforeEach(async function () {
            daiInstance = await DAI.new(accounts);
            decentramallInstance = await Decentramall.new(10, 1, daiInstance.address);
        });

        it('should buy the first space with success', async function () {
            const priceSPACE = toBigNumber(await decentramallInstance.price(1)).multipliedBy(await decentramallInstance.multiplier()).toString();
            const previousBalance = toBigNumber(await daiInstance.balanceOf(userA));
            await daiInstance.approve(decentramallInstance.address, priceSPACE, { from: userA });
            const tx = await decentramallInstance.buy({ from: userA });
            const isOwner = await decentramallInstance.ownerOf(tx.logs[1].args[2].toString());
            expect(isOwner).to.be.eq(userA);
            const currentBalance = toBigNumber(await daiInstance.balanceOf(userA));
            expect(currentBalance.toString()).to.be.eq(previousBalance.minus(priceSPACE).toString());
        });

        it('Testing sell() function', async function () {
            const tx = await decentramallInstance.buy({ from: purchaser, value: ether('1') })
            // get tokenid from BuyToken event
            const tokenId = tx.logs[0].args[2].toString();

            await decentramallInstance.sell(tokenId, { from: purchaser })
            let decentramallTokenBalance = await web3.eth.getBalance(decentramallInstance.address);
            // expect(decentramallTokenBalance).to.be.bignumber.equal(ether('0.98'))
        });

        // it('Testing withdraw() function', async function () {
        //     //transfering 2 ETH
        //     await decentramallInstance.buy({ from: admin, value: ether('2') })

        //     //check balance
        //     // let decentramallTokenBalanceBefore = await decentramallInstance.balance({ from: admin });
        //     //withdraw 1 ETH
        //     // await decentramallInstance.withdraw(admin, ether('1'), { from: admin });

        //     //recheck balance
        //     let decentramallTokenBalanceAfter = await web3.eth.getBalance(decentramallInstance.address);
        //     //assertion        
        //     expect(decentramallTokenBalanceAfter).to.be.bignumber.equal(ether('1'))
        // });

        // it('Check limit()', async function () {
        //     //Check if limit is 10 based on the value entered during deployment
        //     const newLimit = new BN('100');
        //     await decentramallTokenTokenInstance.setLimit(newLimit, { from: admin });
        //     expect(await decentramallTokenTokenInstance.limit.call({ from: admin })).to.be.bignumber.equal('100');
        // });

        it('Test receive() function', async function () {
            const oldBalance = await web3.eth.getBalance(decentramallInstance.address);
            await web3.eth.sendTransaction({ from: admin, value: ether('1') });
            const newBalance = await web3.eth.getBalance(decentramallInstance.address);
            // expect(newBalance > oldBalance).to.be.equal(true);
        });
    });


    describe('RentalAgent', () => {
        const admin = accounts[0];
        const agent = accounts[1];
        const purchaser = accounts[2];
        const renter = accounts[3];
        const user = accounts[4];
        const newPurchaser = accounts[5];
        const buy1 = accounts[6];
        const buy2 = accounts[7];
        const rent1 = accounts[8];
        const rent2 = accounts[9];
        // let tokenId = new BN('70359603190535945057867763346504887029712970002228617020990113934931004039163'); //Already checked previously
        let decentramallInstance: DecentramallInstance;
        let daiInstance: ERC20Instance;
        //Before each unit test  
        beforeEach(async function () {
            daiInstance = await DAI.new(accounts);
            decentramallInstance = await Decentramall.new(10, 1, daiInstance.address);
        });


        it('Testing deposit() function', async function () {
            //First, buy the token
            const tx = await decentramallInstance.buy({ from: purchaser, value: ether('2') })
            const tokenId = tx.logs[0].args[2].toString();

            //Approve the transfer
            await decentramallInstance.approve(decentramallInstance.address, tokenId, { from: purchaser });

            // //Now deposit
            // await decentramallInstance.deposit(tokenId, { from: purchaser });
            // expect(await decentramallInstance.checkDelegatedOwner(tokenId, { from: purchaser })).to.be.equal(purchaser);
        });

        it('Testing withdrawSpace() function', async function () {
            // let newTokenId = new BN('15105111975255290057694733458188974452746103912949142486594252717011018707060');

            //First, buy the token
            const tx = await decentramallInstance.buy({ from: newPurchaser, value: ether('2') })
            const tokenId = tx.logs[0].args[2].toString();
            let ownerBefore = await decentramallInstance.ownerOf(tokenId, { from: newPurchaser });

            //Approve the transfer        
            await decentramallInstance.approve(decentramallInstance.address, tokenId, { from: newPurchaser });

            // //Now deposit
            // await decentramallInstance.deposit(tokenId, { from: newPurchaser });

            // //Withdraw
            // await decentramallInstance.withdrawSpace(tokenId, { from: newPurchaser });
            // let ownerAfter = await decentramallInstance.ownerOf(tokenId, { from: newPurchaser });

            // expect(ownerBefore).to.be.equal(ownerAfter);
        });

        it('Renter make rental', async function () {
            const tx = await decentramallInstance.buy({ from: newPurchaser, value: ether('2') })
            const tokenId = tx.logs[0].args[2].toString();
            //Rent
            await decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renter, value: ether('2') })

            // expect(await decentramallInstance.checkDelegatedOwner(tokenId, { from: renter })).to.be.equal(renter);
        });

        it('newPurchaser claim rental', async function () {
            const tx1 = await decentramallInstance.buy({ from: newPurchaser, value: ether('2') })
            const tokenId = tx1.logs[0].args[2].toString();

            //Approve the transfer        
            await decentramallInstance.approve(decentramallInstance.address, tokenId, { from: newPurchaser });

            // //Deposit again
            // await decentramallInstance.deposit(tokenId, { from: newPurchaser });

            // //Rent
            // const rentTx = await decentramallInstance.rent(tokenId, 'some-fake-cid', { from: renter, value: ether('2') });
            // const rentEarned = parseInt(rentTx.logs[0].args[2].toString());

            // let oldBalance = await web3.eth.getBalance(newPurchaser);

            // //Claim
            // const txInfo = await decentramallInstance.claimRent(newPurchaser, tokenId, { from: newPurchaser });
            // let newBalance = await web3.eth.getBalance(newPurchaser);

            // //Calculate tx cost
            // const tx = await web3.eth.getTransaction(txInfo.tx);
            // const gasCost = tx.gasPrice * txInfo.receipt.gasUsed;

            // const expectedFinalBalance = oldBalance - gasCost + rentEarned;
            // const shouldZeroOrMore = newBalance - expectedFinalBalance;

            //console.log('Difference: ' + (newBalance - oldBalance));
            // expect(newBalance > oldBalance).to.be.equal(true);
        });

        it('Check owner of token not in RentalAgent.sol', async function () {
            const tx1 = await decentramallInstance.buy({ from: user, value: ether('2') })
            const tokenId = tx1.logs[0].args[2].toString();
            // expect(await decentramallInstance.checkDelegatedOwner(tokenId, { from: admin })).to.be.equal(user);
        });

        it('Should let me rent a total of two times', async function () {
            const tx = await decentramallInstance.buy({ from: buy1, value: ether('2') })
            const tokenId = tx.logs[0].args[2].toString();
            //Rent
            await decentramallInstance.rent(tokenId, 'some-fake-cid', { from: rent1, value: ether('2') })

            // expect(await decentramallInstance.checkDelegatedOwner(tokenId, { from: rent1 })).to.be.equal(rent1);

            const tx2 = await decentramallInstance.buy({ from: buy2, value: ether('2') })
            const tokenId2 = tx2.logs[0].args[2].toString();
            //Rent
            console.log('Rented To 1: ' + (await decentramallInstance.spaceInfo(tokenId, { from: admin }))[1])
            console.log('Rented To 2: ' + (await decentramallInstance.spaceInfo(tokenId2, { from: admin }))[1])

            await decentramallInstance.rent(tokenId2, 'some-fake-cid', { from: rent2, value: ether('2') })
            // expect(await decentramallInstance.checkDelegatedOwner(tokenId2, { from: rent2 })).to.be.equal(rent2);
        });
    });
});