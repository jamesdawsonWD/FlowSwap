<template>
  <section class="footer-navigator">
    <div class="link left-link" @click="leftClicked()">
      <img
        v-svg-inline
        class="icon left-icon"
        src="@/assets/svg/down-arrow.svg"
        alt="example svg image"
      />
      <h2>{{ leftTitle }}</h2>
    </div>
    <div class="link right-link" @click="rightClicked()">
      <h2>{{ rightTitle }}</h2>
      <img
        v-svg-inline
        class="icon right-icon"
        src="@/assets/svg/down-arrow.svg"
        alt="example svg image"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import router from "@/router";
const props = defineProps<{
  leftTitle: string;
  leftLink: string;
  rightTitle: string;
  rightLink: string;
}>();

function leftClicked() {
  router.push(props.leftLink);
}

function rightClicked() {
  router.push(props.rightLink);
}
</script>

<style scoped lang="scss">
@import "@/styles";

.footer-navigator {
  width: 50%;
  bottom: 5;
  z-index: 500;
  display: flex;
  justify-content: space-between;
  padding: 20px;

  @include breakpoint(mobileonly) {
    width: 80%;
    margin-top: 50px;
  }
  @include breakpoint(tablet) {
    width: 80%;
    margin-top: 50px;
  }
  @include breakpoint(phablet) {
    width: 80%;
    margin-top: 100px;
  }

  @include breakpoint(laptop) {
    width: 90%;
  }
  @include breakpoint(desktop) {
    width: 90%;
  }
  .link {
    display: flex;
    align-items: center;
    h2 {
      transition: 0.5s;
      color: var(--background-color);
      @include Lobster_Bold;
      @include breakpoint(mobileonly) {
        font-size: 18pt;
      }
      @include breakpoint(tablet) {
        font-size: 18pt;
      }
      @include breakpoint(phablet) {
        font-size: 18pt;
      }

      @include breakpoint(laptop) {
        font-size: 25pt;
      }
      @include breakpoint(desktop) {
        font-size: 25pt;
      }
    }

    &:hover {
      cursor: pointer;

      h2 {
        color: var(--main);
      }

      .icon {
        fill: var(--main);
      }
    }

    .icon {
      transition: 0.5s;
      fill: var(--background-color);
    }
  }

  .left-icon {
    transform: rotate(90deg);
    margin-right: 20px;
  }

  .right-icon {
    transform: rotate(-90deg);
    margin-left: 20px;
  }
}
</style>
