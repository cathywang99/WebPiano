import Vue from 'vue'
import App from './App'
import intro from 'intro.js'
import JsonExcel from 'vue-json-excel'
import 'intro.js/introjs.css'
import 'element-ui/lib/theme-chalk/index.css';
import { Message, Button, Input, Card, Dialog, Select, Option, Progress } from 'element-ui';
import router from './router'
import './style/layout.styl'

Vue.config.productionTip = false
Vue.use(Card)
Vue.use(Button)
Vue.use(Input)
Vue.use(Dialog)
Vue.use(Select)
Vue.use(Option)
Vue.use(Progress)
Vue.prototype.$message = Message
Vue.prototype.$intro = intro
Vue.component('downloadExcel', JsonExcel)


new Vue({
  el: "#app",
  router,
  render: h => h(App)
})
