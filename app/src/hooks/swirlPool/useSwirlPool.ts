import { BigNumberish, ethers } from 'ethers';
import addresses from '@/contracts/contract-address.json';
import { SwirlPool__factory, SwirlPool } from '../../../../typechain-types';
import { Address } from '@/types';
export function useSwirlPool(signer: ethers.Signer) {
    let swirlPool: SwirlPool;

    const setup = async () => {
        if (!swirlPool)
            swirlPool = SwirlPool__factory.connect(addresses.SwirlPool, signer);
    };

    const mint = async (
        to: Address,
        amount0: string | BigNumberish,
        amount1: string | BigNumberish
    ) => {
        try {
            await swirlPool.mint(to, amount0, amount1);
        } catch (err: any) {
            console.log(err);
        }
    };

    const claim = async (to: Address) => {
        try {
            return await swirlPool.claim(to);
        } catch (err: any) {
            console.log(err);
        }
    };

    const burn = async (to: Address) => {
        try {
            return await swirlPool.burn(to);
        } catch (err: any) {
            console.log(err);
        }
    };
    const getReserves = async () => {
        try {
            return await swirlPool.getReserves();
        } catch (err: any) {
            console.log(err);
        }
    };
    const getFactory = async () => {
        try {
            return await swirlPool.factory();
        } catch (err: any) {
            console.log(err);
        }
    };
    const getLpToken = async () => {
        try {
            return await swirlPool.lpToken();
        } catch (err: any) {
            console.log(err);
        }
    };
    const getSwapOf = async (who: Address) => {
        try {
            return await swirlPool.swapOf(who);
        } catch (err: any) {
            console.log(err);
        }
    };
    const getSwirlToken0 = async (who: Address) => {
        try {
            return await swirlPool.swirlToken0();
        } catch (err: any) {
            console.log(err);
        }
    };
    const getSwirlToken1 = async (who: Address) => {
        try {
            return await swirlPool.swirlToken0();
        } catch (err: any) {
            console.log(err);
        }
    };
    const getToken0 = async (who: Address) => {
        try {
            return await swirlPool.token0();
        } catch (err: any) {
            console.log(err);
        }
    };
    const getToken1 = async (who: Address) => {
        try {
            return await swirlPool.token1();
        } catch (err: any) {
            console.log(err);
        }
    };

    return {
        setup,
        claim,
        mint,
        burn,
        getReserves,
        getFactory,
        getLpToken,
        getSwapOf,
        getSwirlToken0,
        getSwirlToken1,
        getToken0,
        getToken1,
    };
}
