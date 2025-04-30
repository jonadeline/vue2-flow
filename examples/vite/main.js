import Vue from 'vue'
import App from './App.vue'
import './index.css'
import { router } from './router'

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#root')
