import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
// import NftBalance from '../views/NftBalance.vue';
// import NftItem from '../views/NftItem.vue';
// import NftCollection from '../views/NftCollection.vue';
import Swap from '../views/Swap.vue';
import Pool from '../views/Pool.vue';

import { useUi } from '@/store/ui';
function timeout(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'LandingPage',
        component: Swap,
        meta: {
            title: 'SwirlPool - Swirl',
        },
    },
    {
        path: '/pool',
        name: 'Pool',
        component: Pool,
        meta: {
            title: 'SwirlPool - Pool',
        },
    },
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

router.beforeEach(async (to, from) => {
    // const ui = useUi();
    document.title = to.meta.title as string;
    // if (to.name == 'LandingPage' || (to.fullPath == '/' && ui.getDarkMode)) {
    //     ui.darkModeOff();
    // }
    // console.log(to, from);
    // if (from.path == '/' && from.matched.length != 0) {
    //     ui.startTransition();
    //     await timeout(2000);
    //     ui.stopTransition();
    //     ui.darkModeOn();
    // }
});

export default router;
