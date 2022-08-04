import { Address } from '@/types';
import { ethers } from 'ethers';

export function predictDeterministicAddress(
    implementationAddress: Address,
    asset0: Address,
    asset1: Address
) {
    const implementation = implementationAddress
        .toLowerCase()
        .replace('0x.', '')
        .padStart(40, '0');
    const initCode = `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${implementation}5af43d82803e903d91602b57fd5bf3`;
    const initCodeHash = ethers.utils.keccak256(initCode);
    const calculatedAddress = ethers.utils.getCreate2Address(
        from,
        salt,
        initCodeHash
    );
}
