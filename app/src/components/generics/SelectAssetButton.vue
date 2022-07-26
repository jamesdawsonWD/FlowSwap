<template>
    <div class="select-asset-button" @click="displaySelectAsset()">
        <AssetImageName :asset="asset" />
        <img
            v-svg-inline
            class="down-caret"
            src="@/assets/svg/down-caret.svg"
            alt="Down Caret"
        />
    </div>
</template>

<script setup lang="ts">
import AssetImageName from '@/components/generics/AssetImageName.vue';
import { AssetInfo, ModalTypes } from '@/types';
import { useUi } from '@/store/ui';
const ui = useUi();

defineProps<{ asset: AssetInfo }>();
const emit = defineEmits(['selected']);

const displaySelectAsset = () => {
    ui.openModal(ModalTypes.AssetList, callback);
};

const callback = (asset: AssetInfo) => {
    emit('selected', asset);
    ui.closeModal();
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
@import '@/styles';

.select-asset-button {
    padding: 10px !important;
    border-radius: 25px;
    background: var(--background-main);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
    .down-caret {
        margin-left: 5px;
    }

    &:hover {
        cursor: pointer;
        background: var(--third-shade);

        .asset-image-name > h4 {
            color: white;
        }

        @include box-shadow();
    }
}
</style>
