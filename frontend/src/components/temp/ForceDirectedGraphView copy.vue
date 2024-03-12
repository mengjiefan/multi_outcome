<template>
  <div id="ForceDirectedGraph">
    <h2>ForceDirectedGraph View</h2>
    <svg width="1280" height="900"></svg>
    <h3>todo:plot rendering</h3>
    <p>获取到的多对比数据的节点为：{{multipleSearchValue[0].nodes}}</p>
    <!-- <p>获取到的多对比数据的边为：{{$store.state.multipleSearchValue.links}}</p> -->
    <!-- <p>获取到的多对比数据为：{{$store.state.multipleSearchValue}}</p> -->
    <p>获取到的多对比数据为：{{multipleSearchValue}}</p>
    <!-- <button @click="getMultipleOutcome">show</button> -->
    <!-- 缓存一个路由组件 -->

  </div>
</template>

<script src="https://d3js.org/d3.v4.min.js"></script>
<script>
import bus from "../../componentsInteraction/bus.js";
import {mapState,mapGetters,mapMutations,mapActions} from 'vuex'
export default {
  name: "ForceDirectedGraph",
  data() {
    return {
      // value: "",
      // // 注意：v-model需要在data内声明，才能this获取
      // CovariantNum: "",
      // SelectedVariables: [],
      // Variables_result: {},
      // selection : [],
      // multipleSearchValue:[]
    };
  },
  mounted(){
    var svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");
    var marge = {top:10,bottom:10,left:10,right:10}
    var g = svg.append("g")
          .attr("transform","translate("+marge.top+","+marge.left+")");
    var colorScale = d3.scaleOrdinal(d3.schemeCategory20);
    var weighScale = d3.scaleQuantize()
                      .domain([0,1])
                      .range([1,2,3,4,5]);
    svg.append('defs').append('marker')
          .attr("id",'arrowhead')
          .attr('viewBox','-0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
           .attr('refX',23) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
           .attr('refY',-1)
           .attr('orient','auto')
              .attr('markerWidth',3)
              .attr('markerHeight',3)
              .attr('xoverflow','visible')
          .append('svg:path')
          .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
          .attr('fill', '#999')
          .style('stroke','none');

    var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().distance(0.5).strength(0.005))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2)); 
    d3.json("PC_5_top_with_edges_nodes_3outcomes.json", function(error, graph) {
      if (error) throw error;
       
      var nodes = graph.nodes,
      nodeById = d3.map(nodes, function(d) { return d.id; }),
          links = graph.links,
          bilinks = [];  
      console.log(links);
 
      links.forEach(function(link) {
        var s = link.source = nodeById.get(link.source),
            t = link.target = nodeById.get(link.target),
            i = {}; // intermediate node
        nodes.push(i);
        // links.push({source: s, target: i}, {source: i, target: t});
        bilinks.push({src: s, inter: i, dst:t});
       // console.log(link);  
      });
  
      var link = g.append("g").selectAll(".link")
          .data(links)
          // .data(bilinks)
          .enter()  
          .append("path")  
          .attr("class", "link")  
          .attr("stroke-width",function(d){  
          // console.log(weighScale(Math.abs(d.value)));  
                return weighScale(Math.abs(d.value));   //边的权重
              })  
          .attr('marker-end','url(#arrowhead)') //The marker-end attribute defines the arrowhead or polymarker that will be drawn at the final vertex of the given shape.;
  
      //The <title> element provides an accessible, short-text description of any SVG container element or graphics element.
      //Text in a <title> element is not rendered as part of the graphic, but browsers usually display it as a tooltip.  
      link.append("title")
        .text(function(d) { return d.value; });  
      link.append("text")  
            .text(function(d){  
               return d.value;  
              })  
      var node = svg.append("g").selectAll(".node")
                    .data(nodes.filter(function(d) { return d.id; }))  
                    .enter()  
                    .append("g")  
                    .attr("class", "node"); 

      node.append("circle")  
          // .attr("r", 10)  
          .attr("r", function(d){return d.group==0 ? 22 : 17})  
          // .attr("fill", function(d) { return colorScale(d.group); })  
          .attr("fill", function(d) { return d.group==0 ? 'red' :'grey' ; })  
          .style("stroke", "grey")  
          // .style("stroke-opacity",0.1)  
          .call(d3.drag()  
          .on("start", dragstarted)  
              .on("drag", dragged)  
              .on("end", dragended)); 

      node.append("title")  
          // .text(d => d.id + ": " + d.label + " - " + d.group +", runtime:"+ d.runtime+ "min");  
          // .text(function(d) { return ("outcome:" + d.id); })  
          .text(function(d) { return d.group==0 ? ("outcome:" + d.id) : ("covariant:" + d.id); }) 
  
      node.append("text")  
            .attr("dx", 20)  
            .attr("dy", "0.31em")  
            .text(function(d) { return d.id; })  
            // .clone(true).lower()  
            .attr("fill", "none")  
            .attr("stroke", "black")  
            .attr("stroke-width", 1);
  
      simulation  
          .nodes(nodes)  
          .on("tick", ticked);  
      simulation.force("link")  
          .links(links);
  
      function ticked() {  
        link.attr("d", positionLink);  
        node.attr("transform", positionNode);  
      }
});

  },
  computed:{
    ...mapState(['multipleSearchValue'])
  },
  methods: {
    // getMultipleOutcome() {
    //   console.log('FDG中接收到的表格数据为：',this.$store.state.multipleSearchValue[0])
    // },
    positionNode(d) {
        return "translate(" + d.x + "," + d.y + ")";
    },

    dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x, d.fy = d.y;
      },

    dragged(d) {
      d.fx = d3.event.x, d.fy = d3.event.y;
    },

    dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null, d.fy = null;
    }
  },
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
