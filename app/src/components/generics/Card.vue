<template>
    <Box>
        <div v-if="image" slot="boxContent" class="card">
            <img :src="props.image" />
        </div>
    </Box>
</template>

<script setup lang="ts">
import Box from '@/components/generics/Box.vue';
const props = defineProps<{ image: string }>();
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import '@/styles';

.card {
    position: relative;
    display: flex;
    height: 300px;
    width: 300px;
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
