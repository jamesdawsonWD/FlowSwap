import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-truffle5';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-solhint';
import '@nomiclabs/hardhat-web3';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
chai.use(solidity);
import 'dotenv/config';

module.exports = {
    defaultNetwork: 'matic',
    networks: {
        hardhat: {
            chainId: 31337,
        },
        matic: {
            url: 'https://rpc-mumbai.maticvigil.com',
            accounts: [process.env.PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: process.env.POLYGONSCAN_API_KEY,
    },
    solidity: {
        version: '0.8.13',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    // solidity: '0.8.13',
    // networks: {
    //     hardhat: {
    //         chainId: 31337,
    //     },
    // },
};
