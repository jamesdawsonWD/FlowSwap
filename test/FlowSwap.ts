import { expect } from 'chai';
import { ethers } from 'hardhat';
import { retrieveEventParam, sortAddresses, addressZero } from './helpers';
import { BigNumber, Contract, Signer } from 'ethers';
import {
    advanceTime,
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
    FlowSwapERC20,
    FixedPoint,
    FixedPointTest,
    PriceTest,
} from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import ERC20MockJson from '../artifacts/contracts/test/ERC20Mock.sol/ERC20Mock.json';
import { addLiquidityManual } from './helpers/flowSwapRouter';
import { provideSuperTokens } from './helpers/superHelpers';

// Superfluid deploying helpers
/* eslint @typescript-eslint/no-var-requires: "off" */
const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');
const { web3 } = require('hardhat');

const provider = web3.provider;
const ONE_DAY = 86400;
describe('FlowSwap Contract', () => {
    let flowFactory: FlowFactory;
    let flowSwap: FlowSwap;
    let flowSwapERC20: FlowSwapERC20;
    let flowSwapToken0: FlowSwapToken;
    let flowSwapToken1: FlowSwapToken;
    let flowTokenProxy: FlowSwapToken;
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
    let fixedPointLib: FixedPoint;
    let fixedPointLibTest: FixedPointTest;
    let priceTest: PriceTest;
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
        const FixedPointLib = await ethers.getContractFactory('FixedPoint');
        const FixedPointTest = await ethers.getContractFactory(
            'FixedPointTest'
        );
        fixedPointLibTest = await FixedPointTest.deploy();
        fixedPointLib = await FixedPointLib.deploy();
        const FlowFactory = await ethers.getContractFactory('FlowFactory');
        const PriceTest = await ethers.getContractFactory('PriceTest');
        const FlowSwap = await ethers.getContractFactory('FlowSwap', {
            libraries: {
                FixedPoint: fixedPointLib.address,
            },
        });
        priceTest = await PriceTest.deploy();
        const FlowTokenProxy = await ethers.getContractFactory('FlowSwapToken');
        const FlowSwapERC20Proxy = await ethers.getContractFactory(
            'FlowSwapERC20'
        );

        flowFactory = await FlowFactory.deploy();
        await flowFactory.deployed();

        flowSwapERC20 = await FlowSwapERC20Proxy.deploy();
        await flowSwapERC20.deployed();

        flowSwap = await FlowSwap.deploy();
        await flowSwap.deployed();

        flowTokenProxy = await FlowTokenProxy.deploy();
        await flowTokenProxy.deployed();

        await flowFactory.initialize(
            sf.host.contract.address,
            flowSwapERC20.address,
            flowSwap.address,
            flowTokenProxy.address
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

        it('FlowSwap(Pair): Should of created two FlowSwapTokens with correct underlying supertokens', async () => {
            expect(flowSwapToken0.address).to.not.equal(addressZero);
            expect(flowSwapToken1.address).to.not.equal(addressZero);

            const host0 = await flowSwapToken0.getHost();
            const host1 = await flowSwapToken1.getHost();

            expect(host0).to.equal(pair1.address);
            expect(host1).to.equal(pair1.address);
        });
    });

    describe('FlowSwap', () => {
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
            const receipt = await pair1.swapOf(owner.address);
            const priceCumulativeLast = await pair1.getPriceCumulativeLast(
                superToken1.address
            );

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

            const time1 = await pair1.blockTimestampLast();
            const priceCUmulativeStart = await pair1.price0CumulativeLast();
            await sf.cfaV1
                .createFlow({
                    flowRate: flowRate0,
                    receiver: pair1.address,
                    superToken: superToken0.address,
                })
                .exec(owner);
            const price0CumulativeBefore = await pair1.price0CumulativeLast();
            const price1CumulativeBefore = await pair1.price1CumulativeLast();
            const receipt = await pair1.swapOf(owner.address);

            console.log(
                await priceTest.getAveragePrice(
                    price0CumulativeBefore,
                    priceCUmulativeStart,
                    receipt.executed - time1
                )
            );

            await advanceTime(ONE_DAY);
            await pair1.sync();

            const price0CumulativeAfter = await pair1.price0CumulativeLast();
            const price1CumulativeAfter = await pair1.price1CumulativeLast();
            const time2 = await pair1.blockTimestampLast();

            console.log(
                BigNumber.from(
                    await fixedPointLibTest.decode144Uint(
                        price0CumulativeAfter.sub(price0CumulativeBefore)
                    )
                ).div(time2 - receipt.executed)
            );
            const timeAfter = await pair1.blockTimestampLast();

            const timeElapsed = timeAfter - receipt.executed;

            const expectedPrice0 = price0CumulativeAfter.sub(
                price0CumulativeBefore
            );

            console.log(
                await fixedPointLibTest.decode144Uint(
                    expectedPrice0.div(timeElapsed).toString()
                )
            );

            const balance1 = await flowSwapToken1.balanceOf(owner.address);
            const balance0 = await flowSwapToken0.balanceOf(owner.address);

            const flowActualBalance1 = await superToken1.balanceOf({
                account: pair1.address,
                providerOrSigner: owner,
            });
            const flowActualBalance0 = await superToken0.balanceOf({
                account: pair1.address,
                providerOrSigner: owner,
            });

            console.log(
                ethers.utils.formatEther(
                    BigNumber.from(flowActualBalance0)
                        .sub(ethers.utils.parseEther('40').toString())
                        .toString()
                ),
                flowActualBalance1.toString()
            );
            const reserve1 = await pair1.reserve1();

            console.log(
                ethers.utils.formatEther(reserve1.toString()),
                ethers.utils.formatEther(
                    BigNumber.from(flowActualBalance1).sub(balance1)
                )
            );
            console.log(ethers.utils.formatEther(balance1));
            console.log(ethers.utils.formatEther(flowActualBalance1));
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
            // * @param superToken the superToken of the agreement
            // * @param sender the sender of the flow
            // * @param receiver the receiver of the flow
            // * @param providerOrSigner a provider or signer object
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

            const balanceBefore = await superToken0.balanceOf({
                account: owner.address,
                providerOrSigner: owner,
            });

            const flowBalanceBefore = await flowSwapToken1.balanceOf(
                owner.address
            );

            const pairflowBalanceStart = await flowSwapToken1.balanceOf(
                pair1.address
            );

            expect(pairflowBalanceStart).to.equal('0');

            console.log(ethers.utils.formatEther(balanceBefore));
            console.log(ethers.utils.formatEther(flowBalanceBefore));
            await flowSwapToken1.transfer(pair1.address, flowBalanceBefore);
            const pairflowBalanceBefore = await flowSwapToken1.balanceOf(
                pair1.address
            );

            expect(flowBalanceBefore).to.equal(pairflowBalanceBefore);

            await pair1.claim(owner.address);

            const flowBalanceAfter = await flowSwapToken1.balanceOf(
                owner.address
            );

            expect(flowBalanceAfter).to.equal('0');

            const balanceAfter = await superToken0.balanceOf({
                account: owner.address,
                providerOrSigner: owner,
            });

            expect(
                BigNumber.from(balanceBefore).add(flowBalanceBefore).toString()
            ).to.equal(balanceAfter);
        });
        it('[PriceCumulative0]: Should create the correct average price', async () => {
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
            const timeStart = await pair1.blockTimestampLast();

            await addLiquidityManual(
                pair1,
                superToken0,
                superToken1,
                amount0,
                amount1,
                owner
            );

            const price0CumulativeStart = await pair1.price0CumulativeLast();
            const price1CumulativeStart = await pair1.price1CumulativeLast();
            const timeMid = await pair1.blockTimestampLast();
            const reserve0 = await pair1.reserve0();
            const reserve1 = await pair1.reserve1();
            const expectedReserve0 = BigNumber.from(amount0).mul(2);
            const expectedReserve1 = BigNumber.from(amount1).mul(2);
            expect(reserve0.toString()).to.equal(expectedReserve0);
            expect(reserve1.toString()).to.equal(expectedReserve1);

            const expectedPrice0CumulativeStart = BigNumber.from(amount1)
                .div(amount0)
                .mul(100);
            const expectedPrice1CumulativeStart = BigNumber.from(amount0)
                .div(amount1)
                .mul(100);
            expect(price0CumulativeStart.toString()).to.equal(
                expectedPrice0CumulativeStart
            );

            await advanceTime(100);

            await addLiquidityManual(
                pair1,
                superToken0,
                superToken1,
                amount0,
                amount1,
                owner
            );

            const price0CumulativeEnd = await pair1.price0CumulativeLast();
            const price1CumulativeEnd = await pair1.price1CumulativeLast();

            const timeEnd = await pair1.blockTimestampLast();
            const reserve0End = await pair1.reserve0();
            const reserve1End = await pair1.reserve1();

            const timeElapsedMidToEnd = timeEnd - timeMid;

            // const price0CumulativeMid = await pair1.price0CumulativeLast();
            // const price1CumulativeMid = await pair1.price1CumulativeLast();
            // const timeEnd = await pair1.blockTimestampLast();

            // const price0CumulativeDiff = price0CumulativeMid.sub(
            //     price0CumulativeStart
            // );
            // const price1CumulativeDiff = price1CumulativeMid.sub(
            //     price1CumulativeStart
            // );
            // console.log(timeStart);
            // console.log(timeMid);
            // const timeElapsed = timeMid - timeStart;
            // console.log(price0CumulativeMid);
            // console.log(price1CumulativeMid);
            // console.log(price0CumulativeDiff);
            // console.log(price1CumulativeDiff);
            // expect(price0CumulativeMid.toString()).to.equal(
            //     price0CumulativeDiff.div(timeElapsed)
            // );
            // expect(price1CumulativeMid.toString()).to.equal(
            //     price1CumulativeDiff.div(timeElapsed)
            // );
        });
        it('[getPriceCumulativeLast]: Should get the correct price cumulative', async () => {
            const flowRate0 = BigNumber.from(ethers.utils.parseEther('1'))
                .div('86400')
                .toString();
            const amount0 = ethers.utils.parseEther('20').toString();
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

            const expectedPriceCumulativeLast0 =
                await pair1.price0CumulativeLast();
            const expectedPriceCumulativeLast1 =
                await pair1.price1CumulativeLast();

            const price0CumulativeLast = await pair1.getPriceCumulativeLast(
                await flowSwapToken1.getUnderlyingToken()
            );
            const price1CumulativeLast = await pair1.getPriceCumulativeLast(
                await flowSwapToken0.getUnderlyingToken()
            );

            expect(price0CumulativeLast.toString()).to.equal(
                expectedPriceCumulativeLast0.toString()
            );
            expect(price1CumulativeLast.toString()).to.equal(
                expectedPriceCumulativeLast1.toString()
            );
        });
        it('[Conversion]: Formula should convert correctly', async () => {
            const flowRate = BigNumber.from(ethers.utils.parseEther('1'))
                .div('86400')
                .toString();
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
                    flowRate: flowRate,
                    receiver: pair1.address,
                    superToken: superToken0.address,
                })
                .exec(owner);

            const receipt = await pair1.swapOf(owner.address);
            const priceCumulativeStart = receipt.priceCumulativeStart;

            await advanceTime(ONE_DAY);

            await pair1.sync();

            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;

            const priceCumulativeLast = await pair1.getPriceCumulativeLast(
                superToken1.address
            );

            const conversion = await flowSwapToken1.conversion(
                flowRate,
                receipt.executed,
                timestampBefore,
                priceCumulativeStart,
                priceCumulativeLast
            );

            const timeElapsed = BigNumber.from(timestampBefore).sub(
                receipt.executed
            );
            const totalFlowed = BigNumber.from(flowRate).mul(timeElapsed);
            const averagePrice = priceCumulativeLast
                .sub(priceCumulativeStart)
                .div(timeElapsed);
            const expectedConversion = averagePrice.mul(totalFlowed);

            expect(conversion.toString()).to.equal(
                expectedConversion.toString()
            );
        });
    });
});
