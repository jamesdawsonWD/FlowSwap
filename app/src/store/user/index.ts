import { addressZero } from '@/utils';
import { Address } from '@/types';
import { defineStore } from 'pinia';
import Web3 from 'Web3';
export const useUserStore = defineStore('loggedInUser', {
    state: () => ({
        balance: {},
        address: addressZero,
        web3: new Web3(),
    }),
    getters: {
        getBalance: (state) => state.balance,
        getAddress: (state) => state.address,
    },
    actions: {
        setAddress(address: Address): void {
            this.address = address;
        },
        setBalance(balance: object): void {
            this.balance = balance;
        },
        setWeb3(web3: Web3): void {
            this.web3 = web3;
        },
    },
});
