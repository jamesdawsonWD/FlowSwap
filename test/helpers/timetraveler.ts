import { ethers } from 'hardhat';

export const advanceTime = (time: number) => {
    return ethers.provider
        .send('evm_increaseTime', [time])
        .then((result: string) => result)
        .catch((error: Error) => error);
};

export const advanceBlock = () => {
    return ethers.provider
        .send('evm_mine', [])
        .then((result: string) => result)
        .catch((error: Error) => error);
};

export const advanceBlockAndSetTime = (time: number) => {
    return ethers.provider
        .send('evm_mine', [time])
        .then((result: string) => result)
        .catch((error: Error) => error);
};

export const advanceTimeAndBlock = async (time: number) => {
    return ethers.provider
        .getBlock('latest')
        .then((block) => block['timestamp'] + time)
        .then((forwardTime: number) =>
            ethers.provider.send('evm_mine', [forwardTime])
        )
        .then((result: string) => result)
        .catch((error: Error) => error);
};

export const takeSnapshot = () => {
    return ethers.provider
        .send('evm_snapshot', [])
        .then((result: string) => result)
        .catch((error: Error) => error);
};

export const revertToSnapshot = (id: string) => {
    return ethers.provider
        .send('evm_revert', [id])
        .then((result: string) => result)
        .catch((error: Error) => error);
};
