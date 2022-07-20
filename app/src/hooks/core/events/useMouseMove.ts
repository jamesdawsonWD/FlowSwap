// mouse.js
import { ref } from 'vue';
import { useEventListener } from '../events/userEventListener';

export function useMouseMove() {
    const x = ref(0);
    const y = ref(0);

    useEventListener(window, 'mousemove', (event: Event) => {
        const mouse = event as MouseEvent;
        x.value = mouse.x;
        y.value = mouse.y;
    });

    return { x, y };
}
