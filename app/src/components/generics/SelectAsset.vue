<template>
    <div class="form-row select-asset">
        <label>{{ label }}</label>
        <input :value="modelValue" placeholder="0.00" @input="updateValue" />
        <SelectAssetButton
            :asset="asset"
            class="select-button"
            @selected="assetSelected($event)"
        />
    </div>
</template>

<script setup lang="ts">
import { AssetInfo } from '@/types';
import SelectAssetButton from '@/components/generics/SelectAssetButton.vue';

const emit = defineEmits(['assetSelected', 'update:modelValue']);
const props = defineProps<{
    asset: AssetInfo;
    modelValue: any;
    label: string;
}>();

const assetSelected = (asset: AssetInfo) => {
    emit('assetSelected', asset);
};
const updateValue = (event: any) => {
    emit('update:modelValue', event.target.value);
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import '@/styles';

.select-asset {
    position: relative;
    display: flex;

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
