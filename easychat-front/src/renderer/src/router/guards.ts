export const beforeEach = (to: any, from, next) => {
  if (to.path === "/login") {
    next();
    return;
  }
  const token = localStorage.getItem("TOKEN") || "";
  if (!token) {
    next({
      path: "/login",
    });
    return;
  }

  return;
};

export function afterEach() {}
