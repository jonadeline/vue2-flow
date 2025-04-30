import Vue from "vue";
import VueRouter from "vue-router";
import Basic from "./src/Basic/Basic.vue";

Vue.use(VueRouter);

export const routes = [
  {
    path: "/",
    component: Basic,
  },
];

export const router = new VueRouter({
  mode: "hash",
  routes,
});
