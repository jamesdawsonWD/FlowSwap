<template>
  <div class="verticle-box-transition">
    <div class="container">
      <div class="segment segment-1"></div>
      <div class="segment segment-2"></div>
      <div class="segment segment-3"></div>
      <div class="segment segment-4"></div>
      <div class="segment segment-5"></div>
      <div class="segment segment-6"></div>
      <div class="segment segment-7"></div>
      <div class="segment segment-8"></div>
      <div class="segment segment-9"></div>
      <div class="segment segment-0"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "@/styles";

.verticle-box-transition {
  position: absolute;
  height: 100vh;
  width: 100vw;

  top: 0;
  left: 0;
  z-index: 10000;
  .container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  @keyframes slideIn {
    from {
      left: -110vw;
    }
    to {
      left: 0;
    }
  }

  .segment-0 {
    top: 0;
    animation: slideIn 0.8s ease-in-out 0s 12 forwards;
    animation-iteration-count: 1;
  }
  .segment {
    background: var(--first-shade);
    position: absolute;
    height: 10%;
    width: 110%;
    left: -110vw;
  }
  @for $i from 1 through 10 {
    .segment-#{$i} {
      top: $i * 10%;

      animation: slideIn 0.8s ease-in-out #{$i * 0.1}s 12 forwards;
      animation-iteration-count: 1;
    }
  }
}
</style>
