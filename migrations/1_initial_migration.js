const Administration = artifacts.require("Administration");
const DecentramallToken = artifacts.require("DecentramallToken");
const EstateAgent = artifacts.require("EstateAgent");
const RentalAgent = artifacts.require("RentalAgent");

module.exports = function (deployer, network, accounts) {
  if (network !== 'development' && network !== 'coverage') {
    let admin = accounts[0];
    deployer.then(async () => {
      //Always deploy EstateAgent first
      await deployer.deploy(EstateAgent, 1200, 1);

      //Wait till deployed
      this.estateAgent = await EstateAgent.deployed();

      //Deploy token with estate agent as the agent
      await deployer.deploy(DecentramallToken, this.estateAgent.address);
      this.token = await DecentramallToken.deployed();

      //Set token address to estateAgent
      await this.estateAgent.setToken(this.token.address, { from: '0x7371F37B1eCEC1e859285d31DAeE4380F20A412E' });

      //Use both the address in RentalAgent contract
      await deployer.deploy(RentalAgent, this.token.address, this.estateAgent.address);
    });
  }
};