<template>
    <div class="scrollable-list">
        <div class="container">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/styles';

.scrollable-list {
    display: flex;
    padding: 10px 10px;
    height: 100%;
    .container {
        overflow-y: scroll;
        overflow-x: hidden;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
}
</style>
