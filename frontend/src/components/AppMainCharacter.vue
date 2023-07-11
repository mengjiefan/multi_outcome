<template>
  <div class="mainCharacter">
    <h4>variablesCharacter</h4>
    <!-- <button>
			<router-link class="list-group-item" active-class="active" to="/AppMainPlot/CausalGraphView">Get CausalGraph</router-link>
		</button>
    <hr>
		<button>
			<router-link class="list-group-item" active-class="active" to="/AppMainPlot/MultiOutcomesView">Get MultiOutcomes matrix</router-link>
		</button> -->
  </div>
</template>
 
<script>
export default {
  name: "AppMainCharacter",
};
</script>
 
<style scoped>
.mainCharacter {
  padding: 16px;
  font-size: 20px;
  background-color: rgb(231, 235, 213);
  flex: 0.8;
  max-width:500px;
}
</style>