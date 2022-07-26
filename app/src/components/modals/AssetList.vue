<template>
    <div class="asset-list">
        <h2>Select an asset</h2>
        <article
            class="asset"
            v-for="(asset, index) in assetList"
            @click="assetSelected(asset)"
        >
            <img
                v-svg-inline
                class="icon"
                v-if="asset.logo"
                :src="require(`@/assets/svg/${asset.logo}`)"
                :alt="`${asset.name} Logo`"
            />
            <div class="details">
                <h4>{{ asset.symbol }}</h4>
                <h5>{{ asset.name }}</h5>
            </div>
        </article>
    </div>
</template>

<script setup lang="ts">
import { AssetInfo, GenericCallback } from '@/types';
const props = defineProps<{ callback: GenericCallback | undefined }>();

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

const assetSelected = (asset: AssetInfo) => {
    console.log(asset);
    if (props.callback) props.callback(asset);
};
</script>

<style scoped lang="scss">
@import '@/styles';

.asset-list {
    width: 25vw;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;

    h2 {
        color: var(--background-color);
        text-align: center;
        margin-top: 30px;
        margin-bottom: 15px;
    }

    .asset {
        padding: 15px;
        height: 50px;
        width: 100%;
        display: flex;
        justify-content: flex-start;
        align-items: center;

        &:hover {
            background: var(--third-shade);
            cursor: pointer;
        }

        .details {
            height: 100%;
            display: flex;
            flex-direction: column;
            margin-left: 20px;
            justify-content: center;
            align-items: flex-start;

            h5 {
                color: var(--second-shade);
            }

            h4 {
                color: var(--background-color);
            }
        }

        .icon {
            height: 50px;
            width: 50px;
        }
    }
}
</style>
