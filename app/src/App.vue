<template>
    <div
        id="app"
        :class="ui.getDarkMode ? 'darkMode' : ''"
        :style="{ overflow: ui.getIsModalAwake ? 'hidden' : 'initial' }"
    >
        <Spiral class="canvas" />
        <Header :class="ui.getIsModalAwake ? 'blur' : ''" />
        <div class="router-wrapper" >
            <router-view
                class="router"
                
            />
        </div>
        <transition name="fade" mode="out-in">
            <Modal v-if="ui.getIsModalAwake" @close="ui.closeModal()" />
        </transition>

        <VerticleBox v-if="ui.getTransition" />
    </div>
</template>

<script lang="ts" setup>
import Modal from '@/components/modals/Modal.vue';
import Spiral from '@/components/canvas/Spiral.vue';
import Header from '@/components/Header.vue';
import VerticleBox from '@/components/transitions/VerticleBox.vue';
import { useUi } from '@/store/ui';
import { useSwirlPool } from './hooks/swirlPool/useSwirlPool';
const ui = useUi();
</script>

<style lang="scss">
.canvas {
    position: absolute;
    z-index: 100;
}
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100%;
    position: relative;

    /* Increase/decrease this value for cross-browser compatibility */
    /* So the width will be 100% + 17px */
}

.darkMode {
    background: var(--first-shade);
}
.router-wrapper {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
    padding-top: 20em;
    height: 100vh;
}
.blur {
    filter: blur(8px);
    -webkit-filter: blur(8px);
}
</style>
