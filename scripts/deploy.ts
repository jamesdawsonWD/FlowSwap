import '@nomiclabs/hardhat-ethers';
import {} from '@nomiclabs/hardhat-ethers/types';
import { ethers, network, artifacts } from 'hardhat';
import fs from 'fs';
async function main() {
    if (network.name === 'hardhat') {
        console.warn(
            'You are trying to deploy a contract to the Hardhat Network, which' +
                'gets automatically created and destroyed every time. Use the Hardhat' +
                " option '--network localhost'"
        );
    }

    const SUPERFLUID_HOST = '0xEB796bdb90fFA0f28255275e16936D25d3418603';

    const [deployer] = await ethers.getSigners();
    console.log(
        'Deploying the contracts with the account:',
        await deployer.getAddress()
    );
    console.log('Account balance:', (await deployer.getBalance()).toString());
    const FixedPointLib = await ethers.getContractFactory('FixedPoint');
    const fixedPointLib = await FixedPointLib.deploy();
    const SwirlFactory = await ethers.getContractFactory('SwirlFactory');
    const SwirlPool = await ethers.getContractFactory('SwirlPool', {
        libraries: {
            FixedPoint: fixedPointLib.address,
        },
    });
    const SwirlTokenProxy = await ethers.getContractFactory('SwirlPoolToken');
    const SwirlPoolERC20Proxy = await ethers.getContractFactory(
        'SwirlPoolERC20'
    );

    const swirlFactory = await SwirlFactory.deploy();
    await swirlFactory.deployed();

    const swirlPoolERC20 = await SwirlPoolERC20Proxy.deploy();
    await swirlPoolERC20.deployed();

    const swirlPool = await SwirlPool.deploy();
    await swirlPool.deployed();

    const swirlTokenProxy = await SwirlTokenProxy.deploy();
    await swirlTokenProxy.deployed();

    await swirlFactory.initialize(
        SUPERFLUID_HOST,
        swirlPoolERC20.address,
        swirlPool.address,
        swirlTokenProxy.address
    );

    saveFrontendFiles([
        { name: 'SwirlPool', address: swirlPool.address },
        { name: 'SwirlFactory', address: swirlFactory.address },
        { name: 'SwirlPoolERC20', address: swirlPoolERC20.address },
        { name: 'SwirlPoolToken', address: swirlTokenProxy.address },
    ]);
}

function saveFrontendFiles(addresses: { name: string; address: string }[]) {
    const contractsDir = __dirname + '/../app/src/contracts';

    if (!fs.existsSync(contractsDir)) fs.mkdirSync(contractsDir);

    const sortedAddresses = addresses.reduce(
        (obj, item) => Object.assign(obj, { [item.name]: item.address }),
        {}
    );
    fs.writeFileSync(
        contractsDir + '/contract-address.json',
        JSON.stringify(sortedAddresses, undefined, 2)
    );

    for (const address of addresses) {
        const artifact = artifacts.readArtifactSync(address.name);

        fs.writeFileSync(
            contractsDir + `/${address.name}.json`,
            JSON.stringify(artifact, null, 2)
        );
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
