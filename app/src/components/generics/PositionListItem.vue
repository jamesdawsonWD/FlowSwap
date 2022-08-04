<template>
    <div class="position-list-item" @click="assetSelected(title)">
        <h4>{{ title }}</h4>
    </div>
</template>

<script setup lang="ts">
import { AssetInfo } from '@/types';
import SelectAssetButton from '@/components/generics/SelectAssetButton.vue';

const emit = defineEmits(['assetSelected', 'update:modelValue']);
const props = defineProps<{
    title: string;
}>();

const assetSelected = (asset: string) => {
    emit('assetSelected', asset);
};
const updateValue = (event: any) => {
    emit('update:modelValue', event.target.value);
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import '@/styles';

.position-list-item {
    position: relative;
    display: flex;

    @include list-item;
    transition: 0.15s;
    &:hover {
        cursor: pointer;
        background-color: var(--first-shade);

        h4 {
            color: var(--background-color);
        }
    }
    .select-button {
        position: absolute;
        right: 20px;
        top: 0;
        bottom: 0;
        margin: auto;
        height: 50px;
    }
}
</style>
