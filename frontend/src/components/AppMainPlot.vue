<template>
  <div class="mainPlot">
    <router-view></router-view>
  </div>
</template>
 
<script>
import { ref } from "vue";
export default {
  name: "AppMainPlot",
  data() {
    return {};
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
</style>
