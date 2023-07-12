<template>
  <div id="DirectedGraph">
    <div class="graph-info-header">
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
        edges; Re-layout is only possible after removing or reversing edges
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
import dagre from "dagre-d3/lib/dagre";
import { createChart } from "@/plugin/charts";
import singleGraph from "@/plugin/singleGraph";
import historyManage from "@/plugin/history";

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
      tooltip2: null,
      menuShow: ref(false),
      checkAll: ref(false),
      VariablesOptions,
      checkedVariables: ref([]),
      hasNoHidden: ref(true),
      tip2Show: ref(false),
      transform: ref(),
      multipleSearchValue: ref({
        nodesList: [],
        linksList: [],
      }),
    };
  },
  methods: {
    saveToTable() {
      localStorage.setItem(
        "GET_SAVE_DATA",
        JSON.stringify(this.multipleSearchValue)
      );
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
      linksList = linksList.map((link) => {
        if (link.reverse)
          return {
            source: link.target,
            target: link.source,
            value: link.value,
          };
        else return link;
      });
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
          label: state.id,
          type: state.type,
        };
        if (node.type === 0) node["index"] = state.index;
        g.setNode(state.id, node);
      });

      var edges = data.linksList;
      edges.forEach(function (edge) {
        var valString = (edge.value * 10).toString() + "px";
        if (edge.value < 0) {
          valString = (-edge.value * 10).toString() + "px";
        }
        var widthStr = "stroke-width: " + valString;
        var edgeColor = "stroke: black";
        let completeStyle =
          edgeColor + ";" + widthStr + ";" + "fill: transparent;";
        if (edge.hidden) {
          g.setEdge(edge.source, edge.target, {
            style:
              "stroke: transparent; fill: transparent; opacity: 0;stroke-width:0",
            curve: d3.curveBasis,
          });
        } else {
          if (edge.reverse)
            completeStyle = completeStyle + "marker-start:url(#normals);";
          else completeStyle = completeStyle + "marker-end:url(#normale);";
          if (edge.value < 0) {
            g.setEdge(edge.source, edge.target, {
              style: completeStyle + "stroke-dasharray:4 4",
              curve: d3.curveBasis,
              arrowhead: "undirected",
            });
          } else {
            g.setEdge(edge.source, edge.target, {
              style: completeStyle,
              curve: d3.curveBasis,
              arrowhead: "undirected",
            });
          }
        }
      });
      let that = this;
      // Set some general styles
      g.nodes().forEach(function (v) {
        var node = g.node(v);
        node.rx = node.ry = 5;

        if (node.type == 0) node.style = "fill: #f77;";
        else {
          node.style = "fill:" + cmap[0];
        }
      });
      dagre.layout(g);

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

      var zoom = d3.zoom().on("zoom", function (event) {
        console.log(event.transform);
        that.transform = event.transform;
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
              document.addEventListener("click", _this.listener2);
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
      // Center the graph

      if (that.transform) {
        inner.attr("transform", that.transform);
      } else {
        var initialScale = 1;
        let xOffset = (1200 - g.graph().width * initialScale) / 2;
        let yOffset = (450 - g.graph().height * initialScale) / 2;
        svg.call(
          zoom.transform,
          d3.zoomIdentity.translate(xOffset, yOffset).scale(initialScale)
        );

        svg.attr("height", g.graph().height * initialScale + 40);
      }
      var onmousepath = svg.selectAll(".edgePath");
      var allpathes = onmousepath.select(".path");
      const _this = this;
      singleGraph.addArrowType(svg);
      allpathes
        .on("mouseout", function (d, id) {
          if (d3.select(this).style("stroke") !== "transparent") {
            d3.select(this).style("stroke", "black");
            if (!_this.isReverse(id)) {
              d3.select(this).style("marker-end", "url(#normale)"); //Added
            } else {
              d3.select(this).style("marker-start", "url(#normals)"); //Added
            }
          }
          _this.tipHidden();
        })
        .on("mouseover", function (d, id) {
          if (d3.select(this).style("stroke") !== "transparent") {
            if (!_this.isReverse(id)) {
              d3.select(this).style("marker-end", "url(#activeE)"); //Added
            } else {
              d3.select(this).style("marker-start", "url(#activeS)"); //Added
            }
            d3.select(this).style("stroke", "#1f77b4");
            let width = d3.select(this).style("stroke-width");
            let dash = d3.select(this).style("stroke-dasharray");
            console.log(dash);
            width.slice(width.length - 2, width.length);
            if (dash.includes('4')) {
              width = "-" + width;
            }
            if (!_this.tip2Show)
              _this.tipVisible(
                id.v + "-" + id.w + ": " + parseFloat(width).toFixed(2),
                {
                  pageX: d.pageX,
                  pageY: d.pageY,
                }
              );
          }
        })
        .on("click", function (d, id) {
          if (d3.select(this).style("stroke") !== "transparent") {
            let hintHtml =
              "<div class='operate-header'><div class='hint-list'>operate</div><div class='close-button'>x</div></div><hr/>\
            <div class='operate-menu'>Delete edge<br/>(" +
              id.v +
              ", " +
              id.w +
              ")</div><hr/><div class='operate-menu'>Reverse Direction</div>";
            _this.tip2Visible(hintHtml, { pageX: d.pageX, pageY: d.pageY });
            setTimeout(() => {
              document.addEventListener("click", _this.listener);
            }, 0);
          }
        });
    },
    drawGraph() {
      setTimeout(() => {
        this.setGraph();
      }, 0);
    },
    plotChart(line) {
      let dom = document.getElementsByClassName(line)[0];
      createChart(dom, line);
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
            history: this.multipleSearchValue.history,
          };
          historyManage.reDoHistory(this.multipleSearchValue);
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
        clickDOM !== "operate-header" &&
        clickDOM !== "son-header"
      ) {
        document.removeEventListener("click", _this.listener);
      } else if (clickDOM === "operate-menu") {
        let text = e.target.innerText;
        if (text.includes("Delete")) this.deleteEdge(text);
        else {
          let text = e.srcElement.parentElement.children[2].innerText;
          this.reverseDirection(text);
        }
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
        clickDOM !== "operate-header" &&
        clickDOM !== "son-header"
      ) {
        document.removeEventListener("click", _this.listener2);
      } else if (clickDOM === "operate-menu") {
        let text = e.target.innerText;
        this.deleteNode(text);
      }
    },
    listener3(e) {
      let _this = this;
      let clickDOM = e.target.className;
      _this.tip2Hidden();
      if (
        clickDOM !== "operate-menu" &&
        clickDOM !== "hint-menu" &&
        clickDOM !== "hint-list" &&
        clickDOM !== "tooltip" &&
        clickDOM !== "operate-header" &&
        clickDOM !== "son-header"
      ) {
        document.removeEventListener("click", _this.listener3);
      } else if (clickDOM === "operate-menu") {
        let text = e.target.innerText;
        this.deleteSonEdge(text);
      }
    },
    deleteSonEdge(text) {
      console.log(text);
    },
    deleteNode(node) {
      let nodeName = node.split(" ")[2];
      let nodeList = this.multipleSearchValue.nodesList.filter(
        (node) => node.id !== nodeName
      );
      this.multipleSearchValue.nodesList = nodeList;
      let index = this.checkedVariables.indexOf(nodeName);
      this.checkedVariables.splice(index, 1);
      this.tipHidden();
      this.getLinks();
    },
    isReverse(edge) {
      let index = this.multipleSearchValue.linksList.findIndex(function (row) {
        if (row.source === edge.v && row.target === edge.w && !row.hidden) {
          return true;
        } else return false;
      });
      if (index < 0) return false;
      return this.multipleSearchValue.linksList[index].reverse === true;
    },

    reverseDirection(edge) {
      let nodes = edge.split("(")[1].split(")")[0].split(", ");
      let index = this.multipleSearchValue.linksList.findIndex(function (row) {
        if (row.source === nodes[0] && row.target === nodes[1] && !row.hidden) {
          return true;
        } else return false;
      });
      if (index > -1) {
        if (!this.multipleSearchValue.linksList[index].reverse) {
          this.multipleSearchValue.linksList[index]["reverse"] = true;
          historyManage.reverseEdge(this.multipleSearchValue.history, {
            source: nodes[0],
            target: nodes[1],
          });
          this.hasNoHidden = false;
        } else {
          this.multipleSearchValue.linksList[index].reverse = false;
          history.source = nodes[1];
          history.target = nodes[0];
          historyManage.reverseEdge(this.multipleSearchValue.history, {
            source: nodes[1],
            target: nodes[0],
          });
        }
        this.saveData();
        this.tip2Hidden();
        this.drawGraph();
      }
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
        this.multipleSearchValue.history = historyManage.deleteEdge(
          this.multipleSearchValue.history,
          {
            source: this.multipleSearchValue.linksList[index].source,
            target: this.multipleSearchValue.linksList[index].target,
          }
        );
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
      this.tip2Hidden();
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
      this.tip2Hidden();
      document.removeEventListener("click", this.listener);
      document.removeEventListener("click", this.listener2);
      this.tip2Show = true;
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
      this.tip2Show = false;
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
      let hiddenOrReverse = this.multipleSearchValue.linksList.filter(
        (link) => link.hidden || link.reverse
      );
      if (hiddenOrReverse.length > 0) this.hasNoHidden = false;
      this.drawGraph();
    }
  },
};
</script>

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
  padding: 16px;
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
  top: calc(8vh + 650px);
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
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-left: 16px;
  padding-right: 16px;
}
.paper-svg {
  flex: 1;
  min-width: 25%;
  max-width: 100%;
}
.son-svg div svg {
  width: 100%;
  height: 90%;
}
.one-line-operator {
  height: 10%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.son-title {
  font-size: 16px;
  font-weight: bold;
}
.one-line-operator .drawing-buttons {
  display: flex;
  justify-content: flex-end;
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

