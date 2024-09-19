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
          >{{ Variable }}</el-checkbox
        >
      </el-checkbox-group>
      <br />
      <el-button
        @click="getLinks"
        class="draw-directed-button"
        :disabled="loadingInstance !== null"
      >
        Plot the nodes selected
      </el-button>
    </div>
    <hr />
    <div class="drawing-canvas">
      <div class="button-line">
        <div class="drawing-buttons">
          <el-button @click="saveToTable" type="success" size="medium" round
            >Save to Table</el-button
          >
          <el-button @click="trulyDelete()" type="success" round size="medium">
            Relayout
          </el-button>
        </div>
        <div class="line-types">
          <div class="line-type">
            <div
              class="line-illustration"
              :style="[{ borderColor: getColor(linkConfigs[0]?.name)?.active }]"
            ></div>
            <div
              class="line-name"
              :style="[{ color: getColor(linkConfigs[0]?.name)?.active }]"
            >
              Positive effect
            </div>
          </div>
          <div class="line-type">
            <div
              class="line-illustration"
              :style="[{ borderColor: getColor(linkConfigs[0]?.name)?.active }]"
            ></div>
            <div
              class="line-name"
              :style="[{ color: getColor(linkConfigs[0]?.name)?.active }]"
            >
              Negative effect
            </div>
          </div>
        </div>
        <div class="algorithm-type" v-if="!noMethod">
          <div
            class="algorithm-title"
            v-for="(method, index) in linkConfigs"
            :key="index"
            :class="`${method.enabled ? 'enabled' : 'disabled'}-title`"
            @mouseenter="hoverLinks(index)"
            @mouseleave="noHoverOn"
          >
            <div
              class="color-hint"
              @click="enableLinks(index)"
              :style="[
                method.enabled
                  ? { 'background-color': getColor(method.name).active }
                  : { 'background-color': getColor(method.name).disabled },
              ]"
            ></div>
            <div @click="enableLinks(index)">{{ linkConfigs[index].name }}</div>

            <div
              v-if="method.name === 'DAG-GNN' && gnnType"
              class="loop-button-line"
            >
              <el-button
                v-if="gnnType === 'continue'"
                @click="continueLoop()"
                round
                size="medium"
              >
                <i class="ri-arrow-right-wide-fill"></i>
              </el-button>
              <el-button
                v-else
                @click="pauseLoop()"
                round
                size="medium"
                :disabled="gnnType === 'stopped'"
              >
                <i class="ri-pause-line"></i>
              </el-button>
              <el-button
                round
                size="medium"
                @click="stopLoop()"
                :disabled="gnnType === 'stopped'"
              >
                <i class="ri-square-line"></i>
              </el-button>
            </div>
            <div class="loading-img" v-else-if="method.name !== 'DAG-GNN'">
              <img v-if="method.ifWait" :src="loadingUrl.url" />
            </div>
          </div>
        </div>
      </div>
      <div id="paper" class="sum-svg"></div>
      <div v-if="gnnType && !loadingInstance" id="loss-chart"></div>
    </div>
    <div class="open-button" @click="drawer = true">
      <i class="el-icon-caret-left"></i>
    </div>
    <el-drawer
      v-if="!loadingInstance"
      custom-class="right-side"
      :modal="false"
      title="Matrix"
      :visible.sync="drawer"
    >
      <app-main-character></app-main-character>
      <div class="hint">Plotted from 1000 randomly sampled data.</div>
    </el-drawer>
  </div>
</template>

<script>
import * as echarts from "echarts";
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import axios from "axios";
import { ref } from "vue";
import { Loading } from "element-ui";
import { getFactorsOfDataset } from "@/plugin/variable";
//import { createChart } from "@/plugin/charts";
import { drawSuperGraph, setSuperGraph } from "@/plugin/superGraph";
import historyManage from "@/plugin/history";
import { addHighLight, removeHighLight } from "@/plugin/sonGraph";
import { countSimplePos } from "@/plugin/extracted/CountPos";
import { findLink, linksOperation } from "@/plugin/links";
import { linkRequest } from "@/plugin/request/edge.js";
import { LinksManagement } from "@/plugin/joint/linkAndNode.js";
import AppMainCharacter from "@/components/AppMainCharacter.vue";

export default {
  components: { AppMainCharacter },
  name: "DirectedGraph",
  setup() {
    return {};
  },
  data() {
    return {
      noMethod: ref(false),
      drawer: ref(false),
      loadingUrl: { url: require("../../assets/Spinner-1s-200px.gif") },
      lossChart: ref(),
      lossData: ref({
        epoch: [],
        ELBO_loss: [],
        NLL_loss: [],
        MSE_loss: [],
      }),
      linkConfigs: [],
      colors: [
        {
          method: "PC",
          name: "black",
          active: "black",
          disabled: "rgba(0,0,0,0.3)",
        },
        {
          method: "DAG-GNN",
          name: "blue",
          active: "rgba(66,103,172,1)",
          disabled: "rgba(66,103,172,0.3)",
        },
        {
          method: "HCM",
          name: "orange",
          active: "rgba(240,157,68,1)",
          disabled: "rgba(240,157,68,0.3)",
        },
      ],
      hoverType: ref(),
      deleteLinkView: ref(),
      gnnType: ref(),
      paper: ref(),
      dataset: ref(),
      chartVisible: ref(false),
      loadingInstance: ref(null),
      tooltip: null,
      tooltip2: null,
      checkAll: ref(false),
      VariablesOptions: ref(),
      checkedVariables: ref([]),
      tip2Show: ref(false),
      transform: ref(),
      simplePos: ref(),
      multipleSearchValue: ref({
        nodesList: [],
      }),
      repeatedToken: ref(),
      pcToken: ref(),
      hcmToken: ref(),
      inLoop: ref(false),
    };
  },
  methods: {
    getColor(method) {
      let index = this.colors.findIndex((color) => color.method === method);
      return this.colors[index];
    },
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
    startLoop() {
      let nodesList = this.multipleSearchValue.nodesList.map((node) => {
        return node.id;
      });
      this.gnnType = "pause"; //开始计算
      axios({
        method: "post",
        url: "http://localhost:8000/api/start_loop",
        //参数
        data: {
          nodesList,
          dataset: this.dataset,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }).then(() => {
        //本次循环开始
        this.inLoop = false;
        this.timer = window.setInterval(() => {
          setTimeout(() => {
            this.getTempResult();
          }, 0);
        }, 3000);
      });
    },
    //getDagGnnLinks
    async getTempResult() {
      let index = this.linkConfigs.findIndex(
        (config) => config.name === "DAG-GNN"
      );
      let nodes = this.multipleSearchValue.nodesList.map((node) => node.id);
      console.log(nodes, "nodes");
      if (!this.repeatedToken) this.repeatedToken = axios.CancelToken.source();
      try {
        const response = await axios({
          method: "get",
          url: "http://localhost:8000/api/checkpoint_result",
          params: {
            nodes: nodes.join(),
            cancelToken: this.repeatedToken.token,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (
          (this.lossData.epoch.length === 0 && response.data.epoch) ||
          this.lossData.epoch[this.lossData.epoch.length - 1] <
            response.data.epoch
        ) {
          this.lossData.epoch.push(parseInt(response.data.epoch));
          this.lossData.ELBO_loss.push(response.data.ELBO_loss.toFixed(3));
          this.lossData.NLL_loss.push(response.data.NLL_loss.toFixed(3));
          this.lossData.MSE_loss.push(response.data.MSE_loss.toFixed(3));
          this.drawEpochLossChart();
        }
        const linksList = response.data.linksList.filter(
          (link) => link.source !== link.target
        );

        let data = {
          history: this.multipleSearchValue.history,
          linksList,
          nodesList: this.multipleSearchValue.nodesList,
        };
        historyManage.reDoHistory(data);
        this.linkConfigs[index].linksList = LinksManagement.getFinalLinks(
          data.linksList
        );
        this.multipleSearchValue.dagLinks = this.linkConfigs[index].linksList;
        this.saveData();
        if (index === 0) this.setGraph();
        else if (this.paper) this.drawLinks(index);
      } catch (error) {
        console.log("请求失败了", error);
      }
      return true;
    },
    async getAAAI() {
      let index = this.linkConfigs.findIndex((config) => config.name === "HCM");
      if (index === 0) this.showLoading();
      this.linkConfigs[index].ifWait = true;

      let nodes = this.multipleSearchValue.nodesList.map((node) => node.id);
      if (!this.hcmToken) this.hcmToken = axios.CancelToken.source();
      try {
        const response = await axios({
          method: "post",
          url: "http://localhost:8000/api/get_aaai_result",
          //参数
          data: {
            nodesList: nodes,
            dataset: this.dataset,
          },
          headers: {
            "Content-Type": "application/json",
          },
          cancelToken: this.hcmToken.token,
        });
        if (this.loadingInstance && index === 0) {
          this.loadingInstance.close();
          this.loadingInstance = null;
        }

        this.linkConfigs[index].ifWait = false;
        this.linkConfigs[index].linksList = response.data.linksList;
        this.multipleSearchValue.aaaiLinks = response.data.linksList;
        this.saveData();
        if (index === 0) this.setGraph();
        else if (this.paper) this.drawLinks(index);
      } catch (error) {
        console.log("请求失败了", error);
      }
      return true;
    },
    async getPCLinks() {
      let index = this.linkConfigs.findIndex((config) => config.name === "PC");
      if (index === 0) this.showLoading();
      this.linkConfigs[index].ifWait = true;
      if (!this.pcToken) this.pcToken = axios.CancelToken.source();
      let outcome = this.multipleSearchValue.nodesList.filter(
        (node) => node.type === 0
      )[0];
      let factors = this.multipleSearchValue.nodesList
        .filter((node) => node.type === 1)
        .map((node) => {
          return node.id;
        });

      try {
        const response = await axios({
          method: "GET",
          url: "http://localhost:8000/api/getLink",
          params: {
            dataset: this.dataset,
            outcome: outcome.id,
            factors: factors.join(),
          },
          cancelToken: this.pcToken.token,
        });
        console.log(response);
        if (this.loadingInstance && index === 0) {
          this.loadingInstance.close();
          this.loadingInstance = null;
        }

        this.multipleSearchValue.pcLinks = response.data.links;
        this.linkConfigs[index].linksList = response.data.links;
        this.linkConfigs[index].ifWait = false;
        this.saveData();
        if (index === 0 && response.data.links?.length) this.setGraph();
        else if (this.paper) this.drawLinks(index);
      } catch (error) {
        console.log("请求失败了", error);
        this.$message({
          showClose: true,
          message: "The request failed. Try different parameters.",
          type: "warning",
        });
        this.$router.push({
          path: "/DirectedGraphView",
        });
      }
      return true;
    },
    async getLinks() {
      if (!this.checkedVariables?.length) {
        this.$message({
          showClose: true,
          message: "Please select at least one node!",
          type: "warning",
        });
        return;
      }
      await this.stopAllRequest();
      let outcome = this.multipleSearchValue.nodesList.filter(
        (node) => node.type === 0
      )[0];
      this.multipleSearchValue.nodesList = this.checkedVariables.map((node) => {
        return {
          id: node,
          type: 1,
        };
      });
      this.multipleSearchValue.nodesList.push(outcome);

      this.multipleSearchValue.pcLinks = null;
      this.multipleSearchValue.dagLinks = null;
      this.multipleSearchValue.aaaiLinks = null;
      this.linkConfigs.forEach((config) => (config.linksList = []));
      switch (this.linkConfigs[0].name) {
        case "PC":
          await this.getPCLinks();
          break;
        case "HCM":
          await this.getAAAI();
          break;
        case "DAG-GNN":
          this.startLoop();
          break;
        default:
          break;
      }
      this.simplePos = null;
      historyManage.reDoHistory(this.multipleSearchValue);
      this.setGraph();

      for (let i = 1; i < this.linkConfigs.length; i++) {
        let name = this.linkConfigs[i].name;
        if (name === "PC" && !this.multipleSearchValue.pcLinks)
          this.getPCLinks();
        else if (name === "DAG-GNN" && !this.multipleSearchValue.dagLinks)
          this.startLoop();
        else if (name === "HCM" && !this.multipleSearchValue.aaaiLinks)
          this.getAAAI();
      }
    },

    drawEpochLossChart() {
      var chartDom = document.getElementById("loss-chart");
      if (!this.lossChart) this.lossChart = echarts.init(chartDom);

      let option = {
        title: {
          text: "Epoch-Loss",
        },
        tooltip: {
          trigger: "axis",
        },
        legend: {
          data: ["ELBO_loss", "NLL_loss", "MSE_loss"],
        },
        grid: {
          left: "3%",
          right: "8%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          name: "epoch",
          type: "category",
          boundaryGap: false,
          data: this.lossData.epoch,
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "ELBO_loss",
            type: "line",
            data: this.lossData.ELBO_loss,
          },
          {
            name: "NLL_loss",
            type: "line",
            data: this.lossData.NLL_loss,
          },
          {
            name: "MSE_loss",
            type: "line",
            data: this.lossData.MSE_loss,
          },
        ],
      };

      this.lossChart.setOption(option);
    },
    async stopAllRequest() {
      if (this.pcToken) {
        this.pcToken.cancel("reselect nodes");
        this.pcToken = null;
      }
      if (this.hcmToken) {
        this.hcmToken.cancel("reselect nodes");
        this.hcmToken = null;
      }
      if (this.repeatedToken || this.timer) await this.stopLoop();
      return;
    },
    async stopLoop() {
      if (this.timer) window.clearInterval(this.timer);
      if (this.repeatedToken) {
        this.repeatedToken.cancel("Stop Polling");
        this.repeatedToken = null;
      }
      this.lossChart = null;
      this.lossData = {
        epoch: [],
        ELBO_loss: [],
        NLL_loss: [],
        MSE_loss: [],
      };
      this.gnnType = "stopped";
      await axios({
        method: "post",
        url: "http://localhost:8000/api/stop_loop",
        //参数
        data: {},
        headers: {
          "Content-Type": "application/json",
        },
      });
      return;
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

    trulyDelete() {
      console.log("delete edge");
      this.simplePos = null;

      let linksList = LinksManagement.getFinalLinks(
        this.linkConfigs[0].linksList
      );
      this.linkConfigs[0].linksList = linksList;
      switch (this.linkConfigs[0].name) {
        case "PC":
          this.multipleSearchValue.pcLinks = linksList;
          break;
        case "HCM":
          this.multipleSearchValue.aaaiLinks = linksList;
          break;
        case "DAG-GNN":
          this.multipleSearchValue.dagLinks = linksList;
          break;
        default:
          this.multipleSearchValue.linksList = linksList;
          break;
      }
      let allLinks = [];
      for (let i = 0; i < this.linkConfigs.length; i++) {
        if (this.linkConfigs[i].linksList?.length)
          allLinks = allLinks.concat(this.linkConfigs[i].linksList);
      }
      //去除孤点
      //remove unrelated nodes

      let nodesList = this.multipleSearchValue.nodesList.filter((node) => {
        let index = allLinks.findIndex((link) => {
          if (link.source === node.id || link.target === node.id) return true;
          else return false;
        });
        return index > -1 || node.type === 0;
      });

      this.multipleSearchValue.nodesList = nodesList;
      this.checkedVariables = this.multipleSearchValue.nodesList
        .filter((node) => node.type === 1)
        .map((node) => {
          return node.id;
        });
      this.saveData();
      this.setGraph();
    },
    setGraph() {
      let data = {
        nodesList: this.multipleSearchValue.nodesList,
        linksList: this.linkConfigs[0].linksList,
      };
      let g = new dagreD3.graphlib.Graph({ compound: true }).setGraph({
        ranker: "tight-tree",
      });
      setSuperGraph(g, data);
      //this.getAnchoredGraph(g);
      //save positon and redraw, which need to know the direction of edges
      const simpleG = g;
      let that = this;

      this.simplePos = countSimplePos(simpleG, data.nodesList, data.linksList);

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
        this.linkConfigs[0].linksList
      );
      let value = this.linkConfigs[0].linksList[index].value;
      return value.toFixed(3);
    },
    drawLinks(index) {
      if (!this.linkConfigs[index].enabled) return;
      let _this = this;
      let config = this.linkConfigs[index];
      let curve = "SuperCurve";
      switch (config.name) {
        case "PC":
          break;
        case "DAG-GNN":
          curve = "DagGnnCurve";
          break;
        case "HCM":
          curve = "AAAICurve";
          break;
        default:
          break;
      }
      let color = this.getColor(config.name);
      LinksManagement.removeLinks(this.paper, color.name);
      config.linksList.forEach((link) => {
        linksOperation.addLink(_this.simplePos, link, _this.paper, curve, {
          highlight: !_this.hoverType || _this.hoverType === config.name,
          color,
        });
      });
    },

    noHoverOn() {
      this.hoverType = null;
      LinksManagement.removeLightLinks(this.paper);
    },
    enableLinks(index) {
      if (this.linkConfigs.length < 2) return;
      //ongoing DAG-GNN graph cannot be disabled
      if (
        index === 0 &&
        this.linkConfigs[0].name === "DAG-GNN" &&
        this.gnnType &&
        this.gnnType !== "stopped"
      )
        return;
      this.linkConfigs[index].enabled = !this.linkConfigs[index].enabled;
      let color = this.getColor(this.linkConfigs[index].name);
      if (this.linkConfigs[index].enabled) this.drawLinks(index);
      else {
        LinksManagement.removeLinks(this.paper, color.name);
        this.noHoverOn();
      }
    },
    hoverLinks(index) {
      if (!this.linkConfigs[index].enabled) return;
      this.hoverType = this.linkConfigs[index].name;
      let colorIndex = this.colors.findIndex(
        (color) => color.method === this.linkConfigs[index].name
      );
      switch (colorIndex) {
        case 0:
          LinksManagement.highLightBlackLinks(this.paper);
          break;
        case 1:
          LinksManagement.highLightBlueLinks(this.paper);
          break;
        case 2:
          LinksManagement.highLightOrangeLinks(this.paper);
          break;
        default:
          break;
      }
    },
    checkSkeletonLink(linkView) {
      let mainColor = this.getColor(this.linkConfigs[0].name).disabled;
      mainColor = mainColor.replace(",0.3)", "");
      let color = linkView.model.attributes.attrs.line.stroke;
      if (color.includes(mainColor)) return true;
      else if (this.linkConfigs[0].name === "PC" && color === "black")
        return true;
      else return false;
    },
    drawGraph() {
      this.simplePos.nodesList.forEach((node) => {
        if (node.type === 0) node["indexes"] = ["10"];
        else node["indexes"] = ["11"];
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
      if (!this.inLoop && this.simplePos.linksList?.length) {
        this.scale = {
          startX,
          startY,
          gap,
        };
        this.inLoop = true;
      } else {
        const scale = this.paper.scale();
        const translate = this.paper.translate();
        this.scale = {
          gap: scale.sx,
          startX: translate.tx,
          startY: translate.ty,
        };
      }
      let color = this.getColor(this.linkConfigs[0].name).active;

      let paper = drawSuperGraph(
        dom,
        this.simplePos.nodesList,
        this.simplePos.linksList,
        this.scale,
        color
      );
      this.setPaper(paper);
      this.drawAddEdges();
      for (let i = 1; i < this.linkConfigs.length; i++) {
        let config = this.linkConfigs[i];
        if (config?.linksList && !config?.ifWait) this.drawLinks(i);
      }
    },

    drawAddEdges() {
      let linksList = this.linkConfigs[0].linksList;
      let addEdges = linksList.filter((link) => link.add);
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
        this.linkConfigs[0].linksList
      );

      let link = this.linkConfigs[0].linksList[index];
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
        this.linkConfigs[0].linksList
      );
      this.deleteLinkView.model.remove({ ui: true });
      if (oIndex > -1) {
        let originalLink = this.linkConfigs[0].linksList[oIndex];
        if (originalLink.hidden) originalLink.hidden = false;
        if (originalLink.source !== source) {
          linkRequest.getLinkValue(source, target).then((response) => {
            this.reverseAndShow(source, target, response.data.value);
          });
        } else
          this.addNewEdge({
            source,
            target,
            value: this.linkConfigs[0].linksList[oIndex].value,
          });
      } else this.getNewEdge(source, target);
    },
    setPaper(paper) {
      this.paper = paper;
      const _this = this;
      let graph = paper.model.attributes.cells.graph;
      graph.on("change:source change:target", function (link) {
        if (link.get("target").id === link.get("source").id) {
          link.findView(paper).remove({ ui: true });
        } else if (link.get("source").id && link.get("target").id) {
          _this.deleteLinkView = link.findView(paper);
          let realLink = LinksManagement.getLinkNode(paper, link);
          let flag = true;
          graph.getLinks().forEach((item) => {
            let itemLinkView = item.findView(paper);
            if (_this.checkSkeletonLink(itemLinkView)) {
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
        if (_this.checkSkeletonLink(linkView)) {
          //linkView.model.attr("line/stroke", "#1f77b4");
          //if (attributes.line.targetMarker)
          //linkView.model.attr("line/targetMarker/stroke", "#1f77b4");

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
        if (_this.checkSkeletonLink(linkView)) {
          // linkView.model.attr("line/stroke", "black");
          //if (linkView.model.attributes.attrs.line.targetMarker)
          //linkView.model.attr("line/targetMarker/stroke", "black");

          _this.tipHidden();
        }
      });
      paper.on("link:pointerclick", function (linkView, d) {
        if (_this.checkSkeletonLink(linkView)) {
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
      this.multipleSearchValue.nodesList.forEach((row) => {
        if (row.type === 0) allOut.push(row.id);
      });
      if (allOut.includes(node)) return true;
      else return false;
    },
    isVisible(path) {
      let link = this.linkConfigs[0].linksList.filter(
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

    //add document click listener
    handleCheckAllChange(val) {
      if (val === true) this.checkedVariables = this.VariablesOptions;
      else this.checkedVariables = [];
    },

    //document click listener => to close line tooltip
    listener(e) {
      let _this = this;
      let clickDOM = e.target.className;
      _this.tip2Hidden();
      document.removeEventListener("click", _this.listener);
      if (clickDOM === "operate-menu") {
        let text = e.target.innerText;
        if (text.includes("Delete")) this.deleteEdge(text);
        else {
          let text = e.srcElement.parentElement.children[2].innerText;
          this.reverseDirection(text);
        }
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
      let index = this.linkConfigs[0].linksList.findIndex(function (row) {
        if (row.source === edge.v && row.target === edge.w && !row.hidden) {
          return true;
        } else return false;
      });
      if (index < 0) return false;
      return this.linkConfigs[0].linksList[index].reverse === true;
    },
    async getEdgeValue(source, target) {
      let response = await linkRequest.getLinkValue(target, source);
      return { source, target, value: response.data.value };
    },
    async getNewEdge(source, target) {
      let newLink = await this.getEdgeValue(source, target);
      this.linkConfigs[0].linksList.push({
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
        this.linkConfigs[0].linksList
      );

      if (index > -1 && !this.linkConfigs[0].linksList[index].hidden) {
        this.deleteLinkView.model.remove({ ui: true });
        let history = link;
        this.linkConfigs[0].linksList[index].value = link.value;
        historyManage.reverseEdge(this.multipleSearchValue.history, history);
        this.linkConfigs[0].linksList[index].reverse =
          !this.linkConfigs[0].linksList[index].reverse;
        this.addLinkToPaper({
          source: link.target,
          target: link.source,
          value: link.value,
        });
        this.saveData();
      }
    },
    addLinkToPaper(link) {
      linksOperation.addLink(this.simplePos, link, this.paper, "SuperCurve", {
        highlight:
          !this.hoverType || this.hoverType === this.linkConfigs[0].name,
        color: this.getColor(this.linkConfigs[0].name),
      });
    },
    reverseDirection(edge) {
      let nodes = edge.split("(")[1].split(")")[0].split(", ");
      this.changeEdge(nodes[0], nodes[1]);
    },
    deleteEdge(edge) {
      let nodes = edge.split("(")[1].split(")")[0].split(", ");
      let index = findLink.sameNodeLink(
        { source: nodes[0], target: nodes[1] },
        this.linkConfigs[0].linksList
      );
      if (index > -1) {
        let link = this.linkConfigs[0].linksList[index];
        if (link.add) this.linkConfigs[0].linksList.splice(index, 1);
        else link.hidden = true;
        this.multipleSearchValue.history = historyManage.deleteEdge(
          this.multipleSearchValue.history,
          {
            source: nodes[0],
            target: nodes[1],
          }
        );
        this.saveData();
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
      this.tooltip
        .transition()
        .duration(0)
        .style("opacity", 1)
        .style("display", "block");
      this.tooltip
        .html('<div class="chart-box">' + textContent + "</div>")
        .style("left", `${event.pageX + 5}px`)
        .style("top", `${event.pageY - 40}px`);

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
      this.tipHidden();
      this.tip2Hidden();
      document.removeEventListener("click", this.listener);
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
    async getFactors() {
      this.VariablesOptions = await getFactorsOfDataset(this.dataset);
    },
  },

  mounted() {
    this.stopLoop(); //刷新
    this.gnnType = null;
    let result = localStorage.getItem("GET_JSON_RESULT");
    let datasetType = localStorage.getItem("DATATYPE");
    this.dataset = datasetType;
    this.getFactors();

    if (result) this.multipleSearchValue = JSON.parse(result);
    else this.multipleSearchValue = null;
    console.log("getItem", this.multipleSearchValue);

    if (this.multipleSearchValue) {
      this.checkedVariables = this.multipleSearchValue.nodesList
        .filter((node) => node.type === 1)
        .map((node) => {
          return node.id;
        });
      let algorithm = this.multipleSearchValue.algorithm;
      this.noMethod = false;
      //超图拆分出的子图，统一视为PC
      if (!algorithm || !algorithm.length) {
        this.noMethod = true;
        this.multipleSearchValue.algorithm = algorithm = ["PC"];
        this.multipleSearchValue.pcLinks = this.multipleSearchValue.linksList;
      }
      this.linkConfigs = [];
      for (let i = 0; i < algorithm.length; i++) {
        this.linkConfigs.push({
          name: algorithm[i],
          enabled: true,
          ifWait: false,
        });
        if (algorithm[i] === "PC")
          if (this.multipleSearchValue.pcLinks)
            this.linkConfigs[i].linksList = this.multipleSearchValue.pcLinks;
          else this.getPCLinks();
        else if (algorithm[i] === "DAG-GNN")
          if (this.multipleSearchValue.dagLinks)
            this.linkConfigs[i].linksList = this.multipleSearchValue.dagLinks;
          else this.startLoop();
        else if (algorithm[i] === "HCM")
          if (this.multipleSearchValue.aaaiLinks)
            this.linkConfigs[i].linksList = this.multipleSearchValue.aaaiLinks;
          else this.getAAAI();
      }
      if (this.linkConfigs[0].linksList?.length) this.setGraph();
    }
  },
  beforeRouteLeave(to, from, next) {
    this.stopAllRequest();
    next();
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
  padding-left: 32px;
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
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.button-line {
  display: flex;
  height: 10;
  padding: 16px;
  justify-content: space-between;
  align-items: center;
}
.drawing-buttons {
  display: flex;
  align-items: center;
  gap: 20px;
}
.line-types {
  display: flex;
  gap: 20px;
}
.line-type {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.line-illustration {
  height: 0;
  width: 40px;
  border: 1.2px dashed #333333;
}
.line-type:first-of-type .line-illustration {
  border-style: solid;
}
.line-name {
  font-size: 16px;
}
.algorithm-type {
  display: flex;
  align-items: center;
  gap: 8px;
}
.algorithm-title {
  font-size: 18px;
  margin-left: 8px;
  display: flex;
  gap: 4px;
  align-items: center;
  cursor: pointer;
}
.disabled-title {
  color: rgba(0, 0, 0, 0.3);
}
.color-hint {
  height: 16px;
  width: 16px;
  border-radius: 16px;
}

.loop-button-line {
  display: flex;
}
.loading-img {
  display: flex;
  height: 32px;
  width: 32px;
}
.loading-img img {
  height: 32px;
  width: 32px;
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
  height: calc(90%-400px);
  padding: 16px;
}
#loss-chart {
  position: absolute;
  background: white;
  bottom: 0;
  left: 0;
  width: 700px;
  height: 300px;
  border: 1px solid rgba(151, 151, 151, 0.49);
  border-bottom: none;
}
.open-button {
  position: absolute;
  z-index: 100;
  top: 50%;
  right: 0;
  width: 32px;
  border-top-left-radius: 15px;
  border-bottom-left-radius: 15px;
  font-size: 24px;
  height: 40px;
  display: flex;
  align-items: center;
  box-shadow: rgb(174, 174, 174) 0px 0px 10px;
}
</style>
<style>
#el-drawer__title {
  color: black;
  font-size: 24px;
  font-weight: bold;
}
.right-side {
  width: max-content !important;
  max-width: 80%;
}
</style>
