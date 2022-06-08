import BN from 'bn.js';
import { ContractReceipt } from 'ethers';
import { Result } from 'ethers/lib/utils';
import { ethers } from 'hardhat';

export const getEvent = (receipt: any, event: string) =>
    receipt.events?.filter((x: any) => x.event == event);

export const addressZero = '0x' + '0'.repeat(40);

export async function retrieveEventParam(
    tx: any,
    eventName: string,
    param: string
) {
    const receipt = await tx.wait();
    const event = getEvent(receipt, eventName);
    return event[0].args[param];
}

export const sortAddresses = (address0: string, address1: string) =>
    address0 < address1 ? [address0, address1] : [address1, address0];

// found this online for square rooting, should convert it to work with BigNumber from ethers
export const sqrt = (num: BN): BN => {
    if (num.lt(new BN(0))) {
        throw new Error('Sqrt only works on non-negtiave inputs');
    }
    if (num.lt(new BN(2))) {
        return num;
    }

    const smallCand = sqrt(num.shrn(2)).shln(1);
    const largeCand = smallCand.add(new BN(1));

    if (largeCand.mul(largeCand).gt(num)) {
        return smallCand;
    } else {
        return largeCand;
    }
};

export const decodeEvents = (receipt: ContractReceipt, signature: string) => {
    const sigToBytes = ethers.utils.toUtf8Bytes(signature);
    const bytesToHash = ethers.utils.keccak256(sigToBytes);
    console.log(bytesToHash, receipt.logs);
    const logs = receipt.logs?.filter((x: any) => x.topics[0] == bytesToHash);
    const types = signature
        .match(/\((.*)\)/)
        ?.pop()
        ?.split(',') as string[];

    const decodedLogs: Result[][] = [];
    console.log(logs);

    logs.forEach((element) => {
        const decoded = element.topics
            .slice(1)
            .map(
                (x, i) => ethers.utils.defaultAbiCoder.decode([types[i]], x)[0]
            );
        decodedLogs.push(decoded);
    });

    return decodedLogs;
};
