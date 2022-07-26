import { BigNumberish, ethers } from 'ethers';
import addresses from '@/contracts/contract-address.json';
import {
    SwirlPoolERC20__factory,
    SwirlPoolERC20,
} from '../../../../typechain-types';
import { Address } from '@/types';
export function useSwirlPoolERC20(signer: ethers.Signer) {
    let swirlPoolERC20: SwirlPoolERC20;

    const setup = async () => {
        if (!swirlPoolERC20)
            swirlPoolERC20 = SwirlPoolERC20__factory.connect(
                addresses.SwirlPoolERC20,
                signer
            );
    };

    const approve = async (to: Address, amount: BigNumberish) => {
        try {
            return await swirlPoolERC20.approve(to, amount);
        } catch (err: any) {
            console.log(err);
        }
    };

    const burn = async (from: Address, amount: BigNumberish) => {
        try {
            return await swirlPoolERC20.burn(from, amount);
        } catch (err: any) {
            console.log(err);
        }
    };

    const balanceOf = async (who: Address) => {
        try {
            return await swirlPoolERC20.balanceOf(who);
        } catch (err: any) {
            console.log(err);
        }
    };

    const permit = async (
        owner: Address,
        spender: Address,
        amount: BigNumberish,
        deadline: string,
        v: BigNumberish,
        r: ethers.utils.BytesLike,
        s: ethers.utils.BytesLike
    ) => {
        try {
            return await swirlPoolERC20.permit(
                owner,
                spender,
                amount,
                deadline,
                v,
                r,
                s
            );
        } catch (err: any) {
            console.log(err);
        }
    };

    const transfer = async (to: Address, amount: BigNumberish) => {
        try {
            return await swirlPoolERC20.transfer(to, amount);
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
            return await swirlPoolERC20.transferFrom(from, to, amount);
        } catch (err: any) {
            console.log(err);
        }
    };

    return {
        setup,
        approve,
        balanceOf,
        transfer,
        permit,
        burn,
        transferFrom,
    };
}
