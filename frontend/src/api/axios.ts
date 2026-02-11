import axios from "axios";
import router from "../router";
import { useToast } from "vue-toastification";

const toast = useToast();
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");

      toast.error("Session expired. Please log in again.");

      router.push("/login");
    }

    return Promise.reject(error);
  },
);
