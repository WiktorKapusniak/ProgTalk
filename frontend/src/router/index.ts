import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/home",
    component: () => import("../views/HomeView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    component: () => import("../views/ProfileView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/register",
    component: () => import("../views/RegisterView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) {
    return next("/login");
  }
  if ((to.path === "/login" || to.path === "/register") && token) {
    return next("/home");
  }
  next();
});
export default router;
