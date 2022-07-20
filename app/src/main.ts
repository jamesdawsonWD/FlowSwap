import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@/styles/index.scss';
import { createPinia } from 'pinia'

// @ts-ignore
import VueSvgInlinePlugin from 'vue-svg-inline-plugin';

// import polyfills for IE if you want to support it
import 'vue-svg-inline-plugin/src/polyfills';

const app = createApp(App);

app.use(router);
app.use(createPinia())
// use Vue plugin without options
app.use(VueSvgInlinePlugin);

// use Vue plugin with options
app.use(VueSvgInlinePlugin, {
    attributes: {
        data: ['src'],
        remove: ['alt'],
    },
});
app.mount('#app');
