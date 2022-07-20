<template>
    <div class="search-bar">
        <img v-svg-inline src="@/assets/svg/search.svg" class="search-icon" />
        <input
            @focus="searchFocused = true"
            @blur="searchFocused = false"
            placeHolder="0x0c2E57EFddbA8c768147D1fdF9176a0A6EBd5d83"
            v-on:keyup.enter="$emit('selected', address)"
            v-model="address"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const searchFocused = false;
const address = ref('');
defineEmits(['selected']);
</script>
<style scoped lang="scss">
@import '@/styles';
.search-bar {
    position: relative;
    display: flex;
    align-items: center;

    input {
        width: 100%;
        border-radius: 8px;
        background: var(--background-color);
        box-sizing: border-box;
        padding: 10px;
        padding-left: 75px;
        color: var(--second-shade);
        border: 1px solid var(--background-color);
        @include FS_Super_Bold;
        font-size: 13pt;
        max-width: 700px;
        transition: 0.2s;
        &:active,
        &:focus {
            -webkit-box-shadow: 0px 0px 10px 1px rgba(0, 0, 0, 0.68);
            box-shadow: 0px 0px 10px 1px rgba(0, 0, 0, 0.68);
            border: 1px solid var(--first-shade);
        }
    }
    .search-icon {
        position: absolute;
        left: 10px;
        height: 20px;
        fill: var(--second-shade) !important;
    }
}
</style>
