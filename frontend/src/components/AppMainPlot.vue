<template>
  <div class="mainPlot">
    <router-view></router-view>
    <div class="open-button" @click="drawer = true">
      <i class="el-icon-caret-left"></i>
    </div>
    <el-drawer
      custom-class="right-side"
      :size="500"
      :modal="false"
      title="variablesCharacter"
      :visible.sync="drawer"
    >
      <app-main-character></app-main-character>
    </el-drawer>
  </div>
</template>
 
<script>
import AppMainCharacter from "./AppMainCharacter.vue";

export default {
  components: { AppMainCharacter },
  name: "AppMainPlot",
  data() {
    return {
      drawer: false,
    };
  },
};
</script>
 
<style scoped>
.mainPlot {
  padding: 0;
  min-height: 1200px;
  height: 100%;
  flex: 1;
  display: flex;
  font-size: 20px;
}
.open-button {
  position: absolute;
  top: 50%;
  right: 0;
  width: 32px;
  border-top-left-radius: 15px;
  border-bottom-left-radius: 15px;
  font-size: 24px;
  height: 40px;
  vertical-align: center;
  display: flex;
  align-items: center;
  box-shadow: rgb(174, 174, 174) 0px 0px 10px;
}

</style>
<style>
.right-side {
  /*background-color: rgb(231, 235, 213);*/
}
#el-drawer__title {
  color: black ;
  font-weight: bold;
}
</style>