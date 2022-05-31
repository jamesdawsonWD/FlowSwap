import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-solhint";
import chai from "chai";
import { solidity } from "ethereum-waffle";

chai.use(solidity);

export default {
  solidity: "0.8.13",
  networks: {
    hardhat: {
      chainId: 31337
    }
  }
};
