const Administration = artifacts.require("Administration");
const DecentramallToken = artifacts.require("DecentramallToken");
const EstateAgent = artifacts.require("EstateAgent");
const RentalAgent = artifacts.require("RentalAgent");
var fs = require('fs');

module.exports = function (deployer, network, accounts) {
  if (network !== 'test' && network !== 'coverage') {
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
      await this.estateAgent.setToken(this.token.address, { from: accounts[0] });

      //Use both the address in RentalAgent contract
      await deployer.deploy(RentalAgent, this.token.address, this.estateAgent.address);
//       this.rentalAgent = await RentalAgent.deployed();

//       let data = `NEXT_PUBLIC_CONTRACT_DECENTRAMALL_TOKEN=${this.token.address}
// NEXT_PUBLIC_CONTRACT_ESTATE_AGENT=${this.estateAgent.address}
// NEXT_PUBLIC_CONTRACT_RENTAL_AGENT=${this.rentalAgent.address}
// NEXT_PUBLIC_JSON_RPC=http://127.0.0.1:8545` 
      
//       if(this.rentalAgent !== null){
//         fs.appendFileSync('../webui/.env.local', data, function (err) {
//           if (err) throw err;
//           console.log('READY!');
//         });
//       }
    });
  }
};