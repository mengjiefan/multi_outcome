<template>
  	<div class="mainPlot">
		<!-- <h4>PlotRender</h4> -->
		
			<!-- <ul class="nav nav-tabs">
				<li>
					<router-link class="list-group-item" active-class="active" to="/AppMainPlot/CausalGraphView">Get CausalGraph</router-link>
				</li>
				<li>
					<router-link class="list-group-item" active-class="active" to="/AppMainPlot/MultiOutcomesView">Get MultiOutcomes matrix</router-link>
				</li>
			</ul> -->

			<!-- 缓存多个路由组件 -->
			<!-- <keep-alive :include="['News','Message']"> -->
			
			
			<!-- 缓存一个路由组件 -->
		<keep-alive include="AppMainPlot">
			<!-- 路由出口 -->
    		<!-- 路由匹配到的组件将渲染在这里 -->
			<router-view></router-view>
		</keep-alive>
		
		
	</div>
	
</template>
 
<script>
    export default {
        name: "AppMainPlot"
    }
</script>
 
<style scoped>
.mainPlot {
    /* position: absolute; */
    font-size: 20px;
    
  }
 
</style>