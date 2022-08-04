<template>
    <div class="pools-new-position">
        <header>
            <container @click="$emit('backSelected')">
                <img
                    v-svg-inline
                    class="icon"
                    src="@/assets/svg/left-arrow.svg"
                    alt="Back to Pool"
                />
            </container>
            <h3>Add Liquidity</h3>
            <img
                v-svg-inline
                class="icon"
                src="@/assets/svg/settings.svg"
                alt="Back to Pool"
            />
        </header>
        <h4>Select Pair</h4>
        <section>
            <SelectAsset
                :asset="(asset0 as AssetInfo)"
                label="from"
                v-model="amount0"
                @asset-selected="setAsset0($event)"
            />
            <SelectAsset
                :asset="(asset1 as AssetInfo)"
                label="from"
                v-model="amount0"
                @asset-selected="setAsset1($event)"
            />
        </section>
        <Button title="Provide" class="submit" />
    </div>
</template>

<script setup lang="ts">
import Button from '@/components/generics/Button.vue';
import SelectAsset from '@/components/generics/SelectAsset.vue';
import { useSwirlPool } from '@/hooks/swirlPool/useSwirlPool';
import { useUserStore } from '@/store/user';
import { AssetInfo } from '@/types';
import { ref, watch } from 'vue';
const user = useUserStore();
const provider = ref(user.getProvider);
const swirlPool = useSwirlPool(provider);

const assetList: AssetInfo[] = [
    {
        name: 'Fake Matic',
        symbol: 'fMATIC',
        logo: 'polygon-matic-logo.svg',
    },
    {
        name: 'Fake USDCx',
        symbol: 'fUSDCx',
        logo: 'usdc.svg',
    },
    {
        name: 'Fake TUSDx',
        symbol: 'fTUSDx',
        logo: 'trueusd-tusd-logo.svg',
    },
    {
        name: 'Fake Daix',
        symbol: 'fDaix',
        logo: 'dai.svg',
    },
];

const asset0 = ref(assetList[0]);
const asset1 = ref(assetList[1]);
const amount0 = ref('');
const amount1 = ref('');

const setAsset0 = (asset: AssetInfo) => (asset0.value = asset);
const setAsset1 = (asset: AssetInfo) => (asset1.value = asset);

watch(
    () => user.getProvider,
    (value) => {
        console.log(value);
        provider.value = value;
    }
);
</script>

<style scoped lang="scss">
@import '@/styles';

.pools-new-position {
    width: 900px;
    & > header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        border-bottom: 1px solid var(--second-shade);
        padding: 1.5rem 0;

        .icon {
            height: 1.3rem;
            width: 1.3rem;

            &:hover {
                cursor: pointer;
            }
        }
    }

    & > section {
        display: flex;

        & > :first-child {
            margin-right: 1rem;
        }
    }

    .submit {
        margin-top: 2rem;
    }
}
</style>
