<template>
    <button
        v-if="buttonStyle == 'submit'"
        class="button"
        type="button"
        :class="[buttonStyle == 'submit' ? 'submit' : '']"
        @click="$emit('clicked')"
        v-on:click.prevent
    >
        {{ title }}
    </button>
    <button
        v-else
        class="button"
        type="button"
        :class="[buttonStyle]"
        @click="$emit('clicked')"
        v-on:click.prevent
    >
        {{ title }}
    </button>
</template>

<script setup lang="ts">
import Box from '@/components/generics/Box.vue';
const props = defineProps<{ title: string; buttonStyle: string }>();
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import '@/styles';
.button {
    border: none;
    padding: 15px;
    border-radius: 12px;
    transition: 0.2s;
    width: 100%;
    font-weight: 700;
    outline: none;
    &:hover {
        cursor: pointer;
    }
}

.sm-basic-dark {
    background: var(--third-shade);
    color: var(--background-color);
}

.sm-basic-light {
    color: var(--third-shade);

    &:hover {
        background: var(--third-shade);
        color: var(--background-color);
    }
}
.sm-basic-pink {
    background: var(--main);
    color: var(--background-color);
}
.sm-basic-dark-hover-main {
    background: var(--third-shade);
    color: var(--background-color);

    &:hover {
        color: var(--background-color);
        background: var(--main);
    }
}
.md-basic-pink {
    color: var(--third-shade);
    background: var(--main);
    font-size: 14pt;
    &:hover {
        color: var(--background-color);
    }
}

.lg-lobster-dark {
    @include Lobster_Bold;
    font-size: 20pt;
    background: var(--third-shade);
    color: var(--background-color);

    &:hover {
        background: var(--main) !important;
    }
}
.submit {
    background: var(--main) !important;
    @include Lobster_Bold;
    font-size: 25pt;
    width: 100%;
    color: var(--background-color);

    &:hover {
        transform: translateY(0px);
    }
}
</style>
