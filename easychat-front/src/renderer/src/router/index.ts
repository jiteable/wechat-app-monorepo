import { createRouter, createWebHashHistory } from "vue-router";

import { AppRoutes } from "./routes";

import { beforeEach, afterEach } from "./guards";

const AppRouter = createRouter({
  history: createWebHashHistory(),
  routes: AppRoutes,
});

AppRouter.beforeEach(beforeEach);

AppRouter.afterEach(afterEach);

export default AppRouter;
