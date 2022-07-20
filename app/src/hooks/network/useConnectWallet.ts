import { ref, isRef, unref, watchEffect, onMounted, onUnmounted } from 'vue';
import { ethers } from 'ethers';
import { useUserStore } from '@/store/user';
import { useUi } from '@/store/ui';
import { addressZero, shortAddress } from '@/utils';

export function useConnectWallet() {
    const data = ref(null);
    const error = ref(null);
    const address = ref('');
    const userStore = useUserStore();
    const ui = useUi();

    const connect = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(
                window.ethereum,
                'any'
            );
            await provider.send('eth_requestAccounts', []);
            const signer = provider.getSigner();
            address.value = await signer.getAddress();

            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                console.log(accounts);
                onAccountChanged(address.value, accounts);
            });

            window.ethereum.on('chainChanged', (accounts: string[]) => {
                onChainChanged(address.value, accounts);
            });

            userStore.setAddress(address.value);
            ui.setConnected(true);
        } catch (err: any) {
            // todo handle errors
            console.log(err);
        }
    };

    const onChainChanged = (address: string, accounts: string[]) => {
        console.log(address, accounts);
    };
    const onAccountChanged = (address: string, accounts: string[]) => {
        if (accounts.length == 0) {
            userStore.setAddress(addressZero);
            ui.setConnected(false);
        } else {
            userStore.setAddress(accounts[0]);
        }
    };

    return { connect };
}
