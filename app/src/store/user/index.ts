import { addressZero } from '@/utils';
import { Address } from '@/types';
import { defineStore } from 'pinia';
import Web3 from 'Web3';
import { ethers, Signer } from 'ethers';
export const useUserStore = defineStore('loggedInUser', {
    state: () => ({
        balance: {},
        address: addressZero,
        signer: {} as Signer,
        provider: {} as ethers.providers.Web3Provider,
        web3: new Web3(),
    }),
    getters: {
        getBalance: (state) => state.balance,
        getSigner: (state) => state.signer,
        getProvider: (state) => state.provider,
        getAddress: (state) => state.address,
    },
    actions: {
        setAddress(address: Address): void {
            this.address = address;
        },
        setSigner(signer: Signer): void {
            this.signer = signer;
        },
        setProvider(provider: ethers.providers.Web3Provider): void {
            this.provider = provider;
        },
        setBalance(balance: object): void {
            this.balance = balance;
        },
        setWeb3(web3: Web3): void {
            this.web3 = web3;
        },
    },
});
