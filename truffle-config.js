/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */
require('ts-node/register');
const fs = require('fs');
const HDWalletProvider = require('@truffle/hdwallet-provider');

let infuraKey;
let mnemonic;
try {
  infuraKey = fs.readFileSync('.infura_key').toString().trim();
  mnemonic = fs.readFileSync('.secret').toString().trim();
} catch(e) {}

module.exports = {
  test_file_extension_regexp: /.*\.ts$/,
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache-cli, geth or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
    development: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: '1337', // Any network (default: none)
    },

    test: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: '*', // Any network (default: none)
    },

    // this is necessary for coverage
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },

    // Useful for deploying to a public network.
    // NB: It's important to wrap the provider as a function.

    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${infuraKey}`),
      network_id: 3, // ropsten's id
      networkCheckTimeout: 10000000,
      gas: 8000000,
      gasPrice: 10000000000,
    },

    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraKey}`),
      network_id: 4, // rinkeby's id
      networkCheckTimeout: 10000000,
      gas: 10000000,
      gasPrice: 5000000000,
    },

    goerli: {
      provider: () => new HDWalletProvider(mnemonic, `https://goerli.infura.io/v3/${infuraKey}`),
      network_id: 5, // goerli's id
      networkCheckTimeout: 10000000,
      gas: 4712388,
      gasPrice: 2000000000,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: 3000000,
    reporter: 'eth-gas-reporter',
  },

  plugins: ['solidity-coverage'],

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.6.8', // Fetch exact version from solc-bin (default: truffle's version)
    },
  },
};
