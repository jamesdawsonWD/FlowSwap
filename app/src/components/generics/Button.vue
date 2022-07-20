<template>
  <button
    v-if="buttonStyle == 'submit'"
    class="button"
    type="button"
    :class="[buttonStyle == 'submit' ? 'submit' : '']"
    @click="$emit('clicked')"
    v-on:click.prevent
    :disabled="disabled"
  >
    {{ title }}
  </button>
  <button
    v-else
    class="button"
    type="button"
    :class="[buttonStyle, disabled ? 'disabled' : '']"
    @click="$emit('clicked')"
    v-on:click.prevent
    :disabled="disabled"
  >
    {{ title }}
  </button>
</template>

<script setup lang="ts">
import Box from "@/components/generics/Box.vue";
const props = defineProps<{ title: string; buttonStyle: string }>();
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "@/styles";
.button {
  margin: 40px 0 10px 0;
  border: none;
  padding: 15px;
  border-radius: 12px;
  background: var(--first-shade);
  transition: 0.2s;
  @include Lobster_Bold;
  font-size: 25pt;
  width: 100%;
  color: var(--background-color);
  font-weight: 700;
  outline: none;
  &:hover {
    cursor: pointer;
  }
}
.submit {
  background: var(--main) !important;
  @include FS_Bold;

  width: 100%;

  &:hover {
    transform: translateY(0px);
  }
}
</style>
