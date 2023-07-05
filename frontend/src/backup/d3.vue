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
      <svg v-if="!ifGroup" class="graph-svg"><g /></svg>
      <div v-else class="group-graphs">
        <div class="sum-svg">
          <div class="title">SuperGraph</div>
          <svg>
            <g />
          </svg>
        </div>
        <div class="son-svg">
          <div v-for="index in sonNum" :key="index">
            <div :id="'paper' + index"></div>
          </div>
        </div>
      </div>
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
import dagre from "dagre-d3/lib/dagre";
import { createChart } from "@/plugin/charts";
import { drawSonCharts } from "@/plugin/sonGraph";
import { countPos, countSonPos } from "@/plugin/CountPos";

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
      ifGroup: ref(false),
      loadingInstance: ref(null),
      countingGraph: ref(false),
      tooltip: null,
      nowLine: ref(),
      tooltip2: null,
      sonNum: ref(1),
      checkAll: ref(false),
      VariablesOptions,
      checkedVariables: ref([]),
      hasNoHidden: ref(true),
      multipleSearchValue: ref({
        nodesList: [],
        linksList: [],
      }),
      finalPos: ref([]),
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
    setGraph() {
      var data = this.multipleSearchValue;
      var states = data.nodesList;
      d3.select("svg").select("g").selectAll("*").remove();
      // {
      let g = new dagreD3.graphlib.Graph({ compound: true }).setGraph({
        ranker: "tight-tree",
      });

      // Automatically label each of the nodes
      states.forEach(function (state) {
        let node = {
          label: "",
          type: state.type,
        };
        if (node.type === 0) node["index"] = state.index;
        g.setNode(state.id, node);
      });
      if (this.ifGroup) {
        console.log("!");
        g.setNode("group", {
          label: "",
          clusterLabelPos: "bottom",
          style:
            "stroke-width:5;stroke:red;fill: transparent;stroke-dasharray:4 4",
        });
        states.forEach(function (state) {
          if (state.type === -1) {
            g.setParent(state.id, "group");
          }
        });
      }
      var edges = data.linksList;
      edges.forEach(function (edge) {
        if (!edge.type) {
          edge.type = 0;
        }
        var valString = (edge.value * 10).toString() + "px";
        var styleString = "stroke-width: " + valString;
        //var edgeColor = "stroke: " + cmap[edge.type % 10];
        var edgeColor = "stroke: black";
        if (edge.hidden) {
          g.setEdge(edge.source, edge.target, {
            style:
              "stroke: transparent; fill: transparent; opacity: 0;stroke-width:0",
            curve: d3.curveBasis,
            label: edge.value.toString(),
          });
        } else {
          if (edge.value < 0) {
            g.setEdge(edge.source, edge.target, {
              style:
                edgeColor +
                ";" +
                styleString +
                ";fill: transparent;stroke-dasharray:4 4",
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
        }
      });

      // Set some general styles
      g.nodes().forEach(function (v) {
        var node = g.node(v);
        node.rx = node.ry = 20;
        node.width = 20;
        node.height = 20;
        if (node.type == 0) node.style = "fill: #f77;";
        else if (node.type < 0) {
          node.style = "fill:" + cmap[0];
        }
        //else if (node.type > 0) node.style = "fill:" + cmap[node.type % 10];
      });
      dagre.layout(g);
      if (this.ifGroup) {
        this.finalPos = countPos(g);
      }
      var svg = d3.select("svg");
      let inner = svg.select("g");
      if (this.tooltip) {
        this.tipHidden();
      }
      if (this.tooltip2) {
        this.tip2Hidden();
      }
      this.tooltip = this.createTooltip();
      this.tooltip2 = this.createTooltip();
      // Set up zoom support
      let that = this;
      var zoom = d3.zoom().on("zoom", function (event) {
        inner.attr("transform", event.transform);
        that.tipHidden();
        that.tip2Hidden();
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
        })
        .attr("title", function (v) {
          return v;
        })
        .each(function (v) {
          $(this).tipsy({ gravity: "n", opacity: 1, html: true });
        });

      // add hover effect & click hint to lines
      var onmousepath = d3.selectAll(".edgePath");
      var allpathes = onmousepath.select(".path");
      const _this = this;
      allpathes
        .on("mouseout", function (d, id) {
          allpathes.style("opacity", "1");
          _this.tipHidden();
        })
        .on("mouseover", function (d, id) {
          if (_this.isVisible(id)) {
            allpathes.style("opacity", ".2"); // set all edges opacity 0.2
            d3.select(this).style("opacity", "1");
          }
          _this.tipVisible(id.v + "-" + id.w, {
            pageX: d.pageX,
            pageY: d.pageY,
          });
        })
        .on("click", function (d, id) {
          if (_this.isVisible(id)) {
            _this.nowLine = id;
            let hintHtml =
              "<div class='operate-header'><div class='hint-list'>operate</div><div class='close-button'>x</div></div><hr/>\
            <div class='operate-menu'>Delete edge<br/>(" +
              id.v +
              ", " +
              id.w +
              ")</div><hr/><div class='operate-menu'>Reverse Direction</div>";
            _this.tip2Visible(hintHtml, { pageX: d.pageX, pageY: d.pageY });
            setTimeout(() => {
              _this.tipWatchBlur();
            }, 0);
          }
        });
      // Center the graph
      var initialScale = 0.4;
      let xOffset = (450 - g.graph().width * initialScale) / 2;
      let yOffset = (450 - g.graph().height * initialScale) / 2;
      svg.call(
        zoom.transform,
        d3.zoomIdentity.translate(xOffset, yOffset).scale(initialScale)
      );

      svg.attr("height", g.graph().height * initialScale + 40);
      if (this.ifGroup) {
        this.drawSonGraphs();
      }
    },
    drawGraph() {
      this.ifGroup = false;
      let that = this;
      this.sonNum = 0;
      this.multipleSearchValue.nodesList.forEach(function (state) {
        if (state.type === -1) that.ifGroup = true;
        else if (state.type === 0) that.sonNum++;
      });
      console.log(this.ifGroup);
      setTimeout(() => {
        this.setGraph();
      }, 0);
    },
    plotChart(line) {
      let dom = document.getElementsByClassName(line)[0];
      createChart(dom, line);
    },

    drawSonGraphs() {
      let sonGraphs = [];
      let gap = {
        xGap: 100,
        yGap: 100,
      };
      for (let i = 1; i <= this.sonNum; i++) {
        let ans = countSonPos(this.finalPos[i], this.finalPos[0]);
        sonGraphs.push(ans.sonPos);
        if (ans.gap.xGap < gap.xGap) {
          gap.xGap = ans.gap.xGap;
        }
        if (ans.gap.yGap < gap.yGap) {
          gap.yGap = ans.gap.yGap;
        }
      }

      for (let i = 1; i <= this.sonNum; i++) {
        let dom = document.getElementById("paper" + i);
        drawSonCharts(
          dom,
          sonGraphs[i - 1],
          this.multipleSearchValue.linksList.filter((link) => {
            return !link.hidden;
          }),
          gap,
          "paper" + i
        );
      }
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
      if (link[0].hidden) return false;
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
        if (row.type !== 0) newFac.push(row.id);
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
          console.log("请求失败了", error);
        });
    },
    //add document click listener
    tipWatchBlur() {
      document.addEventListener("click", this.listener);
      console.log("listener");
    },
    tip2WatchBlur() {
      document.addEventListener("click", this.listener2);
      console.log("listener");
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
      _this.tip2Hidden();
      if (
        clickDOM !== "operate-menu" &&
        clickDOM !== "hint-menu" &&
        clickDOM !== "hint-list" &&
        clickDOM !== "tooltip" &&
        clickDOM !== "operate-header"
      ) {
        document.removeEventListener("click", _this.listener);
      } else if (clickDOM === "operate-menu") {
        let text = e.target.innerText;
        if (text.includes("Delete")) this.deleteEdge(text);
        else this.reverseDirection();
      }
    },
    listener2(e) {
      let _this = this;
      let clickDOM = e.target.className;
      _this.tip2Hidden();
      if (
        clickDOM !== "operate-menu" &&
        clickDOM !== "hint-menu" &&
        clickDOM !== "hint-list" &&
        clickDOM !== "tooltip" &&
        clickDOM !== "operate-header"
      ) {
        document.removeEventListener("click", _this.listener2);
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
    reverseDirection() {},
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
        this.tip2Hidden();
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
    // display hover-line tooltip
    tipVisible(textContent, event) {
      document.removeEventListener("click", this.listener);
      document.removeEventListener("click", this.listener2);
      this.tooltip
        .transition()
        .duration(0)
        .style("opacity", 1)
        .style("display", "block");
      this.tooltip
        .html(
          '<div class="chart-box">' +
            textContent +
            '<div class="chart-hint ' +
            textContent +
            '"></div></div>'
        )
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY + 15}px`);

      const _this = this;
      setTimeout(() => {
        try {
          _this.plotChart(textContent);
        } catch (err) {
          console.log("too fast, the chart is not prepared");
        }
      }, 100);
    },
    //display delete-menu tooltip
    tip2Visible(textContent, event) {
      document.removeEventListener("click", this.listener);
      document.removeEventListener("click", this.listener2);
      this.tooltip2
        .transition()
        .duration(0)
        .style("opacity", 1)
        .style("display", "block");
      this.tooltip2
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
    tip2Hidden() {
      this.tooltip2
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
  stroke: rgba(169, 169, 169, 0.562);
  fill: #333;
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
  height: 100%;
  overflow: hidden;
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
.group-graphs {
  width: 100%;
  display: flex;
  height: 90%;
}
.sum-svg {
  position: absolute;
  left: 16px;
  bottom: 16px;
  padding: 16px;
  width: 458px;
  height: 480px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.sum-svg .title {
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: bold;
}
.sum-svg svg {
  height: 450px;
  width: 458px;
}
.son-svg {
  width: 35%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.son-svg div {
  padding: 16px;
  flex: 1;
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
.chart-box {
  display: flex;
  padding: 8px;
  flex-direction: column;
  height: 180px;
  justify-content: center;

  width: 300px;
  align-items: center;
}
.chart-hint {
  display: flex;
  height: 170px;
  width: 284px;
}
</style>