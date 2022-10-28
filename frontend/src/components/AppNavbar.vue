
<template>
  <div class="navbar">
    <h4>Navigation View</h4>
    <!-- <upload></upload> -->
    <hr />
    <div class="CharacterSelector">
      <OutcomeSelector></OutcomeSelector>
      <VariablesCheckbox></VariablesCheckbox>
      <button>Save Variables</button><br />
      <button>Variables Characters</button><br />
      <router-link
        class="list-group-item"
        active-class="active"
        to="/AppMainPlot/CausalGraphView"
        >Get CausalGraph (static)</router-link
      >
      <!-- 缓存一个路由组件 -->
      
    </div>
    <hr /> 
    <div class="AnalysisHistory">
      <CausalAnalysisHistory></CausalAnalysisHistory>
      <CausalAnalysisHistory_copy></CausalAnalysisHistory_copy>
    </div>
  </div>
</template>
 
<script>
// import upload from "./upload";
import OutcomeSelector from "./OutcomeSelector";
import VariablesCheckbox from "./VariablesCheckbox.vue";
import CausalAnalysisHistory from "./CausalAnalysisHistory";
import CausalAnalysisHistory_copy from "./CausalAnalysisHistory_copy";
export default {
  name: "AppNavbar",
  components: { OutcomeSelector, VariablesCheckbox, CausalAnalysisHistory, CausalAnalysisHistory_copy },
 
};
</script>
 
<style scoped>
.navbar {
  /* position: absolute; */
  font-size: 20px;
}
</style>