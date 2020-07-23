const { BN, ether, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const Administration = artifacts.require("AdministrationMock");


//Testing Administration.sol
contract("Administration", function (accounts) {
    const admin = accounts[0];
    const newAdmin = accounts[1];
    const normalUser = accounts[2];
    const hacker = accounts[3];
    let administrationInstance;

    //Before each unit test  
    beforeEach(async function () {
        administrationInstance = await Administration.new({ from: admin });
    });

    it("Verify Admin", async function () {
        expect(await administrationInstance.verifyAdmin(admin, { from: admin })).to.be.equal(true);
    });

    it("newAdmin not admin yet", async function () {
        expect(await administrationInstance.verifyAdmin(newAdmin, { from: admin })).to.be.equal(false);
    });

    it("newAdmin is now admin", async function () {
        await administrationInstance.addAdmin(newAdmin, { from: admin });
        expect(await administrationInstance.verifyAdmin(newAdmin, { from: admin })).to.be.equal(true);
    });

    it("Remove newAdmin", async function () {
        await administrationInstance.removeAdmin(newAdmin, { from: admin });
        expect(await administrationInstance.verifyAdmin(newAdmin, { from: admin })).to.be.equal(false);
    });

    it("Hacker fail to add admin", async function () {
        await expectRevert(administrationInstance.addAdmin(normalUser, { from: hacker }), 'Not an admin!',);
    });
});