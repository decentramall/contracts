import { expect } from 'chai';
import { DecentramallInstance } from '../types/truffle-contracts';

const { BN, ether, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const Decentramall = artifacts.require("Decentramall");

const { web3 } = require("@openzeppelin/test-helpers/src/setup");
// const EstateAgent = artifacts.require("EstateAgent");
// const RentalAgent = artifacts.require("RentalAgent");

//Testing Decentramall.sol
contract("Decentramall", function (accounts) {

    describe("EstateAgent", () => {
        const admin = accounts[0];
        const agent = accounts[1];
        const purchaser = accounts[2];
        const renter = accounts[3];
        const hacker = accounts[4];
        let decentramallInstance: DecentramallInstance;
        //Before each unit test  
        beforeEach(async function () {
            decentramallInstance = await Decentramall.new(10, 1);
        });

        it("Testing buy() function", async function () {
            await decentramallInstance.buy({ from: agent, value: ether('2') })
            let decentramallTokenBalance = await web3.eth.getBalance(decentramallInstance.address);
            // expect(decentramallTokenBalance).to.be.bignumber.equal(ether('2'))
        });

        it("Testing sell() function", async function () {
            const tx = await decentramallInstance.buy({ from: purchaser, value: ether('1') })
            // get tokenid from BuyToken event
            const tokenId = tx.logs[0].args[2].toString();

            await decentramallInstance.sell(tokenId, { from: purchaser })
            let decentramallTokenBalance = await web3.eth.getBalance(decentramallInstance.address);
            // expect(decentramallTokenBalance).to.be.bignumber.equal(ether('0.98'))
        });

        // it("Testing withdraw() function", async function () {
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

        // it("Check limit()", async function () {
        //     //Check if limit is 10 based on the value entered during deployment
        //     const newLimit = new BN("100");
        //     await decentramallTokenTokenInstance.setLimit(newLimit, { from: admin });
        //     expect(await decentramallTokenTokenInstance.limit.call({ from: admin })).to.be.bignumber.equal("100");
        // });

        it("Test receive() function", async function () {
            const oldBalance = await web3.eth.getBalance(decentramallInstance.address);
            await web3.eth.sendTransaction({ from: admin, value: ether('1') });
            const newBalance = await web3.eth.getBalance(decentramallInstance.address);
            // expect(newBalance > oldBalance).to.be.equal(true);
        });
    });


    describe("RentalAgent", () => {
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
        // let tokenId = new BN("70359603190535945057867763346504887029712970002228617020990113934931004039163"); //Already checked previously
        let decentramallToken: DecentramallInstance;
        //Before each unit test  
        beforeEach(async function () {
            decentramallToken = await Decentramall.new(10, 1);
        });
    

        it("Testing deposit() function", async function () {
            //First, buy the token
            const tx = await decentramallToken.buy({ from: purchaser, value: ether('2') })
            const tokenId = tx.logs[0].args[2].toString();
    
            //Approve the transfer
            await decentramallToken.approve(decentramallToken.address, tokenId, { from: purchaser });
    
            //Now deposit
            await decentramallToken.deposit(tokenId, { from: purchaser });
            expect(await decentramallToken.checkDelegatedOwner(tokenId, { from: purchaser })).to.be.equal(purchaser);
        });

        it("Testing withdrawSpace() function", async function () {
            // let newTokenId = new BN("15105111975255290057694733458188974452746103912949142486594252717011018707060");
    
            //First, buy the token
            const tx = await decentramallToken.buy({ from: newPurchaser, value: ether('2') })
            const tokenId = tx.logs[0].args[2].toString();
            let ownerBefore = await decentramallToken.ownerOf(tokenId, { from: newPurchaser });
    
            //Approve the transfer        
            await decentramallToken.approve(decentramallToken.address, tokenId, { from: newPurchaser });
    
            //Now deposit
            await decentramallToken.deposit(tokenId, { from: newPurchaser });
    
            //Withdraw
            await decentramallToken.withdrawSpace(tokenId, { from: newPurchaser });
            let ownerAfter = await decentramallToken.ownerOf(tokenId, { from: newPurchaser });
    
            expect(ownerBefore).to.be.equal(ownerAfter);
        });

        it("Renter make rental", async function () {
            const tx = await decentramallToken.buy({ from: newPurchaser, value: ether('2') })
            const tokenId = tx.logs[0].args[2].toString();
            //Rent
            await decentramallToken.rent(tokenId, 'some-fake-cid', { from: renter, value: ether('2') })
    
            expect(await decentramallToken.checkDelegatedOwner(tokenId, { from: renter })).to.be.equal(renter);
        });

        it("newPurchaser claim rental", async function () {
            const tx1 = await decentramallToken.buy({ from: newPurchaser, value: ether('2') })
            const tokenId = tx1.logs[0].args[2].toString();
    
            //Approve the transfer        
            await decentramallToken.approve(decentramallToken.address, tokenId, { from: newPurchaser });
    
            //Deposit again
            await decentramallToken.deposit(tokenId, { from: newPurchaser });
    
            //Rent
            const rentTx = await decentramallToken.rent(tokenId, 'some-fake-cid', { from: renter, value: ether('2') });
            const rentEarned = parseInt(rentTx.logs[0].args[2].toString());
    
            let oldBalance = await web3.eth.getBalance(newPurchaser);
    
            //Claim
            const txInfo = await decentramallToken.claimRent(newPurchaser, tokenId, { from: newPurchaser });
            let newBalance = await web3.eth.getBalance(newPurchaser);
    
            // //Calculate tx cost
            // const tx = await web3.eth.getTransaction(txInfo.tx);
            // const gasCost = tx.gasPrice * txInfo.receipt.gasUsed;
    
            // const expectedFinalBalance = oldBalance - gasCost + rentEarned;
            // const shouldZeroOrMore = newBalance - expectedFinalBalance;
    
            //console.log("Difference: " + (newBalance - oldBalance));
            // expect(newBalance > oldBalance).to.be.equal(true);
        });

        it("Check owner of token not in RentalAgent.sol", async function () {
            const tx1 = await decentramallToken.buy({ from: user, value: ether('2') })
            const tokenId = tx1.logs[0].args[2].toString();
            expect(await decentramallToken.checkDelegatedOwner(tokenId, { from: admin })).to.be.equal(user);
        });

        it("Should let me rent a total of two times", async function () {
            const tx = await decentramallToken.buy({ from: buy1, value: ether('2') })
            const tokenId = tx.logs[0].args[2].toString();
            //Rent
            await decentramallToken.rent(tokenId, 'some-fake-cid', { from: rent1, value: ether('2') })
    
            expect(await decentramallToken.checkDelegatedOwner(tokenId, { from: rent1 })).to.be.equal(rent1);
    
            const tx2 = await decentramallToken.buy({ from: buy2, value: ether('2') })
            const tokenId2 = tx2.logs[0].args[2].toString();
            //Rent
            console.log("Rented To 1: " + (await decentramallToken.spaceInfo(tokenId, {from: admin}))[1])
            console.log("Rented To 2: " + (await decentramallToken.spaceInfo(tokenId2, {from: admin}))[1])
    
            await decentramallToken.rent(tokenId2, 'some-fake-cid', { from: rent2, value: ether('2') })
            expect(await decentramallToken.checkDelegatedOwner(tokenId2, { from: rent2 })).to.be.equal(rent2);
        });
    });
});