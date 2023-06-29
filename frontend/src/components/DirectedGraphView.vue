<template>
  <div id="DirectedGraph">
    <div class="graph-info-header">
      <div class="graph-title">DirectedGraph View</div>
      <!--
        Todo:To achieve real-time rendering
      -->
      <div class="graph-main-title">· VariablesCheckbox</div>

      <!--
        Todo:To achieve getting variables from VariablesCheckbox
      -->
      <el-checkbox v-model="checkAll" @change="handleCheckAllChange"
        >Select All</el-checkbox
      >
      <div style="margin: 15px 0"></div>
      <el-checkbox-group v-model="checkedVariables">
        <el-checkbox
          v-for="Variable in VariablesOptions"
          :label="Variable"
          :key="Variable"
          @change="handleCheckedVariablesChange($event, Variable)"
          >{{ Variable }}</el-checkbox
        >
      </el-checkbox-group>
      <br />
      <el-button
        @click="getLinks"
        class="draw-directed-button"
        :disabled="countingGraph"
      >
        Plot the nodes selected
      </el-button>
      <div class="hint">
        <span>Note: </span>Modifying Nodes will affect previous changes to
        edges; Re-layout is only possible after removing edges
      </div>
    </div>
    <hr />
    <div class="drawing-canvas">
      <div class="drawing-buttons">
        <el-button @click="saveToTable" type="success" size="small" round
          >Save to Table</el-button
        >
        <el-button
          @click="truelyDelete()"
          type="success"
          round
          size="small"
          :disabled="hasNoHidden"
        >
          Relayout
        </el-button>
      </div>
      <svg class="graph-svg"><g /></svg>
    </div>
    <!-- 缓存一个路由组件 -->
  </div>
</template>
    
</template>

<script>
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import axios from "axios";
import { ref } from "vue";
import { Loading } from "element-ui";
import VariablesOptions from "@/plugin/variable";

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
  setup() {
    return {};
  },
  data() {
    return {
      loadingInstance: ref(null),
      countingGraph: ref(false),
      tooltip: null,
      checkAll: ref(false),
      VariablesOptions,
      checkedVariables: ref([]),
      hasNoHidden: ref(true),
      multipleSearchValue: ref({
        nodesList: [],
        linksList: [],
      }),
    };
  },
  methods: {
    saveToTable() {
      this.saveData();
      this.$router.push({
        path: this.$route.path,
        query: {
          mode: "save",
        },
      });
    },
    truelyDelete() {
      console.log("delete edge");
      let linksList = this.multipleSearchValue.linksList.filter(
        (link) => !link.hidden
      );
      this.multipleSearchValue.linksList = linksList;
      this.hasNoHidden = true;
      this.saveData();
      this.drawGraph();
    },
    drawGraph() {
      var data = this.multipleSearchValue;
      // {
      var g = new dagreD3.graphlib.Graph().setGraph({});

      // Test with our 3 graph graph(s)
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
        if (edge.hidden) {
          g.setEdge(edge.source, edge.target, {
            style:
              "stroke: transparent; fill: transparent; opacity: 0;stroke-width:0",
            curve: d3.curveBasis,
            label: edge.value.toString(),
          });
        } else {
          g.setEdge(edge.source, edge.target, {
            style: edgeColor + ";" + styleString + ";fill: transparent",
            curve: d3.curveBasis,
            label: edge.value.toString(),
          });
        }
      });

      // Set some general styles
      g.nodes().forEach(function (v) {
        var node = g.node(v);
        node.rx = node.ry = 5;
        if (node.type == 0) node.style = "fill: #f77;";
      });

      var svg = d3.select("svg");
      let inner = svg.select("g");
      if (this.tooltip) {
        this.tipHidden();
      }
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
          v.fromElement.setAttribute("id", "hover-node");
        })
        .on("mouseout", (v) => {
          v.fromElement.setAttribute("id", "");
        })
        .on("click", (d, id) => {
          if (!this.ifOutCome(id)) {
            let hintHtml =
              "<div class='operate-header'><div class='hint-list'>operate</div><div class='close-button'>x</div></div><hr/>\
            <div class='operate-menu'>Delete node " +
              id +
              "</div>";
            _this.tip2Visible(hintHtml, { pageX: d.pageX, pageY: d.pageY });
            setTimeout(() => {
              _this.tip2WatchBlur();
            }, 0);
          }
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
          if (_this.isVisible(id)) {
            allpathes.style("opacity", ".2"); /* set all edges opacity 0.2 */
            d3.select(this).style("opacity", "1");
          }
        })
        .on("click", function (d, id) {
          if (_this.isVisible(id)) {
            let hintHtml =
              "<div class='operate-header'><div class='hint-list'>operate</div><div class='close-button'>x</div></div><hr/>\
            <div class='operate-menu'>Delete edge<br/>(" +
              id.v +
              ", " +
              id.w +
              ")</div>";
            _this.tip2Visible(hintHtml, { pageX: d.pageX, pageY: d.pageY });
            setTimeout(() => {
              _this.tipWatchBlur();
            }, 0);
          }
        });

      // Center the graph
      var initialScale = 1;
      svg.call(
        zoom.transform,
        d3.zoomIdentity.translate(300, 200).scale(initialScale)
      );

      svg.attr("height", g.graph().height * initialScale + 40);

      return data;
    },
    showLoading() {
      const options = {
        target: document.getElementsByClassName("drawing-canvas")[0],
        background: "rgba(255, 255, 255, 0.5)",
        customClass: "counting-anime",
      };
      this.loadingInstance = Loading.service(options);
    },
    ifOutCome(node) {
      let allOut = [];
      this.multipleSearchValue.nodesList.map((row) => {
        if (row.type === 0) allOut.push(row.id);
      });
      if (allOut.includes(node)) return true;
      else return false;
    },
    isVisible(path) {
      let link = this.multipleSearchValue.linksList.filter(
        (item) => item.source === path.v && item.target === path.w
      );
      if (link[0].hidden === true) return false;
      else return true;
    },
    saveData() {
      localStorage.setItem(
        "GET_JSON_RESULT",
        JSON.stringify(this.multipleSearchValue)
      );
    },
    getLinks() {
      this.hasNoHidden = true;
      let newFac = [];
      let newOut = [];
      this.multipleSearchValue.nodesList.forEach((row) => {
        if (row.type === 1) newFac.push(row.id);
      });
      this.multipleSearchValue.nodesList.map((row) => {
        if (row.type === 0) newOut.push(row.id);
      });
      this.countingGraph = true;
      this.showLoading();
      axios({
        //请求类型
        method: "GET",
        //URL
        url: "http://localhost:8000/api/getLink",
        //参数
        params: {
          outcomes: newOut.join(),
          factors: newFac.join(),
        },
      })
        .then((response) => {
          console.log("new links", response.data);
          this.multipleSearchValue = {
            linksList: response.data.links,
            nodesList: response.data.nodes,
          };

          this.loadingInstance.close();
          this.loadingInstance = null;

          this.saveData();
          this.drawGraph();
          this.countingGraph = false;
        })
        .catch((error) => {
          console.log("请求失败了", error.message);
        });
    },
    //add document click listener
    tipWatchBlur() {
      document.addEventListener("click", this.listener);
    },
    tip2WatchBlur() {
      document.addEventListener("click", this.listener2);
    },
    handleCheckAllChange(val) {
      if (val === true) {
        this.checkedVariables = VariablesOptions;
        this.checkedVariables.forEach((factor) => {
          let ifIndex = this.multipleSearchValue.nodesList.findIndex(function (
            row
          ) {
            if (row.id === factor) return true;
            else return false;
          });
          if (ifIndex < 0) {
            this.multipleSearchValue.nodesList.push({
              type: 1,
              id: factor,
            });
          }
        });
      } else {
        this.checkedVariables = [];
        let newNodes = [];
        this.multipleSearchValue.nodesList.forEach((row) => {
          if (row.type === 0) {
            newNodes.push(row);
          }
        });
        this.multipleSearchValue.nodesList = newNodes;
      }
    },
    handleCheckedVariablesChange(value, factor) {
      let ifIndex = this.multipleSearchValue.nodesList.findIndex(function (
        row
      ) {
        if (row.id === factor) return true;
        else return false;
      });
      if (value && ifIndex < 0) {
        this.multipleSearchValue.nodesList.push({
          type: 1,
          id: factor,
        });
      } else if (!value && ifIndex >= 0) {
        this.multipleSearchValue.nodesList.splice(ifIndex, 1);
      }
    },
    //document click listener => to close line tooltip
    listener(e) {
      let _this = this;
      let clickDOM = e.target.className;
      if (
        clickDOM !== "operate-menu" &&
        clickDOM !== "hint-menu" &&
        clickDOM !== "hint-list" &&
        clickDOM !== "tooltip" &&
        clickDOM !== "operate-header"
      ) {
        _this.tipHidden();
        document.removeEventListener("click", _this.listener);
      } else if (clickDOM === "operate-menu") {
        let text = e.target.innerText;
        this.deleteEdge(text);
      }
    },
    listener2(e) {
      let _this = this;
      let clickDOM = e.target.className;
      if (
        clickDOM !== "operate-menu" &&
        clickDOM !== "hint-menu" &&
        clickDOM !== "hint-list" &&
        clickDOM !== "tooltip" &&
        clickDOM !== "operate-header"
      ) {
        _this.tipHidden();
        document.removeEventListener("click", _this.listener);
      } else if (clickDOM === "operate-menu") {
        let text = e.target.innerText;
        this.deleteNode(text);
      }
    },
    deleteNode(node) {
      console.log("delete node");

      let nodeName = node.split(" ")[2];
      let nodeList = this.multipleSearchValue.nodesList.filter(
        (node) => node.id !== nodeName
      );
      this.multipleSearchValue.nodesList = nodeList;
      let index = this.checkedVariables.indexOf(nodeName);
      this.checkedVariables.splice(index, 1);
      this.tipHidden();
      this.getLinks();
      /*
      let linkList = this.multipleSearchValue.linksList.filter(
        (link) => link.source !== nodeName && link.target !== nodeName
      );
      this.multipleSearchValue = {
        nodesList: nodeList,
        linksList: linkList,
        CovariantNum: this.multipleSearchValue.CovariantNum - 1,
      };

      this.drawGraph();
      */
    },
    deleteEdge(edge) {
      let nodes = edge.split("(")[1].split(")")[0].split(", ");

      let index = this.multipleSearchValue.linksList.findIndex(function (row) {
        if (row.source === nodes[0] && row.target === nodes[1]) {
          return true;
        } else return false;
      });
      if (index > -1) {
        this.multipleSearchValue.linksList[index] = {
          source: this.multipleSearchValue.linksList[index].source,
          target: this.multipleSearchValue.linksList[index].target,
          value: this.multipleSearchValue.linksList[index].value,
          hidden: true,
        };
        this.saveData();
        this.hasNoHidden = false;
        this.tipHidden();
        this.drawGraph();
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
      document.removeEventListener("click", this.listener2);
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
      document.removeEventListener("click", this.listener2);
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
    this.multipleSearchValue = JSON.parse(
      localStorage.getItem("GET_JSON_RESULT")
    );
    console.log("getItem", this.multipleSearchValue);
    if (this.multipleSearchValue) {
      this.checkedVariables = this.multipleSearchValue.nodesList.map((node) => {
        return node.id;
      });
      let hiddenNodes = this.multipleSearchValue.linksList.filter(
        (link) => link.hidden
      );
      if (hiddenNodes.length > 0) this.hasNoHidden = false;
      this.drawGraph();
    }
  },

};
</script>

<style>
.label > g > text {
  fill: white;
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
  width: auto;
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
</style>
<style scoped>
#DirectedGraph {
  flex: 3;
  display: flex;
  flex-direction: column;
}
.graph-info-header {
  padding: 16px;
  height: auto;
}
.graph-title {
  font-size: 36px;
}
.draw-directed-button {
  background-color: #fa95a6;
  color: white;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  padding: 8px 16px 8px 16px;
}
.save-button {
  margin-left: 8px;
  background-color: #fa95a6;
  color: white;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  padding: 8px 16px 8px 16px;
}
.hint {
  font-size: 14px;
  margin-top: 16px;
}
.hint span {
  color: red;
}
.hint::before {
  content: "* ";
  color: red;
}
.draw-directed-button:hover {
  box-shadow: 0 0 3px 1px #e8e8e8;
  transition-duration: 0.1s;
}
.draw-directed-button:active {
  background-color: #f77;
  color: white;
}
.save-button:hover {
  box-shadow: 0 0 3px 1px #e8e8e8;
  transition-duration: 0.1s;
}
.drawing-canvas {
  flex: 1;
}
.drawing-buttons {
  height: 10;
  padding: 16px;
}
.graph-svg {
  width: 100%;
  display: flex;
  height: 90%;
}
.graph-main-title {
  font-size: 20px;
  margin-top: 20px;
  font-weight: bold;
  line-height: 36px;
}
.graph-subtitle {
  font-size: 18px;
  font-weight: bold;
  line-height: 32px;
}
</style>
<style>
.counting-anime {
  position: absolute !important;
  top: 0;
  height: 100%;
}
</style>