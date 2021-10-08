# NFT Demo

### Usage:
1. run npm install.  
2. Install any dependencies which might not be taken care by npm

3. Put image file that you want to convert into an NFT under assets folder.

7. Update Rinkeby test network details in `truffle-config.js` .  
   Update your account mnemonic in `.env` file.  
   Now run `truffle console --network rinkeby` to connect to Rinkeby Public test network.  
   Run `migrate` command to deploy the contract on Rinkeby testnet.  
   Run `let art = await ArtCollectible.deployed()`.    
   Run `await art.claimItem('https://ipfs.io/ipfs/QmREBUVuoeX39eB9KiQjp25RFr2dhYF6zawpYXq1UPJXEz')`   
   Pass the correct metadata file IPFS address to claimItem.  
   Run `art.address` to get contract address.  

8. Checkout your NFT on 
  `https://testnets.opensea.io/assets/contract_address/tokenId`.   
   You can also verify your metadata using on https://rinkeby-api.opensea.io/asset/contract_address/tokenId/validate     
   eg: https://rinkeby-api.opensea.io/asset/0x1e9930Bc5f39dE0515BeC52612bc4510F7B236C0/1/validate
  

   Party!!🥳🥳



## Usage
# for to mint NFTs from localhost application
/scripts/index.html

- Passs ABI and contract address which you get after deployining to any network : 
        const ABI = [];        
        const ADDRESS = "";
   in code.

➜  nft-demo git:(master) ✗ python -m SimpleHTTPServer
Serving HTTP on 0.0.0.0 port 8000 ...
127.0.0.1 - - [07/Oct/2021 09:17:39] "GET /scripts/ HTTP/1.1" 200 -
127.0.0.1 - - [07/Oct/2021 09:17:46] "GET /scripts/ HTTP/1.1" 200 -
127.0.0.1 - - [07/Oct/2021 09:18:00] "GET /scripts/ HTTP/1.1" 200 -

Go to : localhost/scripts and mint as much NFTs you wish
