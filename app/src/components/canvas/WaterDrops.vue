<template>
  <canvas ref="canvasRef"></canvas>
</template>

<script setup lang="ts">
import { onMounted, ref, defineEmits } from "vue";
import { WaterDrops } from "../canvas/water-drops.ts";
const emit = defineEmits(["canvasMounted"]);
const canvasRef = ref<HTMLCanvasElement | null>(null);
// convert width and height to ref also if reactive

onMounted(() => {
  new WaterDrops(canvasRef.value);
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "@/styles";


</style>
