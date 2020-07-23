const { BN, ether, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const Administration = artifacts.require("Administration");
const DecentramallToken = artifacts.require("DecentramallToken");
const EstateAgent = artifacts.require("EstateAgent");
const RentalAgent = artifacts.require("RentalAgent");


//Testing RentalAgent.sol
contract("RentalAgent", function (accounts) {
    const admin = accounts[0];
    const agent = accounts[1];
    const purchaser = accounts[2];
    const renter = accounts[3];
    const hacker = accounts[4];
    const newPurchaser = accounts[5];
    let tokenId = new BN("70359603190535945057867763346504887029712970002228617020990113934931004039163"); //Already checked previously
    //Before each unit test  
    beforeEach(async function () {

        this.estateAgent = await EstateAgent.deployed();
        let tokenAddress = await this.estateAgent.token.call({ from: admin });
        this.token = await DecentramallToken.at(tokenAddress);
        this.rentalAgentTokenInstance = await RentalAgent.new(this.token.address, this.estateAgent.address);
    });

    it("Verify Admin", async function () {
        expect(await this.rentalAgentTokenInstance.verifyAdmin.call(admin, { from: admin })).to.be.equal(true);
    });
    it("Testing deposit() function", async function () {
        //First, buy the token
        await this.estateAgent.buy({ from: purchaser, to: this.estateAgent.address, value: "2000000000000000000" })

        //Approve the transfer
        await this.token.approve(this.rentalAgentTokenInstance.address, tokenId, { from: purchaser });

        //Now deposit
        await this.rentalAgentTokenInstance.deposit(tokenId, { from: purchaser });
        expect(await this.rentalAgentTokenInstance.checkDelegatedOwner(tokenId, { from: purchaser })).to.be.equal(purchaser);
    });
    it("Testing withdrawSpace() function", async function () {
        let newTokenId = new BN("15105111975255290057694733458188974452746103912949142486594252717011018707060");

        //First, buy the token
        await this.estateAgent.buy({ from: newPurchaser, to: this.estateAgent.address, value: "2000000000000000000" })
        let ownerBefore = await this.token.ownerOf(newTokenId, { from: newPurchaser });

        //Approve the transfer        
        await this.token.approve(this.rentalAgentTokenInstance.address, newTokenId, { from: newPurchaser });

        //Now deposit
        await this.rentalAgentTokenInstance.deposit(newTokenId, { from: newPurchaser });

        //Withdraw
        await this.rentalAgentTokenInstance.withdrawSpace(newTokenId, { from: newPurchaser });
        let ownerAfter = await this.token.ownerOf(newTokenId, { from: newPurchaser });

        expect(ownerBefore).to.be.equal(ownerAfter);
    });
    it("Renter make rental", async function () {
        //Rent
        await this.rentalAgentTokenInstance.rent(tokenId, { from: renter, value: "2000000000000000000" })

        expect(await this.rentalAgentTokenInstance.checkDelegatedOwner(tokenId, { from: renter })).to.be.equal(renter);
    });
    it("newPurchaser claim rental", async function () {
        let newTokenId = new BN("15105111975255290057694733458188974452746103912949142486594252717011018707060");

        //Approve the transfer        
        await this.token.approve(this.rentalAgentTokenInstance.address, newTokenId, { from: newPurchaser });

        //Deposit again
        await this.rentalAgentTokenInstance.deposit(newTokenId, { from: newPurchaser });

        //Rent
        await this.rentalAgentTokenInstance.rent(newTokenId, { from: renter, value: "2000000000000000000" });

        let oldBalance = await web3.eth.getBalance(newPurchaser);

        //Claim
        const txInfo = await this.rentalAgentTokenInstance.claimRent(newPurchaser, newTokenId, { from: newPurchaser });
        let newBalance = await web3.eth.getBalance(newPurchaser);

        //Calculate tx cost
        const tx = await web3.eth.getTransaction(txInfo.tx);
        const gasCost = tx.gasPrice * txInfo.receipt.gasUsed;

        const properBalance = newBalance - gasCost + 1000000000000000;
        expect(properBalance > oldBalance).to.be.equal(true);
    });
});