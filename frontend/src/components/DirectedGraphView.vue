<template>
  <div id="DirectedGraph">
    <h2>DirectedGraph View</h2>
    <h3 style="color: red; font-size: 25px">
      Todo:To achieve real-time rendering
    </h3>
    <!-- <p>获取到的多对比数据的节点为：{{multipleSearchValue[0].nodes}}</p> -->
    <!-- <p>获取到的多对比数据的边为：{{$store.state.multipleSearchValue.links}}</p> -->
    <!-- <p>获取到的多对比数据为：{{$store.state.multipleSearchValue}}</p> -->
    <h4>The obtained multi-comparison data is:</h4>
    <h5>Nodes are:</h5>
    <p>{{ multipleSearchValue.nodesList }}</p>
    <h5>Links are:</h5>
    <p>{{ multipleSearchValue.linksList }}</p>
    <button @click="drawGraph" style="background-color: #ffc0cb">
      Show the Directed Graph
    </button>
    <hr />
    <svg class='graph-svg'><g /></svg>
    <!-- 缓存一个路由组件 -->
  </div>
</template>
    
</template>

<script>
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import bus from "../componentsInteraction/bus.js";
import { mapState } from "vuex";

var cmap = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

export default {
  name: "DirectedGraph",
  data() {
    return {
      tooltip: null,
    };
  },
  mounted() {
    this.drawGraph();
  },
  methods: {
    drawGraph() {
      var data = this.multipleSearchValue;
      // {
      console.log(data);
      var g = new dagreD3.graphlib.Graph().setGraph({});

      // Test with our 3 outcome graph(s)
      var states = data.nodesList;

      // Automatically label each of the nodes
      states.forEach(function (state) {
        g.setNode(state.id, {
          label: state.id,
          type: state.type,
        });
      });

      var edges = data.linksList;
      edges.forEach(function (edge) {
        var valString = (edge.value * 10).toString() + "px";
        var styleString = "stroke-width: " + valString;
        var edgeColor = "stroke: " + cmap[0];

        g.setEdge(edge.source, edge.target, {
          style: edgeColor + ";" + styleString + ";fill: transparent",
          curve: d3.curveBasis,
          label: edge.value.toString(),
        });
      });

      // Set some general styles
      g.nodes().forEach(function (v) {
        var node = g.node(v);
        node.rx = node.ry = 5;
        if (node.type == 0) node.style = "fill: #f77";
      });

      var svg = d3.select("svg");
      let inner = svg.select("g");

      this.tooltip = this.createTooltip();

      // Set up zoom support
      let that = this;
      var zoom = d3.zoom().on("zoom", function (event) {
        inner.attr("transform", event.transform);
        that.tipHidden();
      });
      svg.call(zoom);

      // Create the renderer
      var render = new dagreD3.render();

      // Run the renderer. This is what draws the final graph.
      render(inner, g);
      //add hover effect & hover hint to nodes
      inner
        .selectAll("g.node")
        .on("mouseover", (v) => {
          const hoverName = v.fromElement.__data__;
          v.fromElement.setAttribute("id", "hover-node");
          if (hoverName) {
            this.tipVisible('<div class="node-name">' + hoverName + "</div>", {
              pageX: v.pageX,
              pageY: v.pageY,
            });
            let nowNode = g.node(hoverName);
          }
        })
        .on("mouseout", (v) => {
          this.tipHidden();
          v.fromElement.setAttribute("id", "");
        });
      
      // add hover effect & click hint to lines
      var onmousepath = d3.selectAll(".edgePath");
      var allpathes = onmousepath.select(".path");
      const _this = this;
      allpathes
        .on("mouseout", function (d, id) {
          allpathes.style("opacity", "1");
        })
        .on("mouseover", function (d, id) {
          allpathes.style("opacity", ".2"); /* set all edges opacity 0.2 */
          d3.select(this).style("opacity", "1");
        })
        .on("click", function (d, id) {
          //console.log(d, id, "click");
          let hintHtml =
            "<div class='operate-header'><div class='hint-list'>operate</div><div class='close-button'>x</div></div><hr/><div class='operate-menu'>delete</div>";
          _this.tip2Visible(hintHtml, { pageX: d.pageX, pageY: d.pageY });
          setTimeout(() => {
            _this.tipWatchBlur();
          }, 0);
        });

      // Center the graph
      var initialScale = 0.75;
      svg.call(
        zoom.transform,
        d3.zoomIdentity
          .translate(
            1200,
            200
          )
          .scale(initialScale)
      );

      svg.attr("height", g.graph().height * initialScale + 40);

      return data;
    },
    //add document click listener
    tipWatchBlur() {
      document.addEventListener("click", this.listener);
    },
    //document click listener => to close line tooltip
    listener(e) {
      let _this = this;
      let clickDOM = e.target.className;
      //console.log(clickDOM, "click tooltip?");
      if (
        clickDOM !== "operate-menu" &&
        clickDOM !== "hint-menu" &&
        clickDOM !== "hint-list" &&
        clickDOM !== "tooltip" &&
        clickDOM !== "operate-header"
      ) {
        _this.tipHidden();
        document.removeEventListener("click", _this.listener);
      }
    },
    // create tooltip but not show it
    createTooltip() {
      return d3
        .select("body")
        .append("div")
        .classed("tooltip", true)
        .style("opacity", 0)
        .style("display", "none");
    },
    // display node tooltip
    tipVisible(textContent, event) {
      document.removeEventListener("click", this.listener);
      this.tooltip
        .transition()
        .duration(200)
        .style("opacity", 0.9)
        .style("display", "block");
      this.tooltip
        .html(textContent)
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY + 15}px`);
    },
    //display line tooltip
    tip2Visible(textContent, event) {
      document.removeEventListener("click", this.listener);
      this.tooltip
        .transition()
        .duration(100)
        .style("opacity", 0.95)
        .style("display", "block");
      this.tooltip
        .html(textContent)
        .style("left", `${event.pageX}px`)
        .style("top", `${event.pageY}px`);
    },

    // tooltip隐藏
    tipHidden() {
      this.tooltip
        .transition()
        .duration(100)
        .style("opacity", 0)
        .style("display", "none");
    },
  },
  mounted() {
    this.drawGraph();
  },

  computed: {
    ...mapState(["multipleSearchValue"]),
  },

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
.tooltip {
  position: absolute;
  text-align: left;
  background-color: white;
  border-radius: 3px;
  box-shadow: rgb(174, 174, 174) 0px 0px 10px;

  padding-top: 5px;
}
.node-name {
  padding-bottom: 5px;
}
.tooltip > div {
  padding-left: 10px;
  padding-right: 10px;
}
rect#hover-node {
  stroke: rgb(169, 169, 169);
  stroke-width: 1.5px;
  transition-duration: 0.2s;
}
.node {
  cursor: pointer;
  transition-duration: 0.2s;
}
.path {
  transition-duration: 0.2s;
}
.tooltip {
  font-size: 14px;
}
.hint-list {
  font-weight: bold;
  padding-top: 5px;
  width: 60px;
}
.operate-menu {
  width: 100px;
  text-align: left;
  cursor: pointer;
  padding-top: 5px;
  padding-bottom: 5px;
}
hr {
  padding: 0;
  margin-bottom: 0;

  margin-left: 10px;
  margin-right: 10px;
}
.operate-menu:hover {
  background-color: #e1e1e1;
}
.operate-header {
  padding: 0;
  display: flex;
  line-height: 24px;
  justify-content: space-between;
}
.close-button {
  font-size: 24px;
  margin-right: 5px;
  cursor: pointer;
}
.graph-svg {
  width: 100%;
  height: 800px;
  display: flex;
}

</style>