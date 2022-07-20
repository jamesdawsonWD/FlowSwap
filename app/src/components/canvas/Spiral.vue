<template>
    <canvas ref="canvasRef"></canvas>
</template>

<script setup lang="ts">
import { onMounted, ref, defineEmits } from 'vue';
import { Spiral } from './spiral';
const emit = defineEmits(['canvasMounted']);
const canvasRef = ref<HTMLCanvasElement | null>(null);
// convert width and height to ref also if reactive

onMounted(() => {
    new Spiral(canvasRef.value as HTMLCanvasElement);
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import '@/styles';

.card {
    position: relative;
    display: flex;
    height: 300px;
    width: 300px;
    top: 0;
    flex-direction: column;
    justify-content: start;
    overflow: hidden;
    align-items: center;
    border-radius: 12px;
    img {
        max-width: 100%;
        max-height: 100%;
    }
}
</style>
