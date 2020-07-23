const Administration = artifacts.require("Administration");
const DecentramallToken = artifacts.require("DecentramallToken");
const EstateAgent = artifacts.require("EstateAgent");
const RentalAgent = artifacts.require("RentalAgent");
const agent = '0xfe54a4bf10e879fc18b0facc4c8c3c72f9e082c5'; //ONE OF YOUR LOCAL BLOCKCHAIN ADDRESS

module.exports = function (deployer) {
  deployer.then(async () => {
    await deployer.deploy(DecentramallToken, agent);
    await deployer.deploy(EstateAgent, 100, 1);
    await deployer.deploy(RentalAgent, DecentramallToken.address, EstateAgent.address);
  });
};