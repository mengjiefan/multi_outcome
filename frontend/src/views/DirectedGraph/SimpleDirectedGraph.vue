<template>
  <div id="DirectedGraph">
    <div class="graph-info-header">
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
      <div id="paper" class="sum-svg"></div>
    </div>
  </div>
</template>
    
</template>

<script>
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import axios from "axios";
import { ref } from "vue";
import { Loading } from "element-ui";
import { defaultFactors, ukbFactors, clhlsFactors } from "@/plugin/variable";
import dagre from "dagre-d3/lib/dagre";
import { createChart } from "@/plugin/charts";
import * as joint from "jointjs";
import { drawSuperGraph, showHiddenEdge } from "@/plugin/superGraph";
import historyManage from "@/plugin/history";
import { addHighLight, removeHighLight } from "@/plugin/sonGraph";
import { countSimplePos } from "@/plugin/extracted/CountPos";
import { findLink } from "@/plugin/links";
import { linkRequest } from "@/plugin/request/edge.js";

var cmap = [
  "#FF595E",
  "#FF924C",
  "#FFCA3A",
  "#C5CA30",
  "#8AC926",
  "#36949D",
  "#1982C4",
  "#4267AC",
  "#565AA0",
  "#6A4C93",
];

export default {
  name: "DirectedGraph",
  setup() {
    return {};
  },
  data() {
    return {
      deleteLinkView: ref(),
      paper: ref(),
      dataset: ref(),
      chartVisible: ref(false),
      loadingInstance: ref(null),
      countingGraph: ref(false),
      tooltip: null,
      tooltip2: null,
      menuShow: ref(false),
      checkAll: ref(false),
      VariablesOptions: ref(defaultFactors),
      checkedVariables: ref([]),
      hasNoHidden: ref(true),
      tip2Show: ref(false),
      transform: ref(),
      simplePos: ref(),
      multipleSearchValue: ref({
        nodesList: [],
        linksList: [],
      }),
    };
  },
  methods: {
    saveToTable() {
      console.log(this.multipleSearchValue.history);
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
      this.simplePos = null;
      let linksList = this.multipleSearchValue.linksList.filter(
        (link) => !link.hidden
      );
      //去除孤点
      //remove unrelated nodes
      let nodesList = this.multipleSearchValue.nodesList.filter((node) => {
        let index = linksList.findIndex((link) => {
          if (link.source === node.id || link.target === node.id) return true;
          else return false;
        });
        return index > -1;
      });
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
      this.multipleSearchValue.nodesList = nodesList;
      this.hasNoHidden = true;
      this.saveData();
      this.setGraph();
    },
    setGraph() {
      var data = this.multipleSearchValue;
      var states = data.nodesList;
      // {
      let g = new dagreD3.graphlib.Graph({ compound: true }).setGraph({
        ranker: "tight-tree",
      });

      states.forEach(function (state) {
        let node = {
          label: "",
          type: state.type,
        };
        if (node.type === 0) node["index"] = state.index;
        g.setNode(state.id, node);
      });
      let that = this;

      var edges = data.linksList;

      edges.forEach(function (edge) {
        let edgeValue = edge.value > 0 ? edge.value * 10 : -edge.value * 10;
        var valString = edgeValue.toString() + "px";
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
          if (edge.value < 0) {
            completeStyle = completeStyle + "stroke-dasharray:4 4";
          }
          g.setEdge(edge.source, edge.target, {
            style: completeStyle,
            arrowhead: "undirected",
          });
        }
      });

      // Set some general styles
      g.nodes().forEach(function (v) {
        var node = g.node(v);
        node.rx = node.ry = 20;
        node.style = "fill:" + cmap[0];
      });
      dagre.layout(g);
      //this.getAnchoredGraph(g);
      //save positon and redraw, which need to know the direction of edges
      const simpleG = g;

      this.simplePos = countSimplePos(
        simpleG,
        this.multipleSearchValue.nodesList,
        this.multipleSearchValue.linksList
      );
      console.log("simplePos", this.simplePos);
      setTimeout(() => {
        that.drawGraph();
      }, 0);
      // Set up zoom support
    },
    getWidth(router) {
      let nodes = router.split(", ");
      nodes[0] = nodes[0].slice(1, nodes[0].length);
      nodes[1] = nodes[1].slice(0, nodes[1].length - 1);
      let value = 0;
      this.multipleSearchValue.linksList.forEach((link) => {
        if (link.source === nodes[0] && link.target === nodes[1])
          value = link.value;
        else if (link.target === nodes[0] && link.source === nodes[1])
          value = link.value;
      });
      return value.toFixed(3);
    },
    checkDirection(source, target) {
      if (!this.simplePos || this.simplePos.nodesList.length <= 0)
        return "DOWN";
      let sIndex = this.simplePos.nodesList.findIndex((node) => {
        if (node.id === source) return true;
        else return false;
      });
      let tIndex = this.simplePos.nodesList.findIndex((node) => {
        if (node.id === target) return true;
        else return false;
      });
      if (sIndex < 0 || tIndex < 0) return "DOWN";
      if (
        this.simplePos.nodesList[sIndex].y <= this.simplePos.nodesList[tIndex].y
      )
        return "DOWN";
      else return "UP";
    },
    drawGraph() {
      this.simplePos.nodesList.forEach((node) => {
        if (node.type === 0) node["indexes"] = ["8"];
        else node["indexes"] = ["0"];
      });
      if (this.tooltip) {
        this.tipHidden();
      }
      if (this.tooltip2) {
        this.tip2Hidden();
      }
      this.tooltip = this.createTooltip(1);
      this.tooltip2 = this.createTooltip(2);
      let dom = document.getElementById("paper");
      let minW = 150000;
      let maxW = 0;
      let minH = 15000;
      let maxH = 0;
      this.simplePos.nodesList.forEach((node) => {
        if (node.x > maxW) maxW = node.x;
        if (node.x < minW) minW = node.x;
        if (node.y > maxH) maxH = node.y;
        if (node.y < minH) minH = node.y;
      });
      this.simplePos.linksList.forEach((link) => {
        link.points.forEach((node) => {
          if (node.x > maxW) maxW = node.x;
          if (node.x < minW) minW = node.x;
          if (node.y > maxH) maxH = node.y;
          if (node.y < minH) minH = node.y;
        });
      });
      let gap = 1200 / (maxW - minW);
      if (600 / (maxH - minH) < gap) gap = 600 / (maxH - minH);
      let startX = (dom.clientWidth - gap * (maxW - minW)) / 2;
      let startY = (dom.clientHeight - gap * (maxH - minH)) / 3;
      this.scale = {
        startX,
        startY,
        gap,
      };
      let paper = drawSuperGraph(
        dom,
        this.simplePos.nodesList,
        this.simplePos.linksList,
        this.scale
      );
      this.setPaper(paper);
    },
    plotChart(line) {
      let dom = document.getElementsByClassName(line)[0];
      createChart(dom, line);
    },
    getNode(nodeView) {
      return nodeView.model.attributes.attrs.title;
    },
    getLinkNode(paper, link) {
      let graph = paper.model.attributes.cells.graph;
      let sourceNode = null;
      let targetNode = null;
      graph.getElements().forEach((node) => {
        if (node.id === link.get("source").id) sourceNode = node;
      });
      graph.getElements().forEach((node) => {
        if (node.id === link.get("target").id) targetNode = node;
      });
      let source = this.getNode(sourceNode.findView(paper));
      let target = this.getNode(targetNode.findView(paper));
      return { source, target };
    },
    showHiddenLink(source, target) {
      let index = findLink.showSameDireLink(
        { source, target },
        this.simplePos.linksList
      );
      let link = this.simplePos.linksList[index];
      showHiddenEdge(this.paper, link, this.scale, this.simplePos);
      historyManage.addEdge(this.multipleSearchValue.history, link);
      this.saveData();
    },
    reverseAndShow(source, target, value) {
      let index = findLink.showReverseLink(
        { source, target },
        this.multipleSearchValue.linksList
      );

      let link = this.multipleSearchValue.linksList[index];
      if (link.reverse) link.reverse = false;
      else link["reverse"] = true;
      link.value = value;
      index = findLink.showReverseLink(
        { source, target },
        this.simplePos.linksList
      );

      link = this.simplePos.linksList[index];
      link.source = source;
      link.target = target;
      if (link.reverse) link.reverse = false;
      else link.points.reverse();
      link.value = value;
      this.showHiddenLink(source, target);
    },
    //历史记录加边操作
    //隐藏边，变为不隐藏，否则添加边
    //有值则直接用，反向则计算
    addTempLink(source, target) {
      let oIndex = findLink.sameNodeLink(
        { source, target },
        this.multipleSearchValue.linksList
      );
      if (oIndex > -1) {
        let originalLink = this.multipleSearchValue.linksList[oIndex];

        this.deleteLinkView.model.remove({ ui: true });
        if (originalLink.hidden) originalLink.hidden = false;
        if (originalLink.source !== source) {

          linkRequest.getLinkValue(source, target).then((response) => {
            let value = response.data.value;
            this.reverseAndShow(source, target, value);
          });
        } else this.showHiddenLink(source, target);
      } else this.getEdgeValue(source, target);
    },
    setPaper(paper) {
      const _this = this;
      let graph = paper.model.attributes.cells.graph;
      graph.on("change:source change:target", function (link) {
        if (link.get("source").id && link.get("target").id) {
          _this.deleteLinkView = link.findView(paper);
          _this.paper = paper;
          let realLink = _this.getLinkNode(paper, link);
          let flag = true;
          graph.getCells().forEach((item) => {
            if (item.attributes.type.includes("Link")) {
              let realItem = _this.getLinkNode(paper, item);
              if (
                link.id !== item.id &&
                realItem.source === realLink.source &&
                realItem.target === realLink.target
              ) {
                //原来就有边,什么也不做
                flag = false;
                _this.deleteLinkView.model.remove({ ui: true });
                _this.$message({
                  showClose: true,
                  message: "Duplicate Edge!",
                  type: "warning",
                });
              } else if (
                realItem.target === realLink.source &&
                realItem.source === realLink.target
              ) {
                flag = false;
                //原来边方向相反，相当于反转边
                _this.deleteLinkView.model.remove({ ui: true });
                _this.deleteLinkView = item.findView(paper);
                _this.getEdgeValue(realItem.source, realItem.target);
              }
            }
          });
          if (flag) _this.addTempLink(realLink.source, realLink.target);
        }
      });

      paper.on("link:mouseenter", function (linkView, d) {
        let attributes = linkView.model.attributes.attrs;
        let router = attributes.id;
        linkView.model.attr("line/stroke", "#1f77b4");
        if (linkView.model.attributes.attrs.line.targetMarker)
          linkView.model.attr("line/targetMarker/stroke", "#1f77b4");

        let width = _this.getWidth(router);
        if (!_this.tip2Show)
          _this.tipVisible(router + ": " + width, {
            pageX: d.pageX,
            pageY: d.pageY,
          });
      });
      paper.on("link:mouseout", function (linkView) {
        linkView.model.attr("line/stroke", "black");
        if (linkView.model.attributes.attrs.line.targetMarker)
          linkView.model.attr("line/targetMarker/stroke", "black");

        _this.tipHidden();
      });
      paper.on("link:pointerclick", function (linkView, d) {
        let router = linkView.model.attributes.attrs.id;
        let hintHtml =
          "<div class='operate-header'><div class='hint-list'>Operate</div><div class='close-button'>x</div></div><hr/>\
                <div class='operate-menu'>Delete edge<br/>" +
          router +
          "</div><hr/><div class='operate-menu'>Reverse Direction</div>";
        _this.tip2Visible(hintHtml, { pageX: d.pageX, pageY: d.pageY });
        _this.deleteLinkView = linkView;
        _this.paper = paper;
        setTimeout(() => {
          document.addEventListener("click", _this.listener);
        }, 0);
      });
      paper.on("element:mouseover", function (elementView, evt) {
        addHighLight(elementView);
      });
      paper.on("element:mouseout", function (elementView, evt) {
        removeHighLight(elementView);
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
      let newOut;
      this.multipleSearchValue.nodesList.forEach((row) => {
        if (row.type !== 0) newFac.push(row.id);
      });
      this.multipleSearchValue.nodesList.map((row) => {
        if (row.type === 0) newOut = row.id;
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
          dataset: this.dataset,
          outcome: newOut,
          factors: newFac.join(),
        },
      })
        .then((response) => {
          this.simplePos = null;
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
          this.setGraph();
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
    getEdgeValue(source, target) {
      linkRequest.getLinkValue(target, source).then((response) => {
        let value = response.data.value;
        this.changeEdge(source, target, value);
      });
    },
    changeEdge(source, target, value) {
      let index = this.multipleSearchValue.linksList.findIndex(function (row) {
        if (
          (row.source === source &&
            row.target === target &&
            !row.hidden &&
            !row.reverse) ||
          (row.target === source &&
            row.source === target &&
            !row.hidden &&
            row.reverse)
        ) {
          return true;
        } else return false;
      });
      if (index > -1) {
        this.deleteLinkView.model.remove({ ui: true });

        let history = {
          source,
          target,
          value, //the true value after reversing
        };
        this.multipleSearchValue.linksList[index].value = value;
        historyManage.reverseEdge(this.multipleSearchValue.history, history);
        if (!this.multipleSearchValue.linksList[index].reverse) {
          this.multipleSearchValue.linksList[index]["reverse"] = true;
          this.hasNoHidden = false;
          this.addLink(this.simplePos.nodesList, {
            source: target,
            target: source,
            value: value,
          });
        } else {
          this.multipleSearchValue.linksList[index].reverse = false;
          this.addLink(
            this.simplePos.nodesList,
            this.multipleSearchValue.linksList[index]
          );
        }
        this.saveData();
        this.tip2Hidden();
      } else {
        let newLink = { source, target, value };
        this.multipleSearchValue.linksList.push(newLink);
        historyManage.addEdge(this.multipleSearchValue.history, newLink);
        this.saveData();
        this.setGraph();
      }
    },
    addLink(nodesList, link) {
      var path = new joint.shapes.standard.Link({});
      let sIndex = nodesList.findIndex((node) => {
        if (node.id === link.source) return true;
        else return false;
      });

      let tIndex = nodesList.findIndex((node) => {
        if (node.id === link.target) return true;
        else return false;
      });
      let value = Math.abs(link.value);
      if (value > 1.2) value = 1.2;
      path.attr({
        id: "(" + link.source + ", " + link.target + ")",
        line: {
          strokeWidth: value * 8 + "",
          targetMarker: {
            // minute hand
            type: "path",
            stroke: "black",
            "stroke-width": value * 8,
            fill: "transparent",
            d: "M 10 -5 0 0 10 5 ",
          },
        },
      });
      if (link.value < 0) {
        path.attr("line/strokeWidth", -link.value * 8 + "");
        path.attr("line/strokeDasharray", "4 4");
      }
      if (
        nodesList[sIndex].node.attributes.position.y <
        nodesList[tIndex].node.attributes.position.y
      )
        path.attr("line/targetMarker", null);
      path.connector("rounded");
      let vertices = this.deleteLinkView.model.attributes.vertices.reverse();
      path.vertices(vertices);
      path.source(nodesList[sIndex].node);
      path.target(nodesList[tIndex].node);
      path.addTo(this.paper.model);
    },
    reverseDirection(edge) {
      let nodes = edge.split("(")[1].split(")")[0].split(", ");
      this.getEdgeValue(nodes[0], nodes[1]);
    },
    deleteEdge(edge) {
      let nodes = edge.split("(")[1].split(")")[0].split(", ");
      let index = this.multipleSearchValue.linksList.findIndex(function (row) {
        if (
          (row.source === nodes[0] && row.target === nodes[1]) ||
          (row.target === nodes[0] && row.source === nodes[1])
        ) {
          return true;
        } else return false;
      });
      if (index > -1) {
        this.multipleSearchValue.linksList[index] = {
          source: nodes[0],
          target: nodes[1],
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
        this.deleteLinkView.model.remove({ ui: true });
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
    let result = localStorage.getItem("GET_JSON_RESULT");
    let datasetType = localStorage.getItem("DATATYPE");
    if (datasetType === "default") this.VariablesOptions = defaultFactors;
    else if (datasetType === "ukb") this.VariablesOptions = ukbFactors;
    else this.VariablesOptions = clhlsFactors;
    this.dataset = datasetType;
    if (result) this.multipleSearchValue = JSON.parse(result);
    else this.multipleSearchValue = null;
    console.log("getItem", this.multipleSearchValue);
    if (this.multipleSearchValue) {
      this.checkedVariables = this.multipleSearchValue.nodesList.map((node) => {
        return node.id;
      });
      let hiddenOrReverse = this.multipleSearchValue.linksList.filter(
        (link) => link.hidden || link.reverse
      );
      if (hiddenOrReverse.length > 0) this.hasNoHidden = false;
      this.setGraph();
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
  display: flex;
  width: 100%;
  height: 90%;
  padding: 16px;
}

.one-line-operator {
  height: 10%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.one-line-operator .drawing-buttons {
  display: flex;
  justify-content: flex-end;
}
.graph-main-title {
  font-size: 20px;
  font-weight: bold;
  line-height: 36px;
}
.graph-subtitle {
  font-size: 18px;
  font-weight: bold;
  line-height: 32px;
}
.sum-svg {
  display: flex;
  width: 100%;
  height: 90%;
  padding: 16px;
}
</style>
