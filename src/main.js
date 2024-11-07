import { createApp, h } from 'vue';
import App from './App.vue';
import router from './router/index';
import { createPinia } from 'pinia';

import './assets/css/style.css';

const app = createApp({ render: () => h(App) });

app.use(createPinia());
app.use(router);

app.mount('#app');
