<template>
  <div class="image-controller">
    <div class="container">
      <div class="image-container" :style="{ width: imageWidth, height: imageHeight }">
        <slot ref="imageContainer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
const imageContainer = ref<HTMLElement | null>(null);
const props = defineProps<{ image: string, height: string }>();
const imageWidth = ref("");
function imageWidthCss(): string {
  if (imageContainer && imageContainer.value) {
    return imageContainer.value.clientWidth + "px !important";
  }
  return "";
}
onMounted(() => (imageWidth.value = imageWidthCss()));
</script>

<style scoped lang="scss">
@import "@/styles";
.image-controller {
  cursor: pointer;
  max-height: 1000px;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  .container {
    min-height: inherit;
    width: 100%;
    position: relative;
    display: block;
    overflow: hidden;
    border-radius: inherit;
    .image-container {
      flex-grow: 2;
      max-height: 1000px;
      -webkit-box-align: center;
      align-items: center;
      display: flex;
      -webkit-box-pack: center;
      justify-content: center;
      max-height: 100%;
      max-width: 100%;
      overflow: hidden;
      position: relative;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }

    img {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      border-radius: initial;
      object-fit: contain;
    }
  }
}
</style>
