<template>
    <Box>
        <div slot="boxContent" class="card">
            <header>
                <h2 class="title">{{ title }}</h2>
            </header>
            <p v-if="!isLink">{{ text }}</p>
            <a v-if="isLink">{{ text }}</a>
        </div>
    </Box>
</template>

<script setup lang="ts">
import Box from '@/components/generics/Box.vue';
defineProps<{ text: string; title?: string, isLink: boolean }>();
console.log('here');
</script>

<style scoped lang="scss">
@import '@/styles';

.card {
    position: relative;
    display: flex;
    top: 0;
    flex-direction: column;
    justify-content: start;
    overflow: hidden;
    align-items: center;
    border-radius: 12px;
    text-align: left;
    header {
        width: 100%;
        .title {
            text-align: left;
            width: 100%;
            margin-bottom: 20px;
        }
    }
}
</style>
