<script setup lang="ts">
import VanillaTilt from "vanilla-tilt";
import { onMounted, Ref } from "vue";
import { ref } from "vue";
const props = defineProps<{ options: Object; parallax?: false }>();
const tiltRef = ref<HTMLElement | null>(null);
onMounted(() => {
  VanillaTilt.init(tiltRef.value as HTMLElement, props.options);
});
</script>

<template>
  <div class="tilt" :class="parallax ? 'preserve' : ''" id="tiltMe" ref="tiltRef">
    <slot></slot>
  </div>
</template>

<style>
.preserve {
  transform-style: preserve-3d;
}


</style>
