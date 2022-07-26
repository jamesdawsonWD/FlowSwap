<template>
    <div class="swap-view">
        <Box class="swap-container">
            <div class="swap-component">
                <h3>Pool</h3>
                <SelectAsset
                    :asset="(from as AssetInfo)"
                    label="from"
                    v-model="amount0"
                    @asset-selected="updateFrom($event)"
                />
                <img
                    v-svg-inline
                    class="icon"
                    src="@/assets/svg/down-arrow.svg"
                    alt="Down Caret"
                />
                <SelectAsset
                    :asset="(to as AssetInfo)"
                    label="to"
                    v-model="amount1"
                    @asset-selected="updateTo($event)"
                />
                <div class="time-frame">
                    <h4>Time Frame</h4>
                    <div class="button-list">
                        <Button
                            title="per hour"
                            @clicked="timeFrame = 'hour'"
                            :button-style="
                                timeFrame == 'hour'
                                    ? 'sm-basic-dark'
                                    : 'sm-basic-light'
                            "
                        />
                        <Button
                            title="per day"
                            @clicked="timeFrame = 'day'"
                            :button-style="
                                timeFrame == 'day'
                                    ? 'sm-basic-dark'
                                    : 'sm-basic-light'
                            "
                        />
                        <Button
                            title="per week"
                            @clicked="timeFrame = 'week'"
                            :button-style="
                                timeFrame == 'week'
                                    ? 'sm-basic-dark'
                                    : 'sm-basic-light'
                            "
                        />
                        <Button
                            title="per month"
                            @clicked="timeFrame = 'month'"
                            :button-style="
                                timeFrame == 'month'
                                    ? 'sm-basic-dark'
                                    : 'sm-basic-light'
                            "
                        />
                    </div>
                </div>
                <Button title="Swirl" class="submit" />
            </div>
        </Box>
    </div>
</template>

<script setup lang="ts">
import SelectAsset from '@/components/generics/SelectAsset.vue';
import Box from '@/components/generics/Box.vue';
import Button from '@/components/generics/Button.vue';
import { Ref, ref, watch } from 'vue';
import { AssetInfo, ModalTypes } from '@/types';

const from: Ref<AssetInfo | null> = ref(null);
const amount0 = ref('');
const amount1 = ref('');
const timeFrame = ref('hour');
const to: Ref<AssetInfo | null> = ref(null);

from.value = {
    name: 'fUSDCx',
    symbol: 'fUSDCx',
    logo: 'usdc.svg',
};

to.value = {
    name: 'fMATIC',
    symbol: 'fMATIC',
    logo: 'usdc.svg',
};
const updateFrom = (asset: AssetInfo) => {
    from.value = asset;
};
const updateTo = (asset: AssetInfo) => {
    to.value = asset;
};
watch(amount0, (value) => {
    console.log(value);
});
</script>
<style lang="scss">
@import '@/styles';

.swap-view {
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;

    .swap-container {
        position: relative;
        z-index: 101;
    }
    .swap-component {
        position: relative;
        display: flex;
        top: 0;
        width: 30vw;
        flex-direction: column;
        justify-content: start;
        overflow: hidden;
        align-items: center;
        border-radius: 12px;
        background: var(--background-color);
        .time-frame {
            width: 100%;
            display: flex;
            flex-direction: column;
            margin-top: 40px;
            .button-list {
                display: flex;
                justify-content: space-between;
                margin-top: 5px;
                & :not(:last-child) {
                    margin-right: 20px;
                }
            }
        }
        img {
            max-width: 100%;
            max-height: 100%;
        }

        .submit {
            margin-top: 50px;
        }

        .icon {
            margin-top: 10px;
        }
    }
}
</style>
