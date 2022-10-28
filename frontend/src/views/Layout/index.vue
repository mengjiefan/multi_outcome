<template>
  <div id="app">
    <app-header></app-header>
    <app-navbar></app-navbar>
    <app-main></app-main>
  </div>
</template>
 
<script>
  import AppHeader from "./components/AppHeader"
  import AppNavbar from "./components/AppNavbar"
  import AppMain from "./components/AppMain"
 
  // 导入子组件，缩写格式 AppHeader: AppHeader
  export default {
    name:'App',
    components: { AppHeader, AppNavbar, AppMain }  // 有s
  };
 
</script>
 
<style scoped>
  /* 头部样式 */
  .header {
    position: absolute;
    line-height: 50px;
    top: 0px;
    left: 0px;
    right: 0px;
    background-color: #2d3a4b;
  }
 
  /* 左侧样式 */
  .navbar {
    position: absolute;
    width: 200px;
    top: 50px;  /* 距离上面50像素 */
    left: 0px;
    bottom: 0px;
    overflow-y: auto; /* 当内容过多时y轴出现滚动条 */
    background-color: #545c64;
  }
 
  /* 主区域 */
  .main {
    position: absolute;
    top: 50px;
    left: 200px;
    bottom: 0px;
    right: 0px;  /* 距离右边0像素 */
    padding: 10px;
    overflow-y: auto; /* 当内容过多时y轴出现滚动条 */
    /* background-color: red; */
  }
</style>
