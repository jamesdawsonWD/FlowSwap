import { WrapperSuperToken } from '@superfluid-finance/sdk-core';
import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';

export const provideSuperTokens = async (
    mockToken0: Contract,
    mockToken1: Contract,
    amount0: string,
    amount1: string,
    superToken0: WrapperSuperToken,
    superToken1: WrapperSuperToken,
    owner: SignerWithAddress
) => {
    await mockToken0
        .connect(owner)
        .mint(owner.address, ethers.utils.parseEther(amount0));

    await mockToken1
        .connect(owner)
        .mint(owner.address, ethers.utils.parseEther(amount1));

    await mockToken0
        .connect(owner)
        .approve(superToken0.address, ethers.utils.parseEther(amount0));

    await mockToken1
        .connect(owner)
        .approve(superToken1.address, ethers.utils.parseEther(amount1));

    const superToken0UpgradeOperation = superToken0.upgrade({
        amount: ethers.utils.parseEther(amount0).toString(),
    });
    const superToken1UpgradeOperation = superToken1.upgrade({
        amount: ethers.utils.parseEther(amount1).toString(),
    });

    await superToken0UpgradeOperation.exec(owner);
    await superToken1UpgradeOperation.exec(owner);
    return true;
};
