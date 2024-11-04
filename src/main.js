import { createApp, h } from 'vue'
import './assets/css/style.css'
import App from './App.vue'
import router from './router/router'
import { createPinia } from 'pinia'

createApp({ render: () => h(App) })
    .use(createPinia())
    .use(router)
    .mount('#app')
