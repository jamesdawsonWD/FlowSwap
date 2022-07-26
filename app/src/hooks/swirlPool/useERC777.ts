import { BigNumberish, ethers } from 'ethers';

import {
    SwirlPoolToken__factory,
    SwirlPoolToken,
} from '../../../../typechain-types';
import { Address } from '@/types';
export function useERC777(address: Address, signer: ethers.Signer) {
    let swirlPoolToken: SwirlPoolToken;

    const setup = async () => {
        if (!swirlPoolToken)
            swirlPoolToken = SwirlPoolToken__factory.connect(address, signer);
    };

    const approve = async (to: Address, amount: BigNumberish) => {
        try {
            return await swirlPoolToken.approve(to, amount);
        } catch (err: any) {
            console.log(err);
        }
    };

    const balanceOf = async (who: Address) => {
        try {
            return await swirlPoolToken.balanceOf(who);
        } catch (err: any) {
            console.log(err);
        }
    };
    const allowance = async (account: Address, spender: Address) => {
        try {
            return await swirlPoolToken.allowance(account, spender);
        } catch (err: any) {
            console.log(err);
        }
    };

    const burn = async (amount: BigNumberish) => {
        try {
            return await swirlPoolToken.burn(amount, '');
        } catch (err: any) {
            console.log(err);
        }
    };
    const transfer = async (to: Address, amount: BigNumberish) => {
        try {
            return await swirlPoolToken.transfer(to, amount);
        } catch (err: any) {
            console.log(err);
        }
    };
    const transferFrom = async (
        to: Address,
        from: Address,
        amount: BigNumberish
    ) => {
        try {
            return await swirlPoolToken.transferFrom(from, to, amount);
        } catch (err: any) {
            console.log(err);
        }
    };

    return {
        setup,
        approve,
        transfer,
        balanceOf,
        allowance,
        burn,
        transferFrom,
    };
}
