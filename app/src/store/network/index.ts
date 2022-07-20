import { addressZero } from '@/utils';
import { Address } from '@/types';
import { defineStore } from 'pinia';
import Web3 from 'Web3';
import { Contract } from 'ethers';
export const useNetwork = defineStore('network', {
    state: () => ({
        swirlPool: new Contract('', ''),
        web3: new Web3(),
    }),
    getters: {
        getWeb3: (state) => state.web3,
        getSwirlPool: (state) => state.swirlPool,
    },
    actions: {
        setWeb3(web3: Web3): void {
            this.web3 = web3;
        },
        setSwirlPool(swirlPool: Contract): void {
            this.swirlPool = swirlPool;
        },
    },
});
