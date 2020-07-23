const Administration = artifacts.require("Administration");
const DecentramallToken = artifacts.require("DecentramallToken");
const EstateAgent = artifacts.require("EstateAgent");
const RentalAgent = artifacts.require("RentalAgent");
const agent = '0xfe54a4bf10e879fc18b0facc4c8c3c72f9e082c5'; //ONE OF YOUR LOCAL BLOCKCHAIN ADDRESS

module.exports = function (deployer, network, accounts) {
  if (network !== 'development' && network !== 'coverage') {
    let admin = accounts[0];
    deployer.then(async () => {
      //Always deploy EstateAgent first
      await deployer.deploy(EstateAgent, 100, 1);

      //Wait till deployed
      this.estateAgent = await EstateAgent.deployed();

      //Get the address of the deployed token contract within EstateAgent
      let tokenAddress = await this.estateAgent.token.call({ from: admin });
      this.token = await DecentramallToken.at(tokenAddress);

      //Use both the address in RentalAgent contract
      await deployer.deploy(RentalAgent, this.token.address, EstateAgent.address);
    });
  }
};