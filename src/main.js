import { createApp } from "vue";
import "./style.css";
import "./style_help_section.css";
import App from "./App.vue";
import analyticsPlugin from "./plugins/analytics.js";

const app = createApp(App);

// Install analytics plugin
app.use(analyticsPlugin);

app.mount("#app");
