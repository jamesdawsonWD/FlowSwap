// event.js
import { onMounted, onUnmounted } from 'vue';

export function useEventListener(
    target: Window | Document | HTMLElement,
    event: string,
    callback: EventListenerOrEventListenerObject
) {
    onMounted(() =>
        target.addEventListener(
            event,
            callback as EventListenerOrEventListenerObject
        )
    );
    onUnmounted(() =>
        target.removeEventListener(
            event,
            callback as EventListenerOrEventListenerObject
        )
    );
}
