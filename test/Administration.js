const { BN, ether, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const Administration = artifacts.require("Administration");
const DecentramallToken = artifacts.require("DecentramallToken");
const EstateAgent = artifacts.require("EstateAgent");
const RentalAgent = artifacts.require("RentalAgent");


//Testing Administration.sol
contract("Administration", function (accounts) {
    const admin = accounts[0];
    const newAdmin = accounts[1];
    const normalUser = accounts[2];
    const hacker = accounts[3];

    //Before each unit test  
    beforeEach(async function () {
        this.administrationInstance = await EstateAgent.deployed();
    });

    it("Verify Admin", async function () {
        expect(await this.administrationInstance.verifyAdmin.call(admin, { from: admin })).to.be.equal(true);
    });

    it("newAdmin not admin yet", async function () {
        expect(await this.administrationInstance.verifyAdmin.call(newAdmin, { from: admin })).to.be.equal(false);
    });

    it("newAdmin is now admin", async function () {
        await this.administrationInstance.addAdmin(newAdmin, { from: admin });
        expect(await this.administrationInstance.verifyAdmin.call(newAdmin, { from: admin })).to.be.equal(true);
    });

    it("Remove newAdmin", async function () {
        await this.administrationInstance.removeAdmin(newAdmin, { from: admin });
        expect(await this.administrationInstance.verifyAdmin.call(newAdmin, { from: admin })).to.be.equal(false);
    });

    it("Hacker fail to add admin", async function () {
        await expectRevert(this.administrationInstance.addAdmin(normalUser, { from: hacker }), 'Not an admin!',);
    });
});