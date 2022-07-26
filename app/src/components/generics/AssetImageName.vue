<template>
    <div class="asset-image-name">
        <div v-if="asset.symbol == 'fMATIC'">
            <img
                v-svg-inline
                class="icon"
                src="@/assets/svg/polygon-matic-logo.svg"
                alt="Polygon Matic Logo"
            />
        </div>
        <div v-else-if="asset.symbol == 'fUSDCx'">
            <img
                v-svg-inline
                class="icon"
                src="@/assets/svg/usdc.svg"
                alt="USDC Logo"
            />
        </div>
        <div v-else-if="asset.symbol == 'fTUSDx'">
            <img
                v-svg-inline
                class="icon"
                src="@/assets/svg/trueusd-tusd-logo.svg"
                alt="TUSD Logo"
            />
        </div>
        <div v-else-if="asset.symbol == 'fDaix'">
            <img
                v-svg-inline
                class="icon"
                src="@/assets/svg/dai.svg"
                alt="DAI Logo"
            />
        </div>
        <div v-else>
            <img
                v-svg-inline
                class="icon"
                src="@/assets/svg/website.svg"
                alt="Unkown logo"
            />
        </div>
        <h4>{{ asset.symbol }}</h4>
    </div>
</template>

<script setup lang="ts">
import { AssetInfo } from '@/types';

defineProps<{ asset: AssetInfo }>();
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import '@/styles';

.asset-image-name {
    display: flex;
    justify-content: space-between;
    align-items: center;
    h4 {
        margin-left: 5px;
    }
    .icon {
        height: 30px;
    }
}
</style>
