<template>
    <div class="box">
        <div class="slots">
            <slot class="slot"></slot>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/styles';

.box {
    position: relative;
    display: flex;
    background-color: var(--background-color);
    top: 0;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    align-items: center;
    border-radius: 12px;
    padding: 20px;
    @include box-shadow();

    .names {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        & div {
            width: 100%;
            height: 60px;
            display: flex;
            align-items: center;
            @include FS_Bold;

            justify-content: center;
            font-size: var(--lg-font);
            font-weight: 700;
            color: var(--main-font);
        }

        .inactive {
            background: var(--sub-foreground-color);
            color: var(--main-secondary);

            &:hover {
                cursor: pointer;
                color: var(--main-font);
            }
        }
    }

    .slots {
        width: 100%;

        & > * {
            padding: 20px;
        }
    }
}
</style>
