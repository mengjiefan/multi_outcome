<template>
  <div class="sub-graph">
    <div class="group-graphs">
      <div class="son-svg">
        <div
          v-for="index in 2"
          :key="index"
          :class="'paper' + index"
          class="paper-svg"
        >
          <div class="one-line-operator" v-if="index === 1">
            <div class="son-title">Ground Truth</div>
          </div>
          <div class="algorithm-type" v-else>
            <div
              class="algorithm-title"
              :class="`${pcEnabled ? 'enabled' : 'disabled'}-title`"
              @mouseenter="hoverPCLinks"
              @mouseleave="noHoverOn"
              @click="enablePC"
            >
              <div
                class="color-hint"
                :style="[
                  pcEnabled
                    ? { 'background-color': 'black' }
                    : { 'background-color': 'rgba(0, 0, 0, 0.3)' },
                ]"
              ></div>
              <div>PC</div>
            </div>
            <div
              class="algorithm-title"
              :class="`${dagEnabled ? 'enabled' : 'disabled'}-title`"
              @mouseenter="hoverDagGnnLinks"
              @mouseleave="noHoverOn"
              @click="enableDagGnn"
            >
              <div
                class="color-hint"
                :style="[
                  dagEnabled
                    ? { 'background-color': 'rgb(66, 103, 172)' }
                    : { 'background-color': 'rgba(66, 103, 172, 0.3)' },
                ]"
              ></div>
              <div>DAG-GNN</div>
            </div>
            <div
              class="algorithm-title"
              :class="`${hcmEnabled ? 'enabled' : 'disabled'}-title`"
              @mouseenter="hoverAAAILinks"
              @mouseleave="noHoverOn"
              @click="enableHCM"
            >
              <div
                class="color-hint"
                :style="[
                  hcmEnabled
                    ? { 'background-color': 'rgb(240,157,68)' }
                    : { 'background-color': 'rgba(240,157,68, 0.3)' },
                ]"
              ></div>
              <div>HCM</div>
            </div>
          </div>
          <div class="son-graph">
            <div :id="'paper' + index" class="svg-content"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { countSimplePos } from "@/plugin/extracted/CountPos";
import { LinksManagement } from "@/plugin/joint/linkAndNode";
import { findLink, linksOperation } from "@/plugin/links";
import { drawSuperGraph, setSuperGraph } from "@/plugin/superGraph";
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import { ref } from "vue";

export default {
  data() {
    return {
      dagEnabled: ref(true),
      pcEnabled: ref(true),
      hcmEnabled: ref(true),
      hoverType: ref(),
      paper: ref(),
      simplePos: ref(),
      categories: ["Ground Truth", ""],
      nodes: [
        { id: "A", type: 1 },
        { id: "H", type: 1 },
        { id: "C", type: 1 },
        { id: "D", type: 1 },
        { id: "I", type: 1 },
        { id: "O", type: 1 },
        { id: "T", type: 1 },
      ],
      trueLinks: [
        { source: "A", target: "C", value: 1 },
        { source: "A", target: "D", value: 1 },
        { source: "A", target: "H", value: 1 },
        { source: "A", target: "O", value: 1 },
        { source: "H", target: "D", value: 1 },
        { source: "C", target: "I", value: 1 },
        { source: "D", target: "I", value: 1 },
        { source: "I", target: "T", value: 1 },
        { source: "O", target: "T", value: 1 },
      ],
      pcLinks: [
        { source: "I", target: "T", value: 1.0661507017031226 },
        { source: "O", target: "T", value: 5.38769240777151 },
      ],
      tempLinks: [
        { source: "T", target: "I", value: 0.9302913371026023 },
        { source: "C", target: "T", value: 706.0887308488881 },
        { source: "H", target: "I", value: 1980.0092968090896 },
        { source: "H", target: "T", value: 2089.711567119814 },
        { source: "O", target: "I", value: 4.2538080335767745 },
        { source: "O", target: "T", value: 5.38769240777151 },
      ],
      gnnLinks: [
        { source: "A", target: "D", value: 0.71998985 },
        { source: "A", target: "H", value: -0.58053047 },
        { source: "O", target: "C", value: 1.24964353 },
        { source: "O", target: "C", value: 1.24964353 },
        { source: "O", target: "T", value: -1.57094385 },
        { source: "T", target: "I", value: -1.97877794 },
      ],
      hcmLinks: [
        { source: "A", target: "O", value: 1 },
        { source: "D", target: "H", value: 1 },
        { source: "I", target: "C", value: 1 },
        { source: "I", target: "D", value: 1 },
        { source: "T", target: "C", value: 1 },
        { source: "T", target: "D", value: 1 },
        { source: "T", target: "I", value: 1 },
        { source: "T", target: "O", value: 1 },
      ],
    };
  },
  methods: {
    setGraphs() {
      let links = this.trueLinks
        .concat(this.gnnLinks)
        .concat(this.pcLinks)
        .concat(this.hcmLinks);
      let allLinks = [];
      links.forEach((link) => {
        if (findLink.sameNodeLink(link, allLinks) < 0) allLinks.push(link);
      });
      var data = {
        nodesList: this.nodes,
        linksList: allLinks,
      };
      let g = new dagreD3.graphlib.Graph({ compound: true }).setGraph({
        ranker: "tight-tree",
      });
      setSuperGraph(g, data);
      //this.getAnchoredGraph(g);
      //save positon and redraw, which need to know the direction of edges
      const simpleG = g;
      this.simplePos = countSimplePos(simpleG, this.nodes, allLinks);

      console.log("simplePos", this.simplePos);
      setTimeout(() => {
        this.drawGraphs();
      }, 0);
      // Set up zoom support
    },
    drawGraphs() {
      this.simplePos.nodesList.forEach((node) => {
        node["indexes"] = ["11"];
      });
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
      let linksList = [
        this.trueLinks,
        this.pcLinks,
        this.gnnLinks,
        this.hcmLinks,
      ];
      let dom = document.getElementById("paper1");
      let gap = 600 / (maxW - minW);
      if (300 / (maxH - minH) < gap) gap = 300 / (maxH - minH);
      let startX = (dom.clientWidth - gap * (maxW - minW)) / 2;
      let startY = (dom.clientHeight - gap * (maxH - minH)) / 3;
      let scale = {
        startX,
        startY,
        gap,
      };
      for (let i = 0; i < 2; i++) {
        dom = document.getElementById("paper" + (i + 1));
        let links = [];
        linksList[i].forEach((link) => {
          let index = findLink.sameNodeLink(link, this.simplePos.linksList);
          if (index > -1) {
            if (this.simplePos.linksList[index].source === link.source)
              links.push(this.simplePos.linksList[index]);
            else {
              let points = this.simplePos.linksList[index].points.concat([]);
              links.push({
                ...link,
                points: points.reverse(),
              });
            }
          } else {
            let sindex = this.simplePos.nodesList.findIndex(
              (node) => node.id === link.source
            );
            let tindex = this.simplePos.nodesList.findIndex(
              (node) => node.id === link.target
            );
            links.push({
              ...link,
              points: [
                this.simplePos.nodesList[sindex],
                this.simplePos.nodesList[tindex],
              ],
            });
          }
        });
        this.paper = drawSuperGraph(
          dom,
          this.simplePos.nodesList,
          links,
          scale
        );
        if (i === 1) {
          this.drawGnnLinks();
          this.drawAAAILinks();
        }
      }
    },
    drawGnnLinks() {
      if (!this.dagEnabled) return;
      let _this = this;
      LinksManagement.removeLinks(this.paper, "daggnn");
      this.gnnLinks.forEach((link) => {
        linksOperation.addLink(
          _this.simplePos,
          link,
          _this.paper,
          "DagGnnCurve",
          {
            highlight: _this.hoverType !== "aaai" && _this.hoverType !== "pc",
          }
        );
      });
      //linksOperation.addNode(nodes, _this.paper, "DagGnn");
    },
    drawPCLinks() {
      if (!this.pcEnabled) return;
      let _this = this;
      this.pcLinks.forEach((link) => {
        linksOperation.addLink(
          _this.simplePos,
          link,
          _this.paper,
          "SuperCurve",
          {
            highlight:
              _this.hoverType !== "daggnn" && _this.hoverType !== "aaai",
          }
        );
      });
    },
    drawAAAILinks() {
      if (!this.hcmEnabled) return;
      let _this = this;
      this.hcmLinks.forEach((link) => {
        linksOperation.addLink(
          _this.simplePos,
          link,
          _this.paper,
          "AAAICurve",
          {
            highlight: _this.hoverType !== "daggnn" && _this.hoverType !== "pc",
          }
        );
      });
      //linksOperation.addNode(nodes, _this.paper, "AAAI");
    },
    enableDagGnn() {
      this.dagEnabled = !this.dagEnabled;
      if (this.dagEnabled) this.drawGnnLinks();
      else {
        LinksManagement.removeLinks(this.paper, "daggnn");
        this.noHoverOn();
      }
    },
    enablePC() {
      this.pcEnabled = !this.pcEnabled;
      if (this.pcEnabled) this.drawPCLinks();
      else {
        LinksManagement.removeLinks(this.paper, "pc");
        this.noHoverOn();
      }
    },
    enableHCM() {
      this.hcmEnabled = !this.hcmEnabled;
      if (this.hcmEnabled) this.drawAAAILinks();
      else {
        LinksManagement.removeLinks(this.paper, "aaai");
        this.noHoverOn();
      }
    },
    noHoverOn() {
      this.hoverType = null;
      LinksManagement.removeLightLinks(this.paper);
    },
    hoverDagGnnLinks() {
      if (!this.dagEnabled) return;
      this.hoverType = "daggnn";
      LinksManagement.highLightGnnLinks(this.paper);
    },
    hoverAAAILinks() {
      if (!this.hcmEnabled) return;
      this.hoverType = "aaai";
      LinksManagement.highLightAAAILinks(this.paper);
    },
    hoverPCLinks() {
      if (!this.pcEnabled) return;
      this.hoverType = "pc";
      LinksManagement.highLightPCLinks(this.paper);
    },
  },
  mounted() {
    localStorage.setItem("DATATYPE", "benchmark");
    this.setGraphs();
  },
};
</script>

<style scoped>
.sub-graph {
  display: flex;
  height: 100%;
  flex: 1;
}
.group-graphs {
  width: 100%;
  display: flex;
}

.son-svg {
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
}
.paper-svg {
  display: flex;
  flex-direction: column;
  padding: 1%;
  margin: 0.5%;
  border: 1px solid rgba(151, 151, 151, 0.49);
  flex: 1 1/3;
  min-width: 46%;
}
.son-graph {
  width: 100%;
  flex: 1;
  display: flex;
  position: relative;
}
.svg-content {
  position: relative;
  width: 100%;
  height: 100% !important;
}
.one-line-operator {
  padding-bottom: 16px;
  height: 30px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.son-title {
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
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
.color-hint {
  height: 16px;
  width: 16px;
  border-radius: 16px;
}
</style>
<style>
.joint-link path {
  transition-duration: 0.2s;
}
</style>
