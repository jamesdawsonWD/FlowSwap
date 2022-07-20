import { ref, isRef, unref, watchEffect, onMounted, onUnmounted } from 'vue';
import { ethers } from 'ethers';

import { useUserStore } from '@/store/user';
import { useUi } from '@/store/ui';
import { useNetwork } from '@/store/network';
import { addressZero, shortAddress } from '@/utils';
import addresses from '@/contracts/contract-address.json';
import SwirlPool from '@/contracts/SwirlPool.json';
export function useSwirlPool() {
    const data = ref(null);
    const error = ref(null);
    const address = ref('');
    const userStore = useUserStore();
    const network = useNetwork();

    const setup = async () => {
        const Contract = new ethers.Contract(addresses.SwirlPool, SwirlPool.abi);
        const swirlPool = Contract.attach(addresses.SwirlPool);
        network.setSwirlPool(swirlPool);
        // const contract = new web3.eth.Contract(ClayToken.abi, payload.address);
    };

    const 

    // const onChainChanged = (address: string, accounts: string[]) => {
    //     console.log(address, accounts);
    // };
    // const onAccountChanged = (address: string, accounts: string[]) => {
    //     if (accounts.length == 0) {
    //         userStore.setAddress(addressZero);
    //         ui.setConnected(false);
    //     } else {
    //         userStore.setAddress(accounts[0]);
    //     }
    // };

    return { setup };
}
