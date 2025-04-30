import { createApp, h } from "vue";
import App from "./App.vue";
import router from "./router/index";
import { createPinia } from "pinia";

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";

import "./assets/css/style.css";

library.add(fas);

const app = createApp({ render: () => h(App) });

app.use(createPinia());
app.component("fa", FontAwesomeIcon);
app.use(router);

app.mount("#app");
