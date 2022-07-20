// import { Address, ChainList, INftOwnerCollection } from '@/types';
// import { ref } from 'vue';
// import Moralis from 'moralis';
// import { verifyMetadata } from './useMetadata';
// export default async function useNftBalance(address: Address, chainId?: ChainList) {
//     const balances = ref();
//     const loaded = ref(false)
//     const request: INftOwnerCollection = Moralis.Web3API.account.getNFTs({ chain: chainId ? chainId : 'eth', address })

//     if (loaded.value == false) {
//         await request();
//     }
//         .then((nfts: INftOwnerCollection) => {
//         if (!nfts.result) return;
//         loaded.value = true;

//         nfts.result = nfts?.result.map((result: any) => verifyMetadata(result));
//     })
//         .catch((e: Error) => console.log("useNftBalance: " + e));
// }
