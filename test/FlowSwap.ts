import { expect } from 'chai';
import { ethers } from 'hardhat';
import { retrieveEventParam, sortAddresses, addressZero } from './helpers';
import { BigNumber, Contract } from 'ethers';
import {
    advanceTime,
    revertToSnapshot,
    takeSnapshot,
} from './helpers/timetraveler';
import { Framework, WrapperSuperToken } from '@superfluid-finance/sdk-core';
import {
    SwirlFactory,
    SwirlPoolToken,
    SwirlPool,
    SwirlPoolERC20,
    FixedPoint,
} from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import ERC20MockJson from '../artifacts/contracts/test/ERC20Mock.sol/ERC20Mock.json';
import { addLiquidityManual } from './helpers/swirlPoolRouter';
import { provideSuperTokens } from './helpers/superHelpers';

// Superfluid deploying helpers
/* eslint @typescript-eslint/no-var-requires: "off" */
const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');
const { web3 } = require('hardhat');
const ONE_DAY = 86400;
describe('SwirlPool Contract', () => {
    let swirlFactory: SwirlFactory;
    let swirlPool: SwirlPool;
    let swirlPoolERC20: SwirlPoolERC20;
    let swirlPoolToken0: SwirlPoolToken;
    let swirlPoolToken1: SwirlPoolToken;
    let swirlTokenProxy: SwirlPoolToken;
    let addrs: SignerWithAddress[];
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let pair1: SwirlPool;
    let mockToken0: Contract;
    let mockToken1: Contract;
    let superToken0: WrapperSuperToken;
    let superToken1: WrapperSuperToken;
    let sf: Framework;
    let snapshotId: string | Error;
    let fixedPointLib: FixedPoint;

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

        const FixedPointLib = await ethers.getContractFactory('FixedPoint');
        fixedPointLib = await FixedPointLib.deploy();

        const SwirlFactory = await ethers.getContractFactory('SwirlFactory');
        const SwirlPool = await ethers.getContractFactory('SwirlPool', {
            libraries: {
                FixedPoint: fixedPointLib.address,
            },
        });
        const SwirlTokenProxy = await ethers.getContractFactory(
            'SwirlPoolToken'
        );
        const SwirlPoolERC20Proxy = await ethers.getContractFactory(
            'SwirlPoolERC20'
        );

        swirlFactory = await SwirlFactory.deploy();
        await swirlFactory.deployed();

        swirlPoolERC20 = await SwirlPoolERC20Proxy.deploy();
        await swirlPoolERC20.deployed();

        swirlPool = await SwirlPool.deploy();
        await swirlPool.deployed();

        swirlTokenProxy = await SwirlTokenProxy.deploy();
        await swirlTokenProxy.deployed();

        await swirlFactory.initialize(
            sf.host.contract.address,
            swirlPoolERC20.address,
            swirlPool.address,
            swirlTokenProxy.address
        );

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

        const tx = await swirlFactory.createPair(
            superToken0.address,
            superToken1.address
        );
        const pair = await retrieveEventParam(tx, 'PairCreated', 'pair');
        pair1 = SwirlPool.attach(pair);

        const _SwirlPoolToken0 = await pair1.swirlToken0();
        const _SwirlPoolToken1 = await pair1.swirlToken1();

        swirlPoolToken0 = swirlTokenProxy.attach(_SwirlPoolToken0);
        swirlPoolToken1 = swirlTokenProxy.attach(_SwirlPoolToken1);

        await provideSuperTokens(
            mockToken0,
            mockToken1,
            '1000',
            '1000',
            superToken0,
            superToken1,
            owner
        );
        await provideSuperTokens(
            mockToken0,
            mockToken1,
            '1000',
            '1000',
            superToken0,
            superToken1,
            addr1
        );
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
        it('SwirlFactory: Should set correct SwirlPoolProxy address', async () => {
            expect(await swirlFactory.swirlPoolAddress()).to.equal(
                swirlPool.address
            );
        });
        it('SwirlFactory: Should be deployed and contain correct swirlTokenProxy', async () => {
            expect(await swirlFactory.swirlTokenProxy()).to.equal(
                swirlTokenProxy.address
            );
        });
        it('SwirlPool(Pair): Should be deployed and have correct underlying tokens set', async () => {
            const [token0, token1] = sortAddresses(
                superToken0.address,
                superToken1.address
            );
            expect(await pair1.token0()).to.equal(token0);
            expect(await pair1.token1()).to.equal(token1);
        });
        it('SwirlPool(Pair): Should be deployed and have correct underlying tokens set', async () => {
            const [token0, token1] = sortAddresses(
                superToken0.address,
                superToken1.address
            );
            expect(await pair1.token0()).to.equal(token0);
            expect(await pair1.token1()).to.equal(token1);
        });

        it('SwirlPool(Pair): Should of created two SwirlPoolTokens with correct underlying supertokens', async () => {
            expect(swirlPoolToken0.address).to.not.equal(addressZero);
            expect(swirlPoolToken1.address).to.not.equal(addressZero);

            const host0 = await swirlPoolToken0.getHost();
            const host1 = await swirlPoolToken1.getHost();

            expect(host0).to.equal(pair1.address);
            expect(host1).to.equal(pair1.address);
        });
    });

    describe('SwirlPoolToken', () => {
        it('[Transfer] Should transfer the correct number of tokens', async () => {
            const flowRate0 = BigNumber.from(ethers.utils.parseEther('1'))
                .div('86400')
                .toString();
            const amount0 = ethers.utils.parseEther('400').toString();
            const amount1 = ethers.utils.parseEther('330').toString();
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
                    flowRate: flowRate0,
                    receiver: pair1.address,
                    superToken: superToken0.address,
                })
                .exec(owner);

            await advanceTime(ONE_DAY);
            await pair1.sync();

            const balanceBefore = await swirlPoolToken1.balanceOf(
                owner.address
            );

            await swirlPoolToken1.transfer(addr1.address, balanceBefore);

            const balanceRecieved = await swirlPoolToken1.balanceOf(
                addr1.address
            );

            expect(balanceRecieved).to.equal(balanceBefore);
        });
    });

    describe('SwirlPool', () => {
        it('[Mint] Should provide liquidty and mint correct amount of LP tokens', async () => {
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
            expect(acctualLiquidity.toString()).to.equal(
                expectedLiquidty.toString()
            );
        });
        it('[Burn] Should burn the provided LP tokens and return the correct amount of reserves', async () => {
            // todo
        });
        it('[CreateFlow]: Should trigger create flow and set the correct state', async () => {
            const flowRate0 = '100000000000000';
            const flowRate1 = '100000000000000';
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
                    flowRate: flowRate0,
                    receiver: pair1.address,
                    superToken: superToken0.address,
                })
                .exec(owner);
            await advanceTime(ONE_DAY);

            await sf.cfaV1
                .createFlow({
                    flowRate: flowRate1,
                    receiver: pair1.address,
                    superToken: superToken1.address,
                })
                .exec(addr1);

            const token0GlobalFlowRate = await pair1.token0GlobalFlowRate();
            const token1GlobalFlowRate = await pair1.token1GlobalFlowRate();

            expect(token0GlobalFlowRate.toString()).to.equal(flowRate0);
            expect(token1GlobalFlowRate.toString()).to.equal(flowRate1);
        });

        it('[CreateFlow]: Should stream the correct amount token0', async () => {
            const flowRate0 = '100000000000000';
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
                    flowRate: flowRate0,
                    receiver: pair1.address,
                    superToken: superToken0.address,
                })
                .exec(owner);

            await advanceTime(ONE_DAY);

            await pair1.sync();
            const reserve0 = await pair1.reserve0();

            const expectedReserve = BigNumber.from(flowRate0).mul(
                BigNumber.from(ONE_DAY)
            );
            expect(reserve0.toString()).to.equal(
                BigNumber.from(amount0).add(expectedReserve)
            );
        });
        it('[CreateFlow]: Should stream the correct amount token1', async () => {
            const flowRate0 = '100000000000000';
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
                    flowRate: flowRate0,
                    receiver: pair1.address,
                    superToken: superToken1.address,
                })
                .exec(owner);

            await advanceTime(ONE_DAY);

            await pair1.sync();
            const reserve1 = await pair1.reserve1();

            const expectedReserve = BigNumber.from(amount1).add(
                BigNumber.from(flowRate0).mul(BigNumber.from(ONE_DAY))
            );
            expect(reserve1.toString()).to.equal(expectedReserve);
        });
        it('[CreateFlow]: Should stream the correct amount token0 & token1', async () => {
            // todo
        });
        it('[realtimeBalanceOf]: Should retrieve the correct balance', async () => {
            const flowRate0 = BigNumber.from(ethers.utils.parseEther('1'))
                .div('86400')
                .toString();
            const amount0 = ethers.utils.parseEther('400').toString();
            const amount1 = ethers.utils.parseEther('330').toString();
            await addLiquidityManual(
                pair1,
                superToken0,
                superToken1,
                amount0,
                amount1,
                owner
            );
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
                    flowRate: flowRate0,
                    receiver: pair1.address,
                    superToken: superToken0.address,
                })
                .exec(owner);

            await advanceTime(ONE_DAY);
            await pair1.sync();

            const balance1 = await swirlPoolToken1.balanceOf(owner.address);

            const flowActualBalance1 = await superToken1.balanceOf({
                account: pair1.address,
                providerOrSigner: owner,
            });

            const reserve1 = await pair1.reserve1();

            expect(reserve1.toString()).to.equal(
                BigNumber.from(flowActualBalance1).sub(balance1)
            );
        });
        it('[Terminate]: Should terminate a stream when cancled through super app', async () => {
            const flowRate0 = BigNumber.from(ethers.utils.parseEther('1'))
                .div('86400')
                .toString();
            const amount0 = ethers.utils.parseEther('400').toString();
            const amount1 = ethers.utils.parseEther('330').toString();
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
                    flowRate: flowRate0,
                    receiver: pair1.address,
                    superToken: superToken0.address,
                })
                .exec(owner);

            await advanceTime(ONE_DAY);
            await pair1.sync();

            await sf.cfaV1
                .deleteFlow({
                    sender: owner.address,
                    receiver: pair1.address,
                    superToken: superToken0.address,
                })
                .exec(owner);

            const acctualFlowRate = await sf.cfaV1.getFlow({
                superToken: superToken0.address,
                sender: owner.address,
                receiver: pair1.address,
                providerOrSigner: owner,
            });

            const receipt = await pair1.swapOf(owner.address);

            expect(acctualFlowRate.flowRate).to.equal('0');
            expect(receipt.flowRate).to.equal('0');
        });
        it('[Claim]: Should claim the correct amount of streamed data', async () => {
            const flowRate0 = BigNumber.from(ethers.utils.parseEther('1'))
                .div('86400')
                .toString();
            const amount0 = ethers.utils.parseEther('400').toString();
            const amount1 = ethers.utils.parseEther('330').toString();
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
                    flowRate: flowRate0,
                    receiver: pair1.address,
                    superToken: superToken0.address,
                })
                .exec(owner);

            await advanceTime(ONE_DAY);
            await pair1.sync();

            const flowBalanceBefore = await swirlPoolToken1.balanceOf(
                owner.address
            );

            const pairflowBalanceStart = await swirlPoolToken1.balanceOf(
                pair1.address
            );

            expect(pairflowBalanceStart).to.equal('0');

            await swirlPoolToken1.transfer(pair1.address, flowBalanceBefore);
            const pairflowBalanceBefore = await swirlPoolToken1.balanceOf(
                pair1.address
            );

            expect(flowBalanceBefore).to.equal(pairflowBalanceBefore);

            await pair1.claim(owner.address);
        });
    });
});
