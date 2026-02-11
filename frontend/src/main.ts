import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./styles/main.scss";
import "./api/axios";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

const app = createApp(App);
app.use(router);
app.use(Toast, {
  position: "top-center",
  timeout: 2000,
  closeOnClick: true,
});
app.mount("#app");
