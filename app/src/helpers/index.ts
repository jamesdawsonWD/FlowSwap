import { computed } from 'vue'
export const withState = (target: any, state: any) => {
    Object.keys(state).forEach(prop => {
        target[prop] = computed(() => state[prop])
    })
    return target
}
