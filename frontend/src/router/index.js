import VueRouter from "vue-router";
import AppMainCharacter from "../components/AppMainCharacter";
import DirectedGraph from "../components/DirectedGraphView";

export default new VueRouter({
  mode: "history", //加入该行代码之后，网址不再带有#
  routes: [
    {
      path: "/",
      name: "home", // 路由名称
      component: AppMainCharacter, // 组件对象
    },

    {
      path: "/redirect",
      component: () => import("../pages/redirect.vue"),
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
