<template>
  <div class="mainPlot">
      <router-view></router-view>
    <app-main-character></app-main-character>
  </div>
</template>
 
<script>
import AppMainCharacter from "./AppMainCharacter.vue";

export default {
  components: { AppMainCharacter },
  name: "AppMainPlot",
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
</style>