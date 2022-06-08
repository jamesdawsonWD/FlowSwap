import {
    IBaseSuperTokenParams,
    SuperToken,
} from '@superfluid-finance/sdk-core';
import { BigNumber } from 'ethers';
import { FlowSwap } from '../../typechain-types';
import BN from 'bn.js';
import { retrieveEventParam, sqrt } from '.';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export const addLiquidityManual = async (
    pair: FlowSwap,
    token0: SuperToken,
    token1: SuperToken,
    amount0: string,
    amount1: string,
    owner: SignerWithAddress
) => {
    const product = BigNumber.from(amount0).mul(BigNumber.from(amount1));

    // BigNumber doesn't have a square root function, work around for now - see helper.ts
    const mimimumLiquidty = new BN(10 ** 3);
    const expectedLiquidty = sqrt(new BN(product.toString())).sub(
        mimimumLiquidty
    );

    await token0
        .transfer({
            receiver: pair.address,
            amount: amount0,
        } as IBaseSuperTokenParams)
        .exec(owner);

    await token1
        .transfer({
            receiver: pair.address,
            amount: amount1,
        } as IBaseSuperTokenParams)
        .exec(owner);

    const tx = await pair.mint(owner.address);
    const acctualLiquidity = await retrieveEventParam(tx, 'Mint', 'liquidity');

    return { expectedLiquidty, acctualLiquidity };
};
