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
      <div class="graph-svg" id="paper"></div>
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

import dagre from "dagre";
import graphlib from "graphlib";
import * as joint from "jointjs";
import "/node_modules/jointjs/dist/joint.css";
import svgPanZoom from "svg-pan-zoom";

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
      graph: null,
      paper: null,
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
      this.initGraph();
    },
    initGraph() {
      let paper = document.getElementById("paper");
      this.graph = new joint.dia.Graph();
      this.paper = new joint.dia.Paper({
        dagre: dagre,
        graphlib: graphlib,
        el: paper,
        model: this.graph,
        width: "100%",
        height: "100%",
        background: {},
        /** 是否需要显示单元格以及单元格大小(px) */
        // drawGrid: true,
        // gridSize: 20,
      });

      this.createNode();
      this.createLink();
      this.randomLayout();
      this.svgPanZoom();
      this.paperEvent();
    },
    createNode() {
      this.tooltip = this.createTooltip();
      let nodes = this.multipleSearchValue.nodesList;
      let nodeList = [];
      nodes.forEach((ele) => {
        let node = new joint.shapes.standard.Rectangle({
          id: ele.id,
          size: {
            width: 24,
            height: 24,
          },
          attrs: {
            body: {
              fill: ele.type === 0 ? "#f77" : "#000000",
              strokeWidth: 0,
              rx: 24,
              ry: 24,
            },
            title: ele.id,
          },
        });
        console.log(node);
        /** 创建的节点对象放入list */
        nodeList.push(node);
        node.addTo(this.graph);
      });
      /** 通过graph的addCell方法向画布批量添加一个list */
      //this.graph.addCell(nodeList);
    },
    createLink() {
      let links = this.multipleSearchValue.linksList;
      let linkList = [];
      links.forEach((ele) => {
        let link = new joint.shapes.standard.Link({
          source: {
            id: ele.source,
          },
          target: {
            id: ele.target,
          },
          connector: {
            name: "rounded",
          },
          attrs: {
            line: {
              connection: true,
              stroke: "#1f77b4",
              strokeWidth: ele.value * 10,
              strokeDasharray: ele.value > 0 ? "none" : "4 4",
            },
          },
        });

        link.appendLabel({
          attrs: {
            text: {
              text: ele.value,
            },
          },
        });

        /** 创建好的连线push进数组 */
        linkList.push(link);
        link.addTo(this.graph);
      });
      /** 通过graph.addCell向画布批量添加连线 */
      //this.graph.addCell(linkList);
    },
    randomLayout() {
      joint.layout.DirectedGraph.layout(this.graph, {
        dagre: dagre,
        graphlib: graphlib,
        /** 布局方向 TB | BT | LR | RL */
        rankDir: "LR",
        align: "UL",
        /** 表示列之间间隔的像素数 */
        rankSep: 150,
        /** 相同列中相邻接点之间的间隔的像素数 */
        nodeSep: 80,
        /** 同一列中相临边之间间隔的像素数 */
        edgeSep: 50,
      });
    },
    /** svgpanzoom 画布拖拽、缩放 */
    svgPanZoom() {
      /** 判断是否有节点需要渲染，否则svg-pan-zoom会报错。 */
      if (this.multipleSearchValue.nodesList.length) {
        let svgZoom = svgPanZoom("#paper svg", {
          /** 判断是否是节点的拖拽 */
          beforePan: (oldPan, newPan) => {
            if (this.currCell) {
              return false;
            }
          },
          /** 是否可拖拽 */
          panEnabled: true,
          /** 是否可缩放 */
          zoomEnabled: true,
          /** 双击放大 */
          dblClickZoomEnabled: false,
          /** 可缩小至的最小倍数 */
          minZoom: 0.3,
          /** 可放大至的最大倍数 */
          maxZoom: 5,
          /** 是否自适应画布尺寸 */
          fit: true,
          /** 图是否居中 */
          center: true,
        });
        /** 手动设置缩放敏感度 */
        svgZoom.setZoomScaleSensitivity(0.5);
      }
    },
    /** 给paper添加事件 */
    paperEvent() {
      /** 确认点击的是节点 */
      this.paper.on("element:pointerdown", (cellView, evt, x, y) => {
        this.currCell = cellView;
      });
      /** 在鼠标抬起时恢复currCell为null */
      this.paper.on("cell:pointerup blank:pointerup", (cellView, evt, x, y) => {
        this.currCell = null;
      });
    },
    showLoading() {
      const options = {
        target: document.getElementsByClassName("drawing-canvas")[0],
        background: "rgba(255, 255, 255, 0.5)",
        customClass: "counting-anime",
      };
      this.loadingInstance = Loading.service(options);
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
          this.initGraph();
          this.countingGraph = false;
        })
        .catch((error) => {
          console.log("请求失败了", error.message);
        });
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
    // create tooltip but not show it
    createTooltip() {
      return d3
        .select("body")
        .append("div")
        .classed("tooltip", true)
        .style("opacity", 0)
        .style("display", "none")
        .style("background", "rgba(0, 0, 0, 0.85)")
        .style("color", "white")
        .style("padding", "4px 16px 4px 16px");
    },
    // display node tooltip
    tipVisible(textContent, event) {
      this.tooltip.value
        .transition()
        .duration(0)
        .style("opacity", 1)
        .style("display", "block");
      this.tooltip.value
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
      this.initGraph();
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
  display: flex;
  flex-direction: column;
}
.drawing-buttons {
  height: 10;
  padding: 16px;
}
.graph-svg {
  width: 100%;
  display: flex;
  height: 90%;
  overflow: auto;
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