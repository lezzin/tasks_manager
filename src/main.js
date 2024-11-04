import { createApp, h } from 'vue'
import './assets/css/style.css'
import App from './App.vue'
import router from './router/router'

createApp({ render: () => h(App) })
    .use(router)
    .mount('#app')
