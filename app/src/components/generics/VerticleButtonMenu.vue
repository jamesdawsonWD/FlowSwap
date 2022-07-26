<template>
    <div class="verticle-button-menu">
        <div class="button-container">
            <Button
                v-for="(title, index) in titles"
                @clicked="$emit('selected', title)"
                :title="title"
                :button-style="
                    selected == title
                        ? 'sm-basic-pink'
                        : 'sm-basic-dark-hover-main'
                "
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/generics/Button.vue';

defineProps<{ titles: string[]; selected: string }>();
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import '@/styles';

.verticle-button-menu {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 300px;
    .button-container {
        border-radius: 25px;
        @include box-shadow;
        & :last-child {
            border-radius: 0 25px 25px 0;
        }

        & :first-child {
            border-radius: 25px 0 0 25px;
        }
    }
    button {
        width: 100px;
        border-radius: 0;
    }
}
</style>
