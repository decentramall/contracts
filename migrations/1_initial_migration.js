const Decentramall = artifacts.require("Decentramall");
const DAI = artifacts.require("test/DAI");

/** The migration deploys the DAI contract which gives 500 DAI to each user 
 * then deploys Decentramall with the given DAI contract address */

module.exports = function (deployer, network, accounts) {
    if (network !== 'test' && network !== 'coverage') {
        deployer.deploy(DAI, accounts).then(async () => {
            await deployer.deploy(Decentramall, 1200, 1, DAI.address);
        });
    }
};