//引入Vue
import Vue from 'vue'
//引入App
import App from './App.vue'
//引入VueRouter
import VueRouter from 'vue-router'
//引入路由器
import router from './router'
// main.js入口文件中引入布局方案
import 'lib-flexible'  // 阿里可伸缩布局方案 lib-flexible
// 引入axios
import axios from 'axios'
import VueAxios from 'vue-axios'

//引入store
import store from './store/index'
// 引入babel-polyfill
// import 'babel-polyfill'
import ElementUI from 'element-ui';             //全局引入element
import 'element-ui/lib/theme-chalk/index.css';    //全局引入element的样式
import * as echarts from "echarts";
//关闭vue的生产提示
Vue.config.productionTip = false

//按需引入element-ui
// import { Button,Upload,Select,Option,Checkbox,CheckboxGroup,Input } from 'element-ui';
//应用插件
Vue.use(VueRouter)

Vue.use(VueAxios,axios)

//全局应用ElementUI
Vue.use(ElementUI);
//按需应用ElementUI
// Vue.component('el-upload', Upload);
// Vue.component('el-button', Button);
// Vue.component('el-select', Select);
// Vue.component('el-option', Option);
// Vue.component('el-checkbox', Checkbox);
// Vue.component('el-checkbox-group', CheckboxGroup);
// Vue.component('el-input', Input);

// axios.defaults.baseURL = 'http://127.0.0.1:8000/'


Vue.prototype.$echarts = echarts
new Vue({
	el:'#app',
	// router,
	// components: { Layout },
	// template: '<Layout/>',
	// template:`<App></App>`,
	// components:{App},
	render: h => h(App),
	store,
	router:router
})