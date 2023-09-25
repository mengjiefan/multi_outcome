// 该文件专门用于创建整个应用的路由器
// import Vue from 'vue'
import VueRouter from 'vue-router'
//引入组件
import AppMainCharacter from "../components/AppMainCharacter"
import AppMainPlot from "../components/AppMainPlot"
// import SubPopulation from '../pages/populationControl.vue'
// import DimensionView from '../pages/dimensionView.vue'
import CausalGraph from '../components/CausalGraphView'
import MultiOutcomes from '../components/MultiOutcomesView'
import DirectedGraph from '../components/DirectedGraphView'
// import CausalAnalysisHistory from '../pages/causalAnalysisHistory.vue'


// Vue.use(VueRouter)

//创建并暴露一个路由器
export default new VueRouter({
	mode: 'history',  //加入该行代码之后，网址不再带有#
	routes: [
		{
			path: '/AppMainCharacter',
			name: 'AppMainCharacter',  // 路由名称
			component: AppMainCharacter  // 组件对象
		},
		{
			path: '/AppMainPlot',
			name: 'AppMainPlot',  // 路由名称
			component: AppMainPlot,// 组件对象
			children: [
				{
					path: '/AppMainPlot/redirect',
					component: () =>
						import(
							'../pages/redirect.vue'
						),
				},
				{
					path: '/AppMainPlot/CausalGraphView',
					component: CausalGraph,
				},
				{
					path: '/AppMainPlot/MultiOutcomesView',
					component: MultiOutcomes,
				},
				{
					name: 'DirectedGraphView',
					path: '/AppMainPlot/DirectedGraphView',
					component: DirectedGraph,
					children: [
						{
							name: 'SimpleDirectedGraph',
							path: '/AppMainPlot/DirectedGraphView/simple',
							component: () => import(
								"../views/DirectedGraph/SimpleDirectedGraph.vue"
							),
						},
						{
							name: 'MultipleDirectedGraph',
							path: '/AppMainPlot/DirectedGraphView/multiple',
							component: () => import(
								"../views/DirectedGraph/MultipleDirectedGraph.vue"
							),
							children: [
								{
									name: 'DirectedSuperGraph',
									path: '/AppMainPlot/DirectedGraphView/multiple/super-graph',
									component: () => import(
										"../views/DirectedGraph/SuperGraph.vue"
									),
								},
								{
									name: 'ExtractedSubGraph',
									path: '/AppMainPlot/DirectedGraphView/multiple/extracted-sub-graph',
									component: () => import(
										"../views/DirectedGraph/ExtractedSubGraph.vue"
									),
								},
								{
									name: 'TightenedSubGraph',
									path: '/AppMainPlot/DirectedGraphView/multiple/tightened-sub-graph',
									component: () => import(
										"../views/DirectedGraph/TightenedSubGraph.vue"
									),
								},
								{
									name: 'ConstraintSubGraph',
									path: '/AppMainPlot/DirectedGraphView/multiple/constraint-sub-graph',
									component: () => import(
										"../views/DirectedGraph/ConstraintSubGraph.vue"
									),
								},
								{
									name: 'OptimalSubGraph',
									path: '/AppMainPlot/DirectedGraphView/multiple/optimal-sub-graph',
									component: () => import(
										"../views/DirectedGraph/OptimalSubGraph.vue"
									),
								},
								{
									name: 'OriginalSubGraph',
									path: '/AppMainPlot/DirectedGraphView/multiple/original-sub-graph',
									component: () => import(
										"../views/DirectedGraph/OriginalSubGraph.vue"
									),
								}
							]
						},
					]
				}
			]
		}
	]
})