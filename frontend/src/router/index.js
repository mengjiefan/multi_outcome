// 该文件专门用于创建整个应用的路由器
// import Vue from 'vue'
import VueRouter from "vue-router";
//引入组件
import AppMainCharacter from "../components/AppMainCharacter";

// import SubPopulation from '../pages/populationControl.vue'
// import DimensionView from '../pages/dimensionView.vue'
import CausalGraph from "../components/temp/CausalGraphView";
import MultiOutcomes from "../components/temp/MultiOutcomesView";
import DirectedGraph from "../components/DirectedGraphView";
// import CausalAnalysisHistory from '../pages/causalAnalysisHistory.vue'

// Vue.use(VueRouter)

//创建并暴露一个路由器
export default new VueRouter({
  mode: "history", //加入该行代码之后，网址不再带有#
  routes: [
    {
      path: "/AppMainCharacter",
      name: "AppMainCharacter", // 路由名称
      component: AppMainCharacter, // 组件对象
    },

    {
      path: "/redirect",
      component: () => import("../pages/redirect.vue"),
    },
    {
      path: "/CausalGraphView",
      component: CausalGraph,
    },
    {
      path: "/MultiOutcomesView",
      component: MultiOutcomes,
    },
    {
      name: "DirectedGraphView",
      path: "/DirectedGraphView",
      component: DirectedGraph,
      children: [
        {
          name: "SimpleDirectedGraph",
          path: "/DirectedGraphView/simple",
          component: () =>
            import("../views/DirectedGraph/SimpleDirectedGraph.vue"),
        },
        {
          name: "MultipleDirectedGraph",
          path: "/DirectedGraphView/multiple",
          component: () =>
            import("../views/DirectedGraph/MultipleDirectedGraph.vue"),
          children: [
            {
              name: "DirectedSuperGraph",
              path: "/DirectedGraphView/multiple/super-graph",
              component: () => import("../views/DirectedGraph/SuperGraph.vue"),
            },
            {
              name: "ExtractedSubGraph",
              path: "/DirectedGraphView/multiple/extracted-sub-graph",
              component: () => import("../views/DirectedGraph/SonGraph.vue"),
            },
            /*
            {
              name: "TightenedSubGraph",
              path: "/DirectedGraphView/multiple/tightened-sub-graph",
              component: () => import("../views/DirectedGraph/SonGraph.vue"),
            },
            {
              name: "CenterSubGraph",
              path: "/DirectedGraphView/multiple/center-sub-graph",
              component: () => import("../views/DirectedGraph/SonGraph.vue"),
            },
            {
              name: "TreeSubGraph",
              path: "/DirectedGraphView/multiple/tree-sub-graph",
              component: () => import("../views/DirectedGraph/SonGraph.vue"),
            },
            
            {
              name: "OriginalSubGraph",
              path: "/DirectedGraphView/multiple/original-sub-graph",
              component: () => import("../views/DirectedGraph/SonGraph.vue"),
            },
            {
              name: "AggregateSubGraph",
              path: "/DirectedGraphView/multiple/aggregate-sub-graph",
              component: () => import("../views/DirectedGraph/SonGraph.vue"),
            },*/
            {
              name: "RelativeSubGraph",
              path: "/DirectedGraphView/multiple/relative-sub-graph",
              component: () => import("../views/DirectedGraph/SonGraph.vue"),
            },
          ],
        },
        {
          name: "BenchmarkDirectedGraph",
          path: "/DirectedGraphView/benchmark",
          component: () => import("../views/DirectedGraph/BenchmarkGraph.vue"),
        },
      ],
    },
  ],
});
