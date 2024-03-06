<template>
  <div class="mainPlot">
    <router-view></router-view>
    <div
      v-if="$route.path.includes('/simple')"
      class="open-button"
      @click="drawer = true"
    >
      <i class="el-icon-caret-left"></i>
    </div>
    <el-drawer
      v-if="$route.path.includes('/simple')"
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
import { ref } from "vue";
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
  height: 100%;
  flex: 1;
  display: flex;
  font-size: 20px;
}
.open-button {
  position: absolute;
  z-index: 100;
  top: 50%;
  right: 0;
  width: 32px;
  border-top-left-radius: 15px;
  border-bottom-left-radius: 15px;
  font-size: 24px;
  height: 40px;
  display: flex;
  align-items: center;
  box-shadow: rgb(174, 174, 174) 0px 0px 10px;
}
</style>
<style>
#el-drawer__title {
  color: black;
  font-weight: bold;
}
</style>