<template>
  <div id="ForceDirectedGraph">
    <h2>ForceDirectedGraph View</h2>
    <svg width="1280" height="900"><g/></svg>
    <h3>todo:plot rendering</h3>
    <!-- <p>获取到的多对比数据的节点为：{{multipleSearchValue[0].nodes}}</p> -->
    <!-- <p>获取到的多对比数据的边为：{{$store.state.multipleSearchValue.links}}</p> -->
    <!-- <p>获取到的多对比数据为：{{$store.state.multipleSearchValue}}</p> -->
    <p>获取到的多对比数据为：{{ multipleSearchValue }}</p>
    <button @click="drawGraph">show</button>
    <!-- 缓存一个路由组件 -->
  </div>
</template>
    
</template>

<script>
import * as d3 from 'd3';
import * as dagreD3 from 'dagre-d3';
import bus from "../componentsInteraction/bus.js";
import {mapState} from 'vuex';
export default {
  name: "ForceDirectedGraph",
  data() {
    return {
      
    };
  },
  // mounted() {
	// 		this.generateDag();
	// 	},
  methods:{
    drawGraph(){
    var  data = this.multipleSearchValue
    // {
        console.log(data); 
        var g = new dagreD3.graphlib.Graph().setGraph({});

        // Test with our 3 outcome graph(s)
        var states = data.nodesList;

        // Automatically label each of the nodes
        states.forEach(function (state) { g.setNode(state.id, { label: state.id }); });

        var edges = data.linksList;
        edges.forEach(function(edge){
            var valString = (edge.value*10).toString()+"px";
            var styleString = "stroke-width: "+valString;
            g.setEdge(edge.source, edge.target, {label: edge.value.toString()})});
        
        // Set some general styles
        // g.nodesList().forEach(function (v) {
        //     var node = g.node(v);
        //     node.rx = node.ry = 5;
        // });

        // Add some custom colors based on state
        // g.node('death').style = "fill: #f77";
        // g.node('multimorbidity_base').style = "fill: #7f7";
        // g.node('physi_limit_base').style = "fill: #7f7";

        var svg = d3.select("svg"),
            inner = svg.select("g");

        // Set up zoom support
        var zoom = d3.zoom().on("zoom", function () {
            inner.attr("transform", d3.event.transform);
        });
        svg.call(zoom);

        // Create the renderer
        var render = new dagreD3.render();

        // Run the renderer. This is what draws the final graph.
        render(inner, g);

        // Center the graph
        var initialScale = 0.75;
        svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));

        svg.attr('height', g.graph().height * initialScale + 40);
        return data;
    },
  },
  mounted(){
    // generateDag() {
    // const data = d3.json("C:/MyProjects_yuxi/ComparativeVis/important_causalCompVis/PC_5_top_with_edges_nodes_3outcomes.json").then(function(data)
    // const data = d3.json(multipleSearchValue).then(function(data)
       var data = this.multipleSearchValue;
    // {
        console.log(data); 
        var g = new dagreD3.graphlib.Graph().setGraph({});

        // Test with our 3 outcome graph(s)
        var states = data.nodesList;

        // Automatically label each of the nodes
        states.forEach(function (state) { g.setNode(state.id, { label: state.id }); });

        var edges = data.linksList;
        edges.forEach(function(edge){
            var valString = (edge.value*10).toString()+"px";
            var styleString = "stroke-width: "+valString;
            g.setEdge(edge.source, edge.target, {label: edge.value.toString()})});
        
        // Set some general styles
        // g.nodesList().forEach(function (v) {
        //     var node = g.node(v);
        //     node.rx = node.ry = 5;
        // });

        // Add some custom colors based on state
        // g.node('death').style = "fill: #f77";
        // g.node('multimorbidity_base').style = "fill: #7f7";
        // g.node('physi_limit_base').style = "fill: #7f7";

        var svg = d3.select("svg"),
            inner = svg.select("g");

        // Set up zoom support
        var zoom = d3.zoom().on("zoom", function () {
            inner.attr("transform", d3.event.transform);
        });
        svg.call(zoom);

        // Create the renderer
        var render = new dagreD3.render();

        // Run the renderer. This is what draws the final graph.
        render(inner, g);

        // Center the graph
        var initialScale = 0.75;
        svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));

        svg.attr('height', g.graph().height * initialScale + 40);
        return data;
      
    // }
// );
  // }
  },

  computed:{
  
    ...mapState(['multipleSearchValue'])
  }
  
  // methods: {
  //   // getMultipleOutcome() {
  //   //   console.log('FDG中接收到的表格数据为：',this.$store.state.multipleSearchValue[0])
  //   // },
    
  // },

 
  /*
  无关联的组件无法通过bus方法跨组件传递数据
  // 到站接收数据，在接收组件的mounted中接收
  mounted() {
    bus.$on("getOnBusLinksNodes", (val) => {
      this.value = val;
      console.log("接收到的比较结局数据为：" + val)
    });
  },
  */
};
</script>

<style>
.node {
  stroke: #fff;
  stroke-width: 1.5px;
}

.link {
  fill: none;
  stroke: #bbb;
}
</style>
