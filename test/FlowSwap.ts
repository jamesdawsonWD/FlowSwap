import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import {
    getEvent,
    retrieveEventParam,
    sortAddresses,
    addressZero,
} from './helpers';
import { BigNumber } from 'ethers';
import {
    ConstantFlowAgreementV1,
    Framework,
    SuperToken,
} from '@superfluid-finance/sdk-core';
import {
    SuperTokenMock,
    SuperfluidMock,
    FlowFactory,
    FlowSwapToken,
    FlowSwap,
} from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

// Superfluid deploying helpers
/* eslint @typescript-eslint/no-var-requires: "off" */
const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');
const { web3 } = require('hardhat');

const provider = web3.provider;
describe('FlowSwap Contract', () => {
    let superfluid: SuperfluidMock;
    let superTokenMock0: SuperTokenMock;
    let superTokenMock1: SuperTokenMock;
    let flowFactory: FlowFactory;
    let flowSwap: FlowSwap;
    let flowswapToken0: FlowSwapToken;
    let flowswapToken1: FlowSwapToken;
    let flowTokenProxy: FlowSwapToken;
    let addrs: SignerWithAddress[];
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let pair1: FlowSwap;
    let superToken0: string;
    let superToken1: string;
    let sf: Framework;
    let cfa: ConstantFlowAgreementV1;
    const errorHandler = (err: Error) => {
        if (err) throw err;
    };

    before(async () => {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        await deployFramework(errorHandler, {
            web3,
            from: owner.address,
        });
        const ethersProvider = owner.provider as any;
        console.log(provider);
        sf = await Framework.create({
            networkName: 'custom',
            provider: ethersProvider,
            dataMode: 'WEB3_ONLY',
            resolverAddress: process.env.RESOLVER_ADDRESS, //this is how you get the resolver address
            protocolReleaseVersion: 'test',
        });

        cfa = sf.cfaV1;

        const FlowFactory = await ethers.getContractFactory('FlowFactory');
        const FlowSwap = await ethers.getContractFactory('FlowSwap');
        const FlowTokenProxy = await ethers.getContractFactory('FlowSwapToken');

        flowTokenProxy = await FlowTokenProxy.deploy();
        await flowTokenProxy.deployed();

        flowSwap = await FlowSwap.deploy(
            cfa.contract.address
        );
        await flowSwap.deployed();

        flowFactory = await FlowFactory.deploy(flowSwap.address,
            flowTokenProxy.address);
        await flowFactory.deployed();

        // //deploy a fake erc20 token
        const token0 = await deployTestToken(errorHandler, [':', 'fDAI'], {
            web3,
            from: owner.address,
        });
        // //deploy a fake erc20 wrapper super token around the fDAI token
        superToken0 = await deploySuperToken(errorHandler, [':', 'fDAI'], {
            web3,
            from: owner.address,
        });
        //deploy a fake erc20 token
        const token1 = await deployTestToken(errorHandler, [':', 'fWETH'], {
            web3,
            from: owner.address,
        });
        //deploy a fake erc20 wrapper super token around the fDAI token
        superToken1 = await deploySuperToken(errorHandler, [':', 'fWETH'], {
            web3,
            from: owner.address,
        });

        console.log(
            superToken0,
            ' #################################################################'
        );
        const tx = await flowFactory.createPair(superToken0, superToken1);
        const receipt = await tx.wait();
        console.log(receipt.events);

        const pair = await retrieveEventParam(tx, 'PairCreated', 'pair');

        pair1 = FlowSwap.attach(pair);
    });

    describe('Deployment', () => {
        it('FlowFactory: Should set correct flowSwapProxy address', async () => {
            expect(await flowFactory.flowSwapAddress()).to.equal(
                flowSwap.address
            );
        });
        it('FlowSwap(Proxy): Should be deployed and contain correct CFA', async () => {
            expect(await flowSwap.cfa()).to.equal(cfa.contract.address);
        });
        it('FlowSwap(Proxy): Should be deployed and contain correct FlowTokenProxy', async () => {
            expect(await flowSwap.flowTokenProxy()).to.equal(
                flowTokenProxy.address
            );
        });
        it('FlowSwap(Pair): Should be deployed and have correct underlying tokens set', async () => {
            const [token0, token1] = sortAddresses(superToken0, superToken1);
            expect(await pair1.token0()).to.equal(token0);
            expect(await pair1.token1()).to.equal(token1);
        });
        it('FlowSwap(Pair): Should be deployed and have correct underlying tokens set', async () => {
            const [token0, token1] = sortAddresses(superToken0, superToken1);
            expect(await pair1.token0()).to.equal(token0);
            expect(await pair1.token1()).to.equal(token1);
        });
        it('FlowSwap(Pair): Should of created two FlowSwapTokens with correct underlying supertokens', async () => {
            const [token0, token1] = sortAddresses(superToken0, superToken1);

            const _flowSwapToken0 = await pair1.flowToken0();
            const _flowSwapToken1 = await pair1.flowToken1();

            expect(_flowSwapToken0).to.not.equal(addressZero);
            expect(_flowSwapToken1).to.not.equal(addressZero);

            console.log(_flowSwapToken0, _flowSwapToken1);

            const FlowTokenProxy = await ethers.getContractFactory(
                'FlowSwapToken'
            );

            const flowSwapToken0 = await FlowTokenProxy.attach(_flowSwapToken0);
            const flowSwapToken1 = await FlowTokenProxy.attach(_flowSwapToken1);

            const host0 = await flowSwapToken0.getHost();
            const host1 = await flowSwapToken1.getHost();

            expect(host0).to.equal(flowSwap.address);
            expect(host1).to.equal(flowSwap.address);
        });
    });

    // describe('Gallery', () => {
    //     // it('Should Donate an NFT', async () => {
    //     //     const totalDonationsBefore = await gallery1.totalNftDonations();
    //     //     await testNft.connect(addr1).approve(gallery1.address, 6);
    //     //     const tx = await gallery1
    //     //         .connect(addr1)
    //     //         .donate(testNft.address, 6, ethers.utils.parseEther('25'));
    //     //     const receipt = await tx.wait();
    //     //     const event = getEvent(receipt, 'Donated');
    //     //     const donationId = event[0].args['donationID'];
    //     //     const donation = await gallery1.donations(donationId);
    //     //     const totalDonationsAfter = await gallery1.totalNftDonations();
    //     //     expect(totalDonationsBefore.toNumber() + 1).to.equal(
    //     //         totalDonationsAfter
    //     //     );
    //     //     expect(await testNft.ownerOf(6)).to.equal(await gallery1.address);
    //     //     expect(donation['price']).to.equal(ethers.utils.parseEther('25'));
    //     //     expect(donation['donator']).to.equal(addr1.address);
    //     //     expect(donation['tokenId']).to.equal(6);
    //     //     expect(donation['collection']).to.equal(testNft.address);
    //     //     expect(donation['sold']).to.equal(false);
    //     // });
    //     // it('Should buy a donated NFT', async () => {
    //     //     const totalDonationsBefore = await gallery1.totalDonations();
    //     //     await testNft.connect(addr1).approve(gallery1.address, 6);
    //     //     const tx = await gallery1
    //     //         .connect(addr1)
    //     //         .donate(testNft.address, 6, ethers.utils.parseEther('25'));
    //     //     await gallery1
    //     //         .connect(addr2)
    //     //         .buy(1, { value: ethers.utils.parseEther('25') });
    //     //     const totalDonationsAfter = await gallery1.totalDonations();
    //     //     expect(await testNft.ownerOf(6)).to.equal(addr2.address);
    //     //     expect(ethers.utils.parseEther('25')).to.equal(totalDonationsAfter);
    //     // });
    //     // it('Should allow guardian to withdraw', async () => {
    //     //     await testNft.connect(addr1).approve(gallery1.address, 6);
    //     //     await gallery1
    //     //         .connect(addr1)
    //     //         .donate(testNft.address, 6, ethers.utils.parseEther('25'));
    //     //     await gallery1.connect(
    //     //         addr2.buy(1, { value: ethers.utils.parseEther('25') })
    //     //     );
    //     //     const balanceBefore = await provider.getBalance(owner.address);
    //     //     const tx = await gallery1.withdraw();
    //     //     const receipt = await tx.wait();
    //     //     const balanceAfter = await provider.getBalance(owner.address);
    //     // });
    // });
});
