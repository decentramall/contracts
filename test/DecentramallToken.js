const { BN, ether, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const DecentramallToken = artifacts.require("DecentramallToken");

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