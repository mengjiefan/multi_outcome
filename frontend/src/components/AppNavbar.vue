
<template>
  <div class="navbar">
    <el-card class="box-card">
      <el-radio-group
        v-model="dataset"
        style="margin-bottom: 30px"
      >
        <el-radio-button label="default">default</el-radio-button>
        <el-radio-button label="clhls">clhls</el-radio-button>
        <el-radio-button label="ukb">ukb</el-radio-button>
      </el-radio-group>
      <el-tabs v-model="activeName">
        <el-tab-pane label="Single Outcome" name="single">
          <div class="CharacterSelector">
            <OutcomeSelector :dataset="dataset"></OutcomeSelector></div
        ></el-tab-pane>
        <el-tab-pane label="Multiple Outcomes" name="second">
          <div class="AnalysisHistory">
            <CausalAnalysisHistory></CausalAnalysisHistory></div
        ></el-tab-pane>
      </el-tabs>
    </el-card>
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
      dataset: ref("default"),
      activeName: ref("single"),
    };
  },
  watch: {
    $route: {
      handler: function (route) {
        console.log(route);
        if (route.query.mode === "save") {
          this.activeName = "second";
        }
      },
      immediate: true,
    },
  },
  methods: {
  },
};
</script>
 
<style scoped>
.box-card {
  max-height: 70vh;
}
.navbar {
  min-width: 500px;
  max-width: 500px;
  font-size: 20px;
  position: relative;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 1vh;
  height: 99vh;
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