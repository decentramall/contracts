const { BN, ether, expectRevert } = require("@openzeppelin/test-helpers");
const truffleAssert = require('truffle-assertions');
const { expect } = require("chai");
const Administration = artifacts.require("Administration");
const DecentramallToken = artifacts.require("DecentramallToken");
const EstateAgent = artifacts.require("EstateAgent");
const RentalAgent = artifacts.require("RentalAgent");

//Testing DecentramallToken.sol
contract("DecentramallToken", function (accounts) {
    const admin = accounts[0];
    const agent = accounts[1];
    const purchaser = accounts[2];
    const renter = accounts[3];
    const hacker = accounts[4];
    const legit = accounts[5];

    //Before each unit test  
    beforeEach(async function () {
        this.decentramallTokenInstance = await DecentramallToken.new(agent);
    });

    it("Testing mint() function", async function () {
        //store token id returned by function
        const token = await this.decentramallTokenInstance.mint.call(purchaser, { from: agent });
        //mint
        await this.decentramallTokenInstance.mint(purchaser, { from: agent });

        //Verify totalSupply equal to 1
        let totalSupply = await this.decentramallTokenInstance.totalSupply();
        expect(totalSupply).to.be.bignumber.equal(new BN(1));

        //Verifying modifier is effective
        await expectRevert(this.decentramallTokenInstance.mint(hacker, { from: hacker }), "Not an agent!");

        //Verifying
        const legitimacy = await this.decentramallTokenInstance.verifyLegitimacy.call(purchaser, token);
        expect(legitimacy).to.be.equal(true);
    });

    it("Testing burn() function", async function () {
        //store token id returned by function
        const token = await this.decentramallTokenInstance.mint.call(purchaser, { from: agent });
        //mint
        await this.decentramallTokenInstance.mint(purchaser, { from: agent });
        //burn
        await this.decentramallTokenInstance.burn(token, { from: agent });

        //Verify totalSupply equal to 0
        let totalSupply = await this.decentramallTokenInstance.totalSupply();
        expect(totalSupply).to.be.bignumber.equal(new BN(0));
    });

    it("Testing verifyLegitimacy() function", async function () {
        //store token id returned by function
        const token = await this.decentramallTokenInstance.mint.call(legit, { from: agent });

        //mint
        await this.decentramallTokenInstance.mint(legit, { from: agent });

        //Verifying legitimacy
        const legitimacy = await this.decentramallTokenInstance.verifyLegitimacy.call(legit, token);
        expect(legitimacy).to.be.equal(true);
    });
});

//Testing EstateAgent.sol
contract("EstateAgent", function (accounts) {
    const admin = accounts[0];
    const agent = accounts[1];
    const purchaser = accounts[2];
    const renter = accounts[3];
    const hacker = accounts[4];

    //Before each unit test  
    beforeEach(async function () {
        this.estateAgentTokenInstance = await EstateAgent.new(10, 1);
    });

    it("Verify Admin", async function () {
        expect(await this.estateAgentTokenInstance.verifyAdmin.call(admin, { from: admin })).to.be.equal(true);
    });

    it("Testing buy() function", async function () {
        await this.estateAgentTokenInstance.buy({ from: agent, to: this.estateAgentTokenInstance.address, value: "2000000000000000000" })
        let estateAgentBalance = await web3.eth.getBalance(this.estateAgentTokenInstance.address);
        expect(estateAgentBalance).to.be.bignumber.equal((new BN('2000000000000000000')))
    });

    it("Testing sell() function", async function () {
        let tokenId = new BN("70359603190535945057867763346504887029712970002228617020990113934931004039163"); //Already checked previously
        await this.estateAgentTokenInstance.buy({ from: purchaser, to: this.estateAgentTokenInstance.address, value: "1000000000000000000" })

        await this.estateAgentTokenInstance.sell(tokenId, { from: purchaser })
        let estateAgentBalance = await web3.eth.getBalance(this.estateAgentTokenInstance.address);
        expect(estateAgentBalance).to.be.bignumber.equal((new BN('998000000000000000')))
    });

    it("Testing withdraw() function", async function () {
        //transfering 2 ETH
        await this.estateAgentTokenInstance.buy({ from: admin, to: this.estateAgentTokenInstance.address, value: "2000000000000000000" })

        //check balance
        let estateAgentBalanceBefore = await this.estateAgentTokenInstance.balance.call({ from: admin });
        //withdraw 1 ETH
        await this.estateAgentTokenInstance.withdraw(admin, "1000000000000000000", { from: admin });

        //recheck balance
        let estateAgentBalanceAfter = await web3.eth.getBalance(this.estateAgentTokenInstance.address);
        //assertion        
        expect(estateAgentBalanceAfter).to.be.bignumber.equal((new BN('1000000000000000000')))
    });
});


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
        await this.rentalAgentTokenInstance.deposit(tokenId, { from: purchaser })
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
        ;
    });
    it("Purchaser claim rental", async function () {
        let balanceBefore = await web3.eth.getBalance(purchaser.address);
        //Claim
        await this.rentalAgentTokenInstance.claimRent(purchaser, tokenId, { from: purchaser })
        let balanceAfter = await web3.eth.getBalance(purchaser.address);
        expect(balanceBefore).to.be.equal(balanceAfter.sub(new BN("2000000000000000000")));
        ;
    });
});