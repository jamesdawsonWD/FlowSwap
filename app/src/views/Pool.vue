<template>
    <div class="pool">
        <Box class="swap-container">
            <PoolsOverview
                v-if="showOverview"
                @new-position="toggleShowOverview()"
            />
            <PoolsNewPosition @back-selected="toggleShowOverview()" v-else />
        </Box>
    </div>
</template>

<script setup lang="ts">
import PoolsOverview from '@/components/views/PoolsOverview.vue';
import PoolsNewPosition from '@/components/views/PoolsNewPosition.vue';
import Box from '@/components/generics/Box.vue';
import Button from '@/components/generics/Button.vue';
import { Ref, ref, watch } from 'vue';
import { AssetInfo, ModalTypes } from '@/types';

const showOverview = ref(true);

const toggleShowOverview = () => {
    console.log('here');
    showOverview.value = !showOverview.value;
};
</script>
<style lang="scss">
@import '@/styles';

.pool {
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
    }
}
</style>
