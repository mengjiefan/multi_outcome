<template>
  <div id="app">
    <AppHeader></AppHeader>
    <AppNavbar></AppNavbar>
    <AppMainCharacter></AppMainCharacter>
    <AppMainPlot></AppMainPlot>
  </div>
  
</template>
 
<script>
  // Vue.config.productionTip = false  // 阻止 vue 在启动时生成生产提示
  import AppHeader from "./components/AppHeader"
  import AppNavbar from "./components/AppNavbar"
  import AppMainCharacter from "./components/AppMainCharacter"
  import AppMainPlot from "./components/AppMainPlot"
 
  // 导入子组件，缩写格式 AppHeader: AppHeader
  export default {
    name:'App',
    components: { AppHeader, AppNavbar, AppMainCharacter, AppMainPlot } , // 有s
    mounted() {
      // console.log('App',this)
    },
  };
 
</script>
 
<style scoped>
  /* 头部样式 */
  .header {
    position: absolute;
    line-height: 100px;
    top: 0px;
    left: 0px;
    right: 0px;
    background-color: #cff7f7;
  }
 
  /* 左侧样式 */
  .navbar {
    position: absolute;
    width: 480px;
    top: 100px;  /* 距离上面100像素 */
    left: 0px;
    bottom: 0px;
	  padding: 10px;
    overflow-y: auto; /* 当内容过多时y轴出现滚动条 */
    background-color: #e0eeee;
  }
 
  /* 主区域 */
  .mainCharacter {
    position: absolute;
    top: 100px;
    left: 500px;
    line-height: 250px;
    right: 0px;  /* 距离右边0像素 */
    padding: 10px;
    overflow-x: auto; /* 当内容过多时x轴出现滚动条 */
    background-color: rgb(231, 235, 213);
  }

  .mainPlot {
    position: absolute;
    top: 420px;
    left: 500px;
    bottom: 0px;
    right: 0px;  /* 距离右边0像素 */
    padding: 10px;
    overflow-y: auto; /* 当内容过多时y轴出现滚动条 */
    /* background-color: red; */
  }
</style>
