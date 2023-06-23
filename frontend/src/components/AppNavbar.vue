
<template>
  <div class="navbar">
    <div class="nav-title">Navigation View</div>

    <hr />
    <div class="CharacterSelector">
      <OutcomeSelector></OutcomeSelector>
    </div>
    <hr /> 
    <div class="AnalysisHistory">
      <CausalAnalysisHistory></CausalAnalysisHistory>
    </div>
  </div>
</template>
 
<script>
// import upload from "./upload";
import OutcomeSelector from "./OutcomeSelector";
import VariablesCheckbox from "./VariablesCheckbox.vue";
// import CausalAnalysisHistory111 from "./CausalAnalysisHistory111";
import CausalAnalysisHistory from "./CausalAnalysisHistory";
export default {
  name: "AppNavbar",
  components: { OutcomeSelector, VariablesCheckbox, CausalAnalysisHistory },
 
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
  background-color: #e0eeee;
}
.nav-title {
  padding-top: 10px;
  font-size: 32px;
  font-weight: bold;
  text-align: center;
}
</style>