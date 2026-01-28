import { connectSocket } from "@/composables/socket";
import axios from "axios";
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/register",
    component: () => import("../views/RegisterView.vue"),
  },
  {
    path: "/login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/",
    component: () => import("../layouts/MainLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "home",
        component: () => import("../views/HomeView.vue"),
      },
      {
        path: "profile",
        component: () => import("../views/ProfileView.vue"),
      },

      {
        path: "topic/:id",
        component: () => import("../views/TopicView.vue"),
      },
      {
        path: "create-topic",
        component: () => import("../views/CreateTopicView.vue"),
      },
      {
        path: "topic/:id/create-subtopic",
        component: () => import("../views/CreateSubtopicView.vue"),
      },
      {
        path: "topic/:id/create-post",
        component: () => import("../views/CreatePostView.vue"),
      },
      {
        path: "topic/:id/edit-post/:postId",
        component: () => import("../views/CreatePostView.vue"),
      },
      {
        path: "topic/:id/create-post/:parentPostId",
        component: () => import("../views/CreatePostView.vue"),
      },
      {
        path: "adminpanel",
        component: () => import("../views/AdminPanelView.vue"),
      },
      {
        path: "not-approved",
        component: () => import("../views/NotApprovedView.vue"),
      },
      {
        path: "banned",
        component: () => import("../views/BannedView.vue"),
      },
    ],
  },
  { path: "/:catchAll(.*)", redirect: "/login" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const token = localStorage.getItem("token");

  if (to.meta.requiresAuth && !token) {
    return next("/login");
  }

  if (!token) {
    return next();
  }

  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      return next("/login");
    }

    const response = await axios.get(`/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = response.data;

    const isApproved = userData.approved;
    const isAdmin = userData.role === "admin";

    connectSocket();

    if (to.path === "/login" || to.path === "/register") {
      return next(isApproved || isAdmin ? "/home" : "/not-approved");
    }

    if (to.meta.requiresAuth && !isApproved && !isAdmin && to.path !== "/not-approved") {
      return next("/not-approved");
    }

    if ((isApproved || isAdmin) && to.path === "/not-approved") {
      return next("/home");
    }

    return next();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        return next("/banned");
      }
    }

    console.error("Error checking approval status:", error);
    return next("/login");
  }
});

export default router;
