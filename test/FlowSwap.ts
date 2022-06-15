import { expect } from 'chai';
import BN from 'bn.js';
import { ethers, waffle } from 'hardhat';
import {
    retrieveEventParam,
    sortAddresses,
    addressZero,
    decodeEvents,
} from './helpers';
import { BigNumber, BytesLike, Contract, Signer } from 'ethers';
import {
    advanceBlock,
    advanceTime,
    advanceTimeAndBlock,
    revertToSnapshot,
    takeSnapshot,
} from './helpers/timetraveler';
import {
    ConstantFlowAgreementV1,
    Framework,
    WrapperSuperToken,
} from '@superfluid-finance/sdk-core';
import {
    FlowFactory,
    FlowSwapToken,
    FlowSwap,
    FlowSwapRouter,
    FlowSwapERC20,
} from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import ERC20MockJson from '../artifacts/contracts/test/ERC20Mock.sol/ERC20Mock.json';
import { addLiquidityManual } from './helpers/flowSwapRouter';
import { Result } from 'ethers/lib/utils';

// Superfluid deploying helpers
/* eslint @typescript-eslint/no-var-requires: "off" */
const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');
const { web3 } = require('hardhat');

const provider = web3.provider;
describe('FlowSwap Contract', () => {
    let flowFactory: FlowFactory;
    let flowSwap: FlowSwap;
    let flowSwapERC20: FlowSwapERC20;
    let flowSwapToken0: FlowSwapToken;
    let flowSwapToken1: FlowSwapToken;
    let flowTokenProxy: FlowSwapToken;
    let flowSwapRouter: FlowSwapRouter;
    let addrs: SignerWithAddress[];
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let pair1: FlowSwap;
    let mockToken0: Contract;
    let mockToken1: Contract;
    let superToken0: WrapperSuperToken;
    let superToken1: WrapperSuperToken;
    let sf: Framework;
    let cfa: ConstantFlowAgreementV1;
    let superSigner: Signer;
    let snapshotId: string | Error;
    const errorHandler = (err: Error) => {
        if (err) throw err;
    };

    before(async () => {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        await deployFramework(errorHandler, {
            web3,
            from: owner.address,
        });

        // Couldn't seem to get the correct typing here, quick fix :c
        const ethersProvider = owner.provider as any;

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
        const FlowSwapERC20Proxy = await ethers.getContractFactory(
            'FlowSwapERC20'
        );
        const FlowSwapRouter = await ethers.getContractFactory(
            'FlowSwapRouter'
        );

        flowSwapERC20 = await FlowSwapERC20Proxy.deploy();
        await flowSwapERC20.deployed();
        flowTokenProxy = await FlowTokenProxy.deploy();
        await flowTokenProxy.deployed();

        flowSwap = await FlowSwap.deploy();
        await flowSwap.deployed();

        flowFactory = await FlowFactory.deploy(
            sf.host.contract.address,
            flowSwapERC20.address,
            flowSwap.address,
            flowTokenProxy.address
        );
        await flowFactory.deployed();

        await deployTestToken(errorHandler, [':', 'fDAI'], {
            web3,
            from: owner.address,
        });
        await deploySuperToken(errorHandler, [':', 'fDAI'], {
            web3,
            from: owner.address,
        });
        await deployTestToken(errorHandler, [':', 'fWETH'], {
            web3,
            from: owner.address,
        });
        await deploySuperToken(errorHandler, [':', 'fWETH'], {
            web3,
            from: owner.address,
        });

        superSigner = await sf.createSigner({
            signer: owner,
            provider: provider,
        });

        superToken0 = await sf.loadWrapperSuperToken('fDAIx');
        superToken1 = await sf.loadWrapperSuperToken('fWETHx');

        const _underlying0 = superToken0.underlyingToken?.address as string;
        const _underlying1 = superToken1.underlyingToken?.address as string;

        mockToken0 = await new ethers.Contract(
            _underlying0,
            ERC20MockJson.abi,
            owner
        );
        mockToken1 = await new ethers.Contract(
            _underlying1,
            ERC20MockJson.abi,
            owner
        );

        const tx = await flowFactory.createPair(
            superToken0.address,
            superToken1.address
        );
        const pair = await retrieveEventParam(tx, 'PairCreated', 'pair');
        pair1 = FlowSwap.attach(pair);

        const _flowSwapToken0 = await pair1.flowToken0();
        const _flowSwapToken1 = await pair1.flowToken1();

        flowSwapToken0 = FlowTokenProxy.attach(_flowSwapToken0);
        flowSwapToken1 = FlowTokenProxy.attach(_flowSwapToken1);

        // Router
        flowSwapRouter = await FlowSwapRouter.deploy(
            flowFactory.address,
            mockToken1.address,
            sf.host.contract.address
        );
        await flowSwapRouter.deployed();

        // Providing Tokens for test
        await mockToken0
            .connect(owner)
            .mint(owner.address, ethers.utils.parseEther('1000'));

        await mockToken1
            .connect(owner)
            .mint(owner.address, ethers.utils.parseEther('1000'));

        await mockToken0
            .connect(owner)
            .approve(superToken0.address, ethers.utils.parseEther('1000'));

        await mockToken1
            .connect(owner)
            .approve(superToken1.address, ethers.utils.parseEther('1000'));

        const superToken0UpgradeOperation = superToken0.upgrade({
            amount: ethers.utils.parseEther('1000').toString(),
        });
        const superToken1UpgradeOperation = superToken1.upgrade({
            amount: ethers.utils.parseEther('1000').toString(),
        });

        await superToken0UpgradeOperation.exec(owner);
        await superToken1UpgradeOperation.exec(owner);
    });

    // Take base snapshot before each test
    beforeEach(async () => {
        snapshotId = await takeSnapshot();
    });

    // Revert to base snapshot after
    afterEach(async () => {
        expect(
            typeof snapshotId === 'string' || snapshotId instanceof String
        ).to.equal(true);
        await revertToSnapshot(snapshotId as string);
    });

    describe('Deployment', () => {
        it('FlowFactory: Should set correct flowSwapProxy address', async () => {
            expect(await flowFactory.flowSwapAddress()).to.equal(
                flowSwap.address
            );
        });
        it('FlowFactory: Should be deployed and contain correct FlowTokenProxy', async () => {
            expect(await flowFactory.flowTokenProxy()).to.equal(
                flowTokenProxy.address
            );
        });
        it('FlowSwap(Pair): Should be deployed and have correct underlying tokens set', async () => {
            const [token0, token1] = sortAddresses(
                superToken0.address,
                superToken1.address
            );
            expect(await pair1.token0()).to.equal(token0);
            expect(await pair1.token1()).to.equal(token1);
        });
        it('FlowSwap(Pair): Should be deployed and have correct underlying tokens set', async () => {
            const [token0, token1] = sortAddresses(
                superToken0.address,
                superToken1.address
            );
            expect(await pair1.token0()).to.equal(token0);
            expect(await pair1.token1()).to.equal(token1);
        });
        it('FlowSwap(Pair): Should be deployed and have a superrouter set', async () => {
            expect(await pair1.superRouter()).to.not.equal(addressZero);
        });
        it('FlowSwap(Pair): Should of created two FlowSwapTokens with correct underlying supertokens', async () => {
            expect(flowSwapToken0.address).to.not.equal(addressZero);
            expect(flowSwapToken1.address).to.not.equal(addressZero);

            const host0 = await flowSwapToken0.getHost();
            const host1 = await flowSwapToken1.getHost();

            expect(host0).to.equal(pair1.address);
            expect(host1).to.equal(pair1.address);
        });
        it('FlowSwapRouter: Should be deployed and have set correct state', async () => {
            const routerCfa = await flowSwapRouter.cfaV1();
            const swapCfa = await flowSwap.cfaV1();
            expect(routerCfa).to.not.equal(swapCfa);
        });
    });

    // describe('FlowSwapRouter', () => {
    //     it('Should provide liquidty and mint correct amount of LP tokens', async () => {
    //         const flowRate = '1000000';
    //         const amount0 = ethers.utils.parseEther('100').toString();
    //         const amount1 = ethers.utils.parseEther('200').toString();
    //         const { expectedLiquidty, acctualLiquidity } =
    //             await addLiquidityManual(
    //                 pair1,
    //                 superToken0,
    //                 superToken1,
    //                 amount0,
    //                 amount1,
    //                 owner
    //             );
    //         await sf.cfaV1
    //             .authorizeFlowOperatorWithFullControl({
    //                 flowOperator: ethers.utils.getAddress(
    //                     flowSwapRouter.address
    //                 ),
    //                 superToken: ethers.utils.getAddress(superToken0.address),
    //             })
    //             .exec(owner);

    //         const tx = await flowSwapRouter.createFlow(
    //             ethers.utils.getAddress(superToken0.address),
    //             flowRate,
    //             ethers.utils.getAddress(pair1.address)
    //         );
    //     });
    // });
    describe('FlowSwap', () => {
        it('Should provide liquidty and mint correct amount of LP tokens', async () => {
            const amount0 = ethers.utils.parseEther('100').toString();
            const amount1 = ethers.utils.parseEther('200').toString();

            const { expectedLiquidty, acctualLiquidity } =
                await addLiquidityManual(
                    pair1,
                    superToken0,
                    superToken1,
                    amount0,
                    amount1,
                    owner
                );
            // expect(acctualLiquidity.toString()).to.equal(
            //     expectedLiquidty.toString()
            // );
        });

        it('[CreateFlow]: Should trigger create flow when a flow is created to the superrouter', async () => {
            const flowRate = '1000000';
            const amount0 = ethers.utils.parseEther('100').toString();
            const amount1 = ethers.utils.parseEther('200').toString();
            await addLiquidityManual(
                pair1,
                superToken0,
                superToken1,
                amount0,
                amount1,
                owner
            );

            await sf.cfaV1
                .createFlow({
                    flowRate,
                    receiver: await pair1.superRouter(),
                    superToken: superToken0.address,
                })
                .exec(owner);

            // const receipt = await pair1.swapOf(owner.address);
            // const globalFlowRate0 = await pair1.token0GlobalFlowRate();
            // const globalFlowRate1 = await pair1.token1GlobalFlowRate();

            // expect(receipt['flowRate'].toString()).to.equal(flowRate);
            // expect(receipt['active']).to.equal(true);
            // // expect(receipt['executed'].toString()).to.equal(
            // //     txReceipt.
            // // );
            // expect(globalFlowRate0.toString()).to.equal(flowRate);
            // expect(globalFlowRate1.toString()).to.equal('0');
        });

        it('[CreateFlow]: Should create a FlowSwap and stream back correct amount to user', async () => {
            const flowRate = '1000000';
            const amount0 = ethers.utils.parseEther('100').toString();
            const amount1 = ethers.utils.parseEther('200').toString();
            // await addLiquidityManual(
            //     pair1,
            //     superToken0,
            //     superToken1,
            //     amount0,
            //     amount1,
            //     owner
            // );

            // await sf.cfaV1
            //     .createFlow({
            //         flowRate,
            //         receiver: pair1.address,
            //         superToken: superToken0.address,
            //     })
            //     .exec(owner);

            // const tx = await pair1.createFlow(
            //     owner.address,
            //     ethers.utils.getAddress(superToken0.address)
            // );
            // const txReceipt = await tx.wait();
            // const blockNumber = txReceipt.blockNumber;
            // const executed = await provider.getBlock(blockNumber);
            // console.log(executed);
            // const receipt = await pair1.swapOf(owner.address);
            // const globalFlowRate0 = await pair1.token0GlobalFlowRate();
            // const globalFlowRate1 = await pair1.token1GlobalFlowRate();

            // expect(receipt['flowRate'].toString()).to.equal(flowRate);
            // expect(receipt['active']).to.equal(true);
            // expect(receipt['deposit'].toString()).to.equal('0');
            // expect(receipt['executed'].toString()).to.equal(
            //     txReceipt.
            // );
            // expect(globalFlowRate0.toString()).to.equal(flowRate);
            // expect(globalFlowRate1.toString()).to.equal('0');
        });
        //     //     // it('Should allow guardian to withdraw, async () => {
        //     //     //     await testNft.connect(addr1).approve(gallery1.address, 6);
        //     //     //     await gallery1
        //     //     //         .connect(addr1)
        //     //     //         .donate(testNft.address, 6, ethers.utils.parseEther('25'));
        //     //     //     await gallery1.connect(
        //     //     //         addr2.buy(1, { value: ethers.utils.parseEther('25') })
        //     //     //     );
        //     //     //     const balanceBefore = await provider.getBalance(owner.address);
        //     //     //     const tx = await gallery1.withdraw();
        //     //     //     const receipt = await tx.wait();
        //     //     //     const balanceAfter = await provider.getBalance(owner.address);
        //     //     // });
    });
});
