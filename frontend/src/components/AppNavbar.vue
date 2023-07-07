
<template>
  <div class="navbar">
    <div class="nav-title">Navigation View</div>
    <br />
    <el-tabs type="border-card" v-model="activeName">
      <el-tab-pane label="Single Outcome" name="single">
        <div class="CharacterSelector">
          <OutcomeSelector></OutcomeSelector></div
      ></el-tab-pane>
      <el-tab-pane label="Multiple Outcomes" name="second">
        <div class="AnalysisHistory">
          <CausalAnalysisHistory></CausalAnalysisHistory></div
      ></el-tab-pane>
    </el-tabs>
  </div>
</template>
 
<script>
// import upload from "./upload";
import OutcomeSelector from "./OutcomeSelector";
import VariablesCheckbox from "./VariablesCheckbox.vue";
// import CausalAnalysisHistory111 from "./CausalAnalysisHistory111";
import CausalAnalysisHistory from "./CausalAnalysisHistory";
import { ref } from "vue";
export default {
  name: "AppNavbar",
  components: { OutcomeSelector, VariablesCheckbox, CausalAnalysisHistory },
  setup() {
    return {
      activeName: ref("single"),
    };
  },
  watch: {
    $route: {
      handler: function (route) {
        console.log(route);
        if (route.query.mode === "save") {
          this.activeName = 'second';
        }
      },
      immediate: true,
    },
  },
};
</script>
 
<style scoped>
.navbar {
  min-width: 500px;
  max-width: 500px;
  font-size: 20px;
  position: relative;
  padding-left: 10px;
  padding-right: 10px;
  height: 92vh;
  overflow-y: auto; /* 当内容过多时y轴出现滚动条 */
  background-color: #e0eeee55;
}
.nav-title {
  padding-top: 10px;
  font-size: 32px;
  font-weight: bold;
  text-align: center;
}
</style>