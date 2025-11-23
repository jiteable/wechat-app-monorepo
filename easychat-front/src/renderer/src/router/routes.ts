import Home from "@/views/Home.vue";

export const AppRoutes = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/login",
    component: () => import("../views/login/Login.vue"),
  },
];
