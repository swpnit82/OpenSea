

require('dotenv').config()

const HDWalletProvider = require('@truffle/hdwallet-provider');

const mnemonic = process.env.MNEMONIC
const clientURL = process.env.ETH_CLIENT_URL

module.exports = {


  networks: {

    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 7545,            // Standard Ethereum port (default: none)
     network_id: "*",       // Any network (default: none)
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, clientURL),
      network_id: 4,       // Rinkeby's id
      gas: 3000000,
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true  ,   // Skip dry run before migrations? (default: false for public nets )
      networkCheckTimeout: 10000000,
    },
    matic: {
      provider: () => new HDWalletProvider(mnemonic, `https://rpc-mainnet.maticvigil.com`),
      network_id: 137,
      // websockets: true,
      confirmations: 2,
      networkCheckTimeout: 10000000,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  maticT: {
    provider: () => new HDWalletProvider(mnemonic, 'https://rpc-mumbai.maticvigil.com'),
    network_id: 80001,
    gas: 3000000,
    // websockets: true,
    confirmations: 2,
    networkCheckTimeout: 10000000,
    timeoutBlocks: 200,
    skipDryRun: true
  }
},

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.7",    // Fetch exact version from solc-bin (default: truffle's version)

    }
  },
  
};
