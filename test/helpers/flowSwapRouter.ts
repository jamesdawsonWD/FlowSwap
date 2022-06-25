import {
    IBaseSuperTokenParams,
    SuperToken,
} from '@superfluid-finance/sdk-core';
import { BigNumber, Signer } from 'ethers';
import { FlowSwap } from '../../typechain-types';
import BN from 'bn.js';
import { retrieveEventParam, sqrt } from '.';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Provider } from '.pnpm/@ethersproject/abstract-provider@5.6.0/node_modules/@ethersproject/abstract-provider';

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
        .approve({
            receiver: pair.address,
            amount: amount0,
        } as IBaseSuperTokenParams)
        .exec(owner);

    await token1
        .approve({
            receiver: pair.address,
            amount: amount1,
        } as IBaseSuperTokenParams)
        .exec(owner);

    // const allownace0 = await token0.allowance({
    //     owner: owner.address,
    //     spender: pair.address,
    //     providerOrSigner: owner.provider as Provider,
    // });

    const tx = await pair.mint(owner.address, amount0, amount1);
    const acctualLiquidity = await retrieveEventParam(tx, 'Mint', 'liquidity');

    return { expectedLiquidty, acctualLiquidity };
};
