<template>
    <Box>
        <div class="swap-component">
            <h1>{{ title }}</h1>
            <div class="form-row" :class="[darkMode ? 'form-dark-mode' : '']">
                <label>Tokens per day</label>
                <input
                    v-model="email"
                    type="email"
                    :class="[error ? 'error' : '']"
                />
            </div>
            <div class="form-row" :class="[darkMode ? 'form-dark-mode' : '']">
                <label>From</label>
                <input
                    v-model="from"
                    :class="[error ? 'error' : '']"
                />
            </div>
            <div class="form-row" :class="[darkMode ? 'form-dark-mode' : '']">
                <label>To</label>
                <input
                    v-model="from"
                    :class="[error ? 'error' : '']"
                />
            </div>
            <Button title="Swap"/>
        </div>
    </Box>
</template>

<script setup lang="ts">
import Box from '@/components/generics/Box.vue';
import Button from '@/components/generics/Button.vue';
const props = defineProps<{ title: string }>();
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import '@/styles';

.swap-component {
    position: relative;
    display: flex;
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
