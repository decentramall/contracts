const { BN, ether, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const EstateAgent = artifacts.require("EstateAgent");


//Testing EstateAgent.sol
contract("EstateAgent", function (accounts) {
    const admin = accounts[0];
    const agent = accounts[1];
    const purchaser = accounts[2];
    const renter = accounts[3];
    const hacker = accounts[4];
    let estateAgentTokenInstance;

    //Before each unit test  
    beforeEach(async function () {
        estateAgentTokenInstance = await EstateAgent.new(10, 1);
    });

    it("Verify Admin", async function () {
        expect(await estateAgentTokenInstance.verifyAdmin(admin, { from: admin })).to.be.equal(true);
    });

    it("Testing buy() function", async function () {
        await estateAgentTokenInstance.buy({ from: agent, to: estateAgentTokenInstance.address, value: ether('2') })
        let estateAgentBalance = await web3.eth.getBalance(estateAgentTokenInstance.address);
        expect(estateAgentBalance).to.be.bignumber.equal(ether('2'))
    });

    it("Testing sell() function", async function () {
        const tx = await estateAgentTokenInstance.buy({ from: purchaser, to: estateAgentTokenInstance.address, value: ether('1') })
        // get tokenid from BuyToken event
        const tokenId = tx.logs[0].args[2].toString();

        await estateAgentTokenInstance.sell(tokenId, { from: purchaser })
        let estateAgentBalance = await web3.eth.getBalance(estateAgentTokenInstance.address);
        expect(estateAgentBalance).to.be.bignumber.equal(ether('0.998'))
    });

    it("Testing withdraw() function", async function () {
        //transfering 2 ETH
        await estateAgentTokenInstance.buy({ from: admin, to: estateAgentTokenInstance.address, value: ether('2') })

        //check balance
        let estateAgentBalanceBefore = await estateAgentTokenInstance.balance({ from: admin });
        //withdraw 1 ETH
        await estateAgentTokenInstance.withdraw(admin, ether('1'), { from: admin });

        //recheck balance
        let estateAgentBalanceAfter = await web3.eth.getBalance(estateAgentTokenInstance.address);
        //assertion        
        expect(estateAgentBalanceAfter).to.be.bignumber.equal(ether('1'))
    });
});