<template>
  <div id="app" class="page-box">
    <div class="content">
      <AppNavbar></AppNavbar>
      <div class="main-part">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>
 
<script>
// Vue.config.productionTip = false  // 阻止 vue 在启动时生成生产提示
import AppNavbar from "./components/AppNavbar";

// 导入子组件，缩写格式 AppHeader: AppHeader
export default {
  name: "App",
  components: { AppNavbar}, // 有s
  mounted() {
    // console.log(Vue.version);
    // console.log('App',this)
  },
};
</script>
 <style>
body {
  margin: 0;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
<style scoped>
.page-box {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
}
/* 头部样式 */
.header {
  position: relative;
  line-height: 100px;
  height: 8vh;
  background-color: #cff7f7;
}
.content {
  width: 100vw;
  display: flex;
  height: 100vh;
}

.main-part {
  flex: 1;
}
/* 左侧样式 */
</style>
