const { BN, ether, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const Administration = artifacts.require("Administration");
const DecentramallToken = artifacts.require("DecentramallToken");
const EstateAgent = artifacts.require("EstateAgent");
const RentalAgent = artifacts.require("RentalAgent");


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