<template>
    <div class="pools-overview">
        <header>
            <h3>Pools Overview</h3>
            <Button title="+ New Position" buttonStyle="sm-basic-pink" @click="$emit('newPosition')" />
        </header>
        <ScrollableList class="positions" v-if="assetList.length">
            <div>
                <PositionListItem
                    v-for="(asset, index) in assetList"
                    :title="asset.name"
                />
            </div>
        </ScrollableList>
        <div class="no-positions" v-else>
            <h4>Your active positions will appear here.</h4>
        </div>
    </div>
</template>

<script setup lang="ts">
import Box from '@/components/generics/Box.vue';
import Button from '@/components/generics/Button.vue';
import PositionListItem from '@/components/generics/PositionListItem.vue';
import ScrollableList from '@/components/generics/ScrollableList.vue';
import { AssetInfo } from '@/types';

const assetList: AssetInfo[] = [];
</script>

<style scoped lang="scss">
@import '@/styles';

.pools-overview {
    width: 900px;
    & > header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
    }

    .positions,
    .no-positions {
        height: 300px;
        @include border-radius;
        background: var(--third-shade);
        margin-bottom: 25px;
    }

    .no-positions {
        display: flex;
        justify-content: center;
        align-items: center;

        h4 {
            color: var(--second-shade);
        }
    }
}
</style>
