<template>
    <div class="swap-view">
        <Swap class="swap" />
        <Spiral class="canvas" />
    </div>
</template>

<script setup lang="ts">
import Button from '@/components/generics/Button.vue';
import Swap from '@/components/views/Swap.vue';
import router from '../router';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Spiral from '@/components/canvas/Spiral.vue';
import { useEventListener } from '@/hooks/core/events/userEventListener';
import { useUi } from '@/store/ui';
const ui = useUi();
const whereToShow = ref(false);
const contactMeShow = ref(false);

function navigateTo(path: any) {
    router.push({ path });
}

function resetWhereTo() {
    whereToShow.value = false;
    contactMeShow.value = false;
}
onMounted(() => {
    if (!ui.getDarkMode) ui.darkModeOff();
});
</script>
<style lang="scss">
@import '@/styles';
.canvas {
    position: absolute;
    z-index: 100;
}
.swap-view {
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;

    .swap {
        position: relative;
        z-index: 101;
    }
    .where-to {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        @include breakpoint(mobileonly) {
            display: flex !important;
        }
        @include breakpoint(tablet) {
            display: flex !important;
        }
        @include breakpoint(phablet) {
            display: flex !important;
        }

        @include breakpoint(laptop) {
            display: none !important;
        }
        @include breakpoint(desktop) {
            display: none !important;
        }
    }
    h1 {
        text-align: center;
        font-size: 300pt;
        @include RM_Regular;

        @include breakpoint(mobileonly) {
            font-size: 200pt;
        }
        @include breakpoint(tablet) {
            font-size: 270pt;
        }
        @include breakpoint(phablet) {
            font-size: 270pt;
        }

        @include breakpoint(laptop) {
            font-size: 300pt;
        }
        @include breakpoint(desktop) {
            font-size: 300pt;
        }
    }

    .mobile-button {
        position: fixed;
        display: flex;
        justify-content: center;
        align-items: center;
        bottom: 0;
        width: 100vw;
        @include breakpoint(mobileonly) {
            display: flex !important;
        }
        @include breakpoint(tablet) {
            display: flex !important;
        }
        @include breakpoint(phablet) {
            display: flex !important;
        }

        @include breakpoint(laptop) {
            display: none !important;
        }
        @include breakpoint(desktop) {
            display: none !important;
        }
        button {
            width: 90% !important;
            text-align: center;
        }
    }
    .buttons {
        position: fixed;
        bottom: 0;
        width: 100vw;
        left: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        @include breakpoint(mobileonly) {
            display: none !important;
        }
        @include breakpoint(tablet) {
            display: none !important;
        }
        @include breakpoint(phablet) {
            display: none !important;
        }

        @include breakpoint(laptop) {
            display: flex !important;
        }
        @include breakpoint(desktop) {
            display: flex !important;
        }
        & > :not(:last-child) {
            margin-right: 20px;
        }
    }
}
</style>
