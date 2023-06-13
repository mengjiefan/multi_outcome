
<template>
  <div class="navbar">
    <div class="nav-title">Navigation View</div>
    <!-- <upload></upload> -->
    <hr />
    <div class="CharacterSelector">
      <OutcomeSelector></OutcomeSelector>
      <!-- change the layout of checkbox to acheive Adding or Deleting a Node -->
      <!-- <VariablesCheckbox></VariablesCheckbox> -->
      
    </div>
    <hr /> 
    <div class="AnalysisHistory">
      <!-- <CausalAnalysisHistory111></CausalAnalysisHistory111> -->
      <CausalAnalysisHistory_copy></CausalAnalysisHistory_copy>
    </div>
  </div>
</template>
 
<script>
// import upload from "./upload";
import OutcomeSelector from "./OutcomeSelector";
import VariablesCheckbox from "./VariablesCheckbox.vue";
// import CausalAnalysisHistory111 from "./CausalAnalysisHistory111";
import CausalAnalysisHistory_copy from "./CausalAnalysisHistory_copy";
export default {
  name: "AppNavbar",
  components: { OutcomeSelector, VariablesCheckbox, CausalAnalysisHistory_copy },
 
};
</script>
 
<style scoped>
.navbar {
  /* position: absolute; */
  font-size: 20px;
}
.nav-title {
  font-size: 32px;
  font-weight: bold;
  text-align: center;
}
</style>