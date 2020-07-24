const { BN, ether, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const DecentramallToken = artifacts.require("DecentramallToken");
const EstateAgent = artifacts.require("EstateAgent");
const RentalAgent = artifacts.require("RentalAgent");


//Testing RentalAgent.sol
contract("RentalAgent", function (accounts) {
    const admin = accounts[0];
    const agent = accounts[1];
    const purchaser = accounts[2];
    const renter = accounts[3];
    const user = accounts[4];
    const newPurchaser = accounts[5];
    // let tokenId = new BN("70359603190535945057867763346504887029712970002228617020990113934931004039163"); //Already checked previously
    let estateAgent;
    let decentramallToken;
    let rentalAgentTokenInstance;
    //Before each unit test  
    beforeEach(async function () {
        estateAgent = await EstateAgent.new(10, 1);
        decentramallToken = await DecentramallToken.at(
            await estateAgent.token({ from: admin })
        );
        rentalAgentTokenInstance = await RentalAgent.new(decentramallToken.address, estateAgent.address);
    });

    it("Verify Admin", async function () {
        expect(await rentalAgentTokenInstance.verifyAdmin(admin, { from: admin })).to.be.equal(true);
    });
    it("Testing deposit() function", async function () {
        //First, buy the token
        const tx = await estateAgent.buy({ from: purchaser, to: estateAgent.address, value: ether('2') })
        const tokenId = tx.logs[0].args[2].toString();

        //Approve the transfer
        await decentramallToken.approve(rentalAgentTokenInstance.address, tokenId, { from: purchaser });

        //Now deposit
        await rentalAgentTokenInstance.deposit(tokenId, { from: purchaser });
        expect(await rentalAgentTokenInstance.checkDelegatedOwner(tokenId, { from: purchaser })).to.be.equal(purchaser);
    });
    it("Testing withdrawSpace() function", async function () {
        // let newTokenId = new BN("15105111975255290057694733458188974452746103912949142486594252717011018707060");

        //First, buy the token
        const tx = await estateAgent.buy({ from: newPurchaser, to: estateAgent.address, value: ether('2') })
        const tokenId = tx.logs[0].args[2].toString();
        let ownerBefore = await decentramallToken.ownerOf(tokenId, { from: newPurchaser });

        //Approve the transfer        
        await decentramallToken.approve(rentalAgentTokenInstance.address, tokenId, { from: newPurchaser });

        //Now deposit
        await rentalAgentTokenInstance.deposit(tokenId, { from: newPurchaser });

        //Withdraw
        await rentalAgentTokenInstance.withdrawSpace(tokenId, { from: newPurchaser });
        let ownerAfter = await decentramallToken.ownerOf(tokenId, { from: newPurchaser });

        expect(ownerBefore).to.be.equal(ownerAfter);
    });
    it("Renter make rental", async function () {
        const tx = await estateAgent.buy({ from: newPurchaser, to: estateAgent.address, value: ether('2') })
        const tokenId = tx.logs[0].args[2].toString();
        //Rent
        await rentalAgentTokenInstance.rent(tokenId, { from: renter, value: ether('2') })

        expect(await rentalAgentTokenInstance.checkDelegatedOwner(tokenId, { from: renter })).to.be.equal(renter);
    });
    it("newPurchaser claim rental", async function () {
        const tx1 = await estateAgent.buy({ from: newPurchaser, to: estateAgent.address, value: ether('2') })
        const tokenId = tx1.logs[0].args[2].toString();

        //Approve the transfer        
        await decentramallToken.approve(rentalAgentTokenInstance.address, tokenId, { from: newPurchaser });

        //Deposit again
        await rentalAgentTokenInstance.deposit(tokenId, { from: newPurchaser });

        //Rent
        const rentTx = await rentalAgentTokenInstance.rent(tokenId, { from: renter, value: ether('2') });
        const rentEarned = parseInt(rentTx.logs[0].args[2].toString());

        let oldBalance = await web3.eth.getBalance(newPurchaser);

        //Claim
        const txInfo = await rentalAgentTokenInstance.claimRent(newPurchaser, tokenId, { from: newPurchaser });
        let newBalance = await web3.eth.getBalance(newPurchaser);

        //Calculate tx cost
        const tx = await web3.eth.getTransaction(txInfo.tx);
        const gasCost = tx.gasPrice * txInfo.receipt.gasUsed;

        const expectedFinalBalance = oldBalance - gasCost + rentEarned;
        const shouldZeroOrMore = newBalance - expectedFinalBalance;

        // console.log("Either zero or more: " + shouldZeroOrMore);
        expect(shouldZeroOrMore >= 0).to.be.equal(true);
    });
    it("Set new token contract", async function () {
        const newToken = await DecentramallToken.new(agent);

        await rentalAgentTokenInstance.setToken(newToken.address, { from: admin });
        expect(await rentalAgentTokenInstance.token.call({ from: admin })).to.be.equal(newToken.address);
    });
    it("Set new EstateAgent contract", async function () {
        const newEstateAgent = await EstateAgent.new(100, 5);

        await rentalAgentTokenInstance.setAgent(newEstateAgent.address, { from: admin });
        expect(await rentalAgentTokenInstance.estateAgent.call({ from: admin })).to.be.equal(newEstateAgent.address);
    });
    it("Check owner of token not in RentalAgent.sol", async function () {
        const tx1 = await estateAgent.buy({ from: user, to: estateAgent.address, value: ether('2') })
        const tokenId = tx1.logs[0].args[2].toString();
        expect(await rentalAgentTokenInstance.checkDelegatedOwner.call(tokenId, { from: admin })).to.be.equal(user);
    });
});