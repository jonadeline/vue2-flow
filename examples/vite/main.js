import Vue from "vue";
import Vuex from "vuex";
import App from "./App.vue";
import "./index.css";
import { router } from "./router";

// Utilisation de Vuex
Vue.use(Vuex);

// Création du store Vuex
const store = new Vuex.Store({
  state: {
    // État initial de l'application
  },
  mutations: {
    // Mutations pour modifier l'état
  },
  actions: {
    // Actions pour les opérations asynchrones
  },
  getters: {
    // Getters pour accéder à l'état
  },
});

new Vue({
  router,
  store, // Injection du store Vuex dans l'instance Vue
  render: (h) => h(App),
}).$mount("#root");
