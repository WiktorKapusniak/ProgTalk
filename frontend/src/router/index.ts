import { connectSocket } from "@/composables/socket";
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
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

  if (token) {
    try {
      const userId = localStorage.getItem("userId");
      if (userId) {
        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 403) {
          // Zbanowany lub brak uprawnień
          if (to.path !== "/banned") {
            return next("/banned");
          } else {
            return next();
          }
        }
        if (response.ok) {
          connectSocket();
          const userData = await response.json();
          const isApproved = userData.approved;
          const isAdmin = userData.role === "admin";

          if (to.path === "/login" || to.path === "/register") {
            if (isApproved || isAdmin) {
              return next("/home");
            } else {
              return next("/not-approved");
            }
          }
          if (to.meta.requiresAuth && !isApproved && !isAdmin && to.path !== "/not-approved") {
            return next("/not-approved");
          }
          if ((isApproved || isAdmin) && to.path === "/not-approved") {
            return next("/home");
          }
        }
      }
    } catch (error) {
      console.error("Error checking approval status:", error);
    }
  }

  next();
});
export default router;
