const Decentramall = artifacts.require("Decentramall");

module.exports = function (deployer, network) {
    if (network !== 'test' && network !== 'coverage') {
        deployer.then(async () => {
            await deployer.deploy(Decentramall, 1200, 1);
        });
    }
};