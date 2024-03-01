<template>
  <div id="DirectedGraph">
    <div class="graph-info-header">
      <div class="graph-main-title">· VariablesCheckbox</div>

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
        <el-button @click="trulyDelete()" type="success" round size="small">
          Relayout
        </el-button>
        <div class="algorithm-type" v-if="gnnType">
          <div
            class="algorithm-name"
            @mouseenter="hoverDagGnnLinks"
            @mouseleave="noHoverOnDagGnn"
          >
            DAG-GNN：
          </div>
          <el-button
            v-if="gnnType === 'continue'"
            type="success"
            @click="continueLoop()"
            round
            size="small"
            ><i class="ri-arrow-right-s-fill"></i
          ></el-button>
          <el-button
            v-else
            type="success"
            @click="pauseLoop()"
            round
            size="small"
            :disabled="gnnType === 'stopped'"
          >
            <i class="ri-pause-line"></i>
          </el-button>
          <el-button
            type="success"
            round
            size="small"
            @click="stopLoop"
            :disabled="gnnType === 'stopped'"
          >
            <i class="ri-square-line"></i>
          </el-button>
        </div>
      </div>

      <div id="paper" class="sum-svg"></div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import axios from "axios";
import { ref } from "vue";
import { Loading } from "element-ui";
import { defaultFactors, ukbFactors, clhlsFactors } from "@/plugin/variable";
//import { createChart } from "@/plugin/charts";
import { drawSuperGraph, setSuperGraph } from "@/plugin/superGraph";
import historyManage from "@/plugin/history";
import { addHighLight, removeHighLight } from "@/plugin/sonGraph";
import { countSimplePos } from "@/plugin/extracted/CountPos";
import { findLink, linksOperation } from "@/plugin/links";
import { linkRequest } from "@/plugin/request/edge.js";
import { LinksManagement } from "@/plugin/joint/linkAndNode.js";

export default {
  name: "DirectedGraph",
  setup() {
    return {};
  },
  data() {
    return {
      hoverType: ref(),
      deleteLinkView: ref(),
      gnnType: ref(),
      gnnLinks: ref(),
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
    stopLoop() {
      this.gnnType = "stopped";
      axios({
        method: "post",
        url: "http://localhost:8000/api/stop_loop",
        //参数
        data: {},
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (this.timer) window.clearInterval(this.timer);
    },
    pauseLoop() {
      this.gnnType = "continue";
      axios({
        method: "post",
        url: "http://localhost:8000/api/pause_loop",
        //参数
        data: {},
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    continueLoop() {
      this.gnnType = "pause";
      axios({
        method: "post",
        url: "http://localhost:8000/api/continue_loop",
        //参数
        data: {},
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    getTempResult() {
      axios({
        method: "post",
        url: "http://localhost:8000/api/checkpoint_result",
        //参数
        data: {},
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          let graph = eval("(" + JSON.parse(response.data.graph) + ")");
          console.log("graph", graph);
          this.gnnLinks = [];
          for (let i = 0; i < graph.length; i++) {
            for (let j = 0; j < graph[i].length; j++) {
              if (graph[i][j] !== 0)
                this.gnnLinks.push({
                  source: this.multipleSearchValue.nodesList[i].id,
                  target: this.multipleSearchValue.nodesList[j].id,
                  value: graph[i][j],
                });
            }
          }
          this.drawGnnLinks();
        })
        .catch((error) => {
          console.log("请求失败了", error.message);
        });
    },
    trulyDelete() {
      console.log("delete edge");
      this.simplePos = null;

      let linksList = LinksManagement.getFinalLinks(
        this.multipleSearchValue.linksList
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
      this.multipleSearchValue.linksList = linksList;
      this.multipleSearchValue.nodesList = nodesList;
      this.saveData();
      this.setGraph();
    },
    setGraph() {
      var data = this.multipleSearchValue;
      let g = new dagreD3.graphlib.Graph({ compound: true }).setGraph({
        ranker: "tight-tree",
      });
      setSuperGraph(g, data);
      //this.getAnchoredGraph(g);
      //save positon and redraw, which need to know the direction of edges
      const simpleG = g;
      let that = this;

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
      let index = findLink.sameNodeLink(
        {
          source: nodes[0].slice(1, nodes[0].length),
          target: nodes[1].slice(0, nodes[1].length - 1),
        },
        this.multipleSearchValue.linksList
      );
      let value = this.multipleSearchValue.linksList[index].value;
      return value.toFixed(3);
    },
    drawGnnLinks() {
      let _this = this;
      LinksManagement.removeGNNLinks(this.paper, this.gnnLinks);
      this.gnnLinks.forEach((link) => {
        linksOperation.addLink(
          _this.simplePos,
          link,
          _this.paper,
          "DagGnnCurve",
          {
            highlight: _this.hoverType === "daggnn",
          }
        );
      });
    },
    hoverDagGnnLinks() {
      console.log('hover')
      this.hoverType = "daggnn";
      LinksManagement.highLightGnnLinks(this.paper);
      this.drawGnnLinks();
    },
    noHoverOnDagGnn() {
      console.log('no hover on dg')
      this.hoverType = "PC";
      LinksManagement.removeLightGnnLinks(this.paper);
      this.drawGnnLinks();
    },
    checkPCLink(linkView) {
      let color = linkView.model.attributes.attrs.line.stroke;
      if (color.includes("rgba(0,139,139") || color.includes("rgba(66,103,172"))
        return false;
      else return true;
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
      this.drawAddEdges();
    },
    drawAddEdges() {
      let addEdges = this.multipleSearchValue.linksList.filter(
        (link) => link.add
      );
      let that = this;
      addEdges.forEach((edge) => {
        if (edge.reverse)
          that.addLinkToPaper({
            source: edge.target,
            target: edge.source,
            value: edge.value,
          });
        else that.addLinkToPaper(edge);
      });
    },
    plotChart(line) {
      let dom = document.getElementsByClassName(line)[0];
      //createChart(dom, line);
    },

    reverseAndShow(source, target, value) {
      //改变data-link方向再show-link
      let index = findLink.showReverseLink(
        { source, target },
        this.multipleSearchValue.linksList
      );

      let link = this.multipleSearchValue.linksList[index];
      link.reverse = !link.reverse;
      link.value = value;
      this.addNewEdge({ source, target, value });
    },
    //历史记录加边操作
    //隐藏边，变为不隐藏，否则添加边
    //有值则直接用，反向则计算
    addTempLink(source, target) {
      let oIndex = findLink.sameNodeLink(
        { source, target },
        this.multipleSearchValue.linksList
      );
      this.deleteLinkView.model.remove({ ui: true });
      if (oIndex > -1) {
        let originalLink = this.multipleSearchValue.linksList[oIndex];
        if (originalLink.hidden) originalLink.hidden = false;
        if (originalLink.source !== source) {
          linkRequest.getLinkValue(source, target).then((response) => {
            this.reverseAndShow(source, target, response.data.value);
          });
        } else
          this.addNewEdge({
            source,
            target,
            value: this.multipleSearchValue.linksList[oIndex].value,
          });
      } else this.getNewEdge(source, target);
    },
    setPaper(paper) {
      this.paper = paper;
      const _this = this;
      let graph = paper.model.attributes.cells.graph;
      graph.on("change:source change:target", function (link) {
        if (link.get("source").id && link.get("target").id) {
          _this.deleteLinkView = link.findView(paper);
          let realLink = LinksManagement.getLinkNode(paper, link);
          let flag = true;
          graph.getLinks().forEach((item) => {
            let itemLinkView = item.findView(paper);
            if (_this.checkPCLink(itemLinkView)) {
              if (LinksManagement.dubplicateLink(paper, link, item)) {
                //原来就有边,什么也不做
                flag = false;
                _this.deleteLinkView.model.remove({ ui: true });
                _this.$message({
                  showClose: true,
                  message: "Duplicate Edge!",
                  type: "warning",
                });
              } else if (LinksManagement.reversedLink(paper, link, item)) {
                flag = false;
                //原来边方向相反，相当于反转边
                _this.deleteLinkView.model.remove({ ui: true });
                _this.deleteLinkView = itemLinkView;

                _this.changeEdge(realLink.target, realLink.source);
              }
            }
          });
          if (flag) _this.addTempLink(realLink.source, realLink.target);
        }
      });

      paper.on("link:mouseenter", function (linkView, d) {
        let attributes = linkView.model.attributes.attrs;
        let router = attributes.id;
        if (_this.checkPCLink(linkView)) {
          linkView.model.attr("line/stroke", "#1f77b4");
          if (attributes.line.targetMarker)
            linkView.model.attr("line/targetMarker/stroke", "#1f77b4");

          let width = "";
          if (router) width = _this.getWidth(router);
          if (!_this.tip2Show)
            _this.tipVisible(router + ": " + width, {
              pageX: d.pageX,
              pageY: d.pageY,
            });
        }
      });
      paper.on("link:mouseout", function (linkView) {
        if (_this.checkPCLink(linkView)) {
          linkView.model.attr("line/stroke", "black");
          if (linkView.model.attributes.attrs.line.targetMarker)
            linkView.model.attr("line/targetMarker/stroke", "black");

          _this.tipHidden();
        }
      });
      paper.on("link:pointerclick", function (linkView, d) {
        if (_this.checkPCLink(linkView)) {
          let router = linkView.model.attributes.attrs.id;
          let hintHtml =
            "<div class='operate-header'><div class='hint-list'>Operate</div><div class='close-button'>x</div></div><hr/>\
                <div class='operate-menu'>Delete edge<br/>" +
            router +
            "</div><hr/><div class='operate-menu'>Reverse Direction</div>";
          _this.tip2Visible(hintHtml, { pageX: d.pageX, pageY: d.pageY });
          _this.deleteLinkView = linkView;

          setTimeout(() => {
            document.addEventListener("click", _this.listener);
          }, 0);
        }
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
        this.checkedVariables = this.VariablesOptions;
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
    async getEdgeValue(source, target) {
      let response = await linkRequest.getLinkValue(target, source);
      return { source, target, value: response.data.value };
    },
    async getNewEdge(source, target) {
      let newLink = await this.getEdgeValue(source, target);
      this.multipleSearchValue.linksList.push({
        ...newLink,
        add: true,
      });
      this.addNewEdge(newLink);
    },
    addNewEdge(link) {
      this.multipleSearchValue.history = historyManage.addEdge(
        this.multipleSearchValue.history,
        link
      );
      this.addLinkToPaper(link);
      this.saveData();
    },
    async changeEdge(source, target) {
      let link = await this.getEdgeValue(source, target);
      let index = findLink.showSameDireLink(
        link,
        this.multipleSearchValue.linksList
      );

      if (index > -1 && !this.multipleSearchValue.linksList[index].hidden) {
        this.deleteLinkView.model.remove({ ui: true });
        let history = link;
        this.multipleSearchValue.linksList[index].value = link.value;
        historyManage.reverseEdge(this.multipleSearchValue.history, history);
        this.multipleSearchValue.linksList[index].reverse =
          !this.multipleSearchValue.linksList[index].reverse;
        this.addLinkToPaper({
          source: link.target,
          target: link.source,
          value: link.value,
        });
        this.saveData();
        this.tip2Hidden();
      }
    },
    addLinkToPaper(link) {
      linksOperation.addLink(this.simplePos, link, this.paper, "SuperCurve");
    },
    reverseDirection(edge) {
      let nodes = edge.split("(")[1].split(")")[0].split(", ");
      this.changeEdge(nodes[0], nodes[1]);
    },
    deleteEdge(edge) {
      let nodes = edge.split("(")[1].split(")")[0].split(", ");
      let index = findLink.sameNodeLink(
        { source: nodes[0], target: nodes[1] },
        this.multipleSearchValue.linksList
      );
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
            source: nodes[0],
            target: nodes[1],
          }
        );
        this.saveData();
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
      this.setGraph();

      if (!this.multipleSearchValue.dagLinks) this.gnnType = "pause"; //开始计算
    }

    if (this.gnnType === "pause") {
      axios({
        method: "post",
        url: "http://localhost:8000/api/start_loop",
        //参数
        data: {
          nodesList: this.checkedVariables,
          dataset: datasetType,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.timer = window.setInterval(() => {
        setTimeout(() => {
          this.getTempResult();
        }, 0);
      }, 3000);
    }
  },

  destroyed() {
    this.stopLoop();
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
  display: flex;
  align-items: center;
  gap: 20px;
  height: 10;
  padding: 16px;
}
.algorithm-type {
  display: flex;
  align-items: center;
}
.algorithm-name {
  cursor: pointer;
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
