<template>
  <div class="project-info">
    <img :src="info.image" />
    <article>
      <header>
        <h2>{{ info.title }}</h2>
        <div class="nav">
          <a
            class="social-media"
            v-if="info.twitter"
            :href="info.twitter"
            target="_blank"
          >
            <img
              v-svg-inline
              class="icon"
              src="@/assets/svg/twitter.svg"
              alt="Twitter"
            />
          </a>
          <a
            class="social-media"
            v-if="info.github"
            :href="info.github"
            target="_blank"
          >
            <img
              v-svg-inline
              class="icon"
              src="@/assets/svg/github.svg"
              alt="Github"
            />
          </a>
          <a class="social-media" :href="info.url" target="_blank">
            <img
              v-svg-inline
              class="icon"
              src="@/assets/svg/website.svg"
              alt="Website"
            />
          </a>
        </div>
      </header>
      <div class="mobile-nav">
        <a
          class="social-media"
          v-if="info.twitter"
          :href="info.twitter"
          target="_blank"
        >
          <img
            v-svg-inline
            class="icon"
            src="@/assets/svg/twitter.svg"
            alt="Twitter"
          />
        </a>
        <a
          class="social-media"
          v-if="info.github"
          :href="info.github"
          target="_blank"
        >
          <img
            v-svg-inline
            class="icon"
            src="@/assets/svg/github.svg"
            alt="Github"
          />
        </a>
        <a class="social-media" :href="info.url" target="_blank">
          <img
            v-svg-inline
            class="icon"
            src="@/assets/svg/website.svg"
            alt="Website"
          />
        </a>
      </div>
      <p>{{ info.description }}</p>
      <div class="name-value">
        <h4>Website:</h4>
        <a :href="info.url" target="_blank">{{ info.url }}</a>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { Project } from "@/types";
import { TextBox } from "@/components/generics/TextBox.vue";
defineProps<{ info: Project }>();
</script>

<style scoped lang="scss">
@import "@/styles";

.project-info {
  border-radius: inherit;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: relative;
  overflow: auto;
  height: 100%;

  h2 {
    color: var(--background-color);
  }
  p {
    color: var(--third-shade);
  }

  a {
    color: var(--main);
  }
  img {
    width: 100%;
    height: 60%;
  }

  article {
    padding: 20px;

    header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 50px;
      margin-top: 10px;
    }

    .mobile-nav {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      margin-bottom: 20px;
      .social-media {
        @include breakpoint(mobileonly) {
          display: block;
        }
        @include breakpoint(tablet) {
          display: block;
        }
        @include breakpoint(phablet) {
          display: none;
        }

        @include breakpoint(laptop) {
          display: none;
        }
        @include breakpoint(desktop) {
          display: none;
        }
        .icon {
          fill: var(--background-color);
          transition: 0.5s;
          &:hover {
            cursor: pointer;
            fill: var(--main) !important;
          }
        }

        & > * {
          padding: 5px;
          padding-left: 0px;
          height: 25px;
        }

        &:not(:first-child) {
          margin-left: 20px;
        } 
      }
    }
    .nav {
      display: flex;
      justify-content: center;
      align-items: center;

      .social-media {
        @include breakpoint(mobileonly) {
          display: none;
        }
        @include breakpoint(tablet) {
          display: none;
        }
        @include breakpoint(phablet) {
          display: block;
        }

        @include breakpoint(laptop) {
          display: block;
        }
        @include breakpoint(desktop) {
          display: block;
        }
        .icon {
          fill: var(--background-color);
          transition: 0.5s;
          &:hover {
            cursor: pointer;
            fill: var(--main) !important;
          }
        }

        & > * {
          padding: 5px;
          height: 25px;
          margin-left: 20px;
        }
      }
    }
  }
}
</style>
