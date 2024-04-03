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
          <div class="one-line-operator" v-else>
            <div class="algorithm-type">
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
                <div class="algorithm-name">PC</div>
                <div class="evaluation-rate">
                  SHD: {{ countHamming(pcLinks) }}
                </div>
                <div class="evaluation-rate">
                  Accuracy: {{ countAccuracy(pcLinks) }}
                </div>
                <div class="evaluation-rate">FPR: {{ countFP(pcLinks) }}</div>
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
                <div class="algorithm-name">DAG-GNN</div>
                <div class="evaluation-rate">
                  SHD: {{ countHamming(gnnLinks) }}
                </div>
                <div class="evaluation-rate">
                  Accuracy: {{ countAccuracy(gnnLinks) }}
                </div>
                <div class="evaluation-rate">FPR: {{ countFP(gnnLinks) }}</div>
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
                <div class="algorithm-name">HCM</div>
                <div class="evaluation-rate">
                  SHD: {{ countHamming(hcmLinks) }}
                </div>
                <div class="evaluation-rate">
                  Accuracy: {{ countAccuracy(hcmLinks) }}
                </div>
                <div class="evaluation-rate">FPR: {{ countFP(hcmLinks) }}</div>
              </div>
            </div>
            <div class="summary-hamming">
              <div class="summary-title">Summary:</div>
              <div>SHD: {{ countHamming(getBestLinks()) }}</div>
              <div>Accuracy: {{ countAccuracy(getBestLinks()) }}</div>
              <div>FPR: {{ countFP(getBestLinks()) }}</div>
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
    const nodesList = [
      "dANB",
      "dPPPM",
      "dIMPA",
      "dCoA",
      "dGoPg",
      "dCoGo",
      "dT",
      "Growth",
      "Treatment",
    ].map((node) => {
      return {
        id: node,
        type: 1,
      };
    });
    const links2 = {
      nodes: nodesList,
      trueLinks: [
        { source: "Treatment", target: "dCoA", value: 1 },
        { source: "Treatment", target: "dANB", value: 1 },
        { source: "dT", target: "Growth", value: 1 },
        { source: "dT", target: "dGoPg", value: 1 },
        { source: "dT", target: "dCoGo", value: 1 },
        { source: "Growth", target: "dANB", value: 1 },
        { source: "Growth", target: "dCoGo", value: 1 },
        { source: "dCoA", target: "dCoGo", value: 1 },
        { source: "dCoA", target: "dGoPg", value: 1 },
        { source: "dCoGo", target: "dPPPM", value: 1 },
        { source: "dANB", target: "dIMPA", value: 1 },
        { source: "dPPPM", target: "dIMPA", value: 1 },
      ],
      pcLinks: [
        { source: "dANB", target: "dPPPM", value: 1 },
        { source: "dANB", target: "dCoA", value: 1 },
        { source: "dANB", target: "Treatment", value: 1 },
        { source: "dIMPA", target: "dPPPM", value: 1 },
        { source: "dPPPM", target: "dCoGo", value: 1 },
        { source: "dGoPg", target: "dCoA", value: 1 },
        { source: "dCoGo", target: "dCoA", value: 1 },
        { source: "dCoA", target: "Treatment", value: 1 },
        { source: "dT", target: "dCoGo", value: 1 },
        { source: "Growth", target: "dCoGo", value: 1 },
      ],
      gnnLinks: [
        { source: "dPPPM", target: "dCoGo", value: 1 },
        { source: "dPPPM", target: "dT", value: 1 },
        { source: "dPPPM", target: "Treatment", value: 1 },
        { source: "dIMPA", target: "Treatment", value: 1 },
        { source: "dCoA", target: "dANB", value: 1 },
        { source: "dGoPg", target: "Treatment", value: 1 },
        { source: "dGoPg", target: "Growth", value: 1 },
        { source: "dGoPg", target: "dT", value: 1 },
        { source: "dGoPg", target: "dANB", value: 1 },
        { source: "dT", target: "dCoA", value: 1 },
        { source: "dT", target: "dIMPA", value: 1 },
        { source: "dT", target: "dANB", value: 1 },
        { source: "Growth", target: "dT", value: 1 },
        { source: "Growth", target: "Treatment", value: 1 },
        { source: "Treatment", target: "dANB", value: 1 },
      ],
      hcmLinks: [
        { source: "dANB", target: "Growth", value: 1 },
        { source: "dPPPM", target: "dIMPA", value: 1 },
        { source: "dCoA", target: "Treatment", value: 1 },
        { source: "dCoA", target: "dCoGo", value: 1 },
        { source: "dCoA", target: "dT", value: 1 },
        { source: "dGoPg", target: "dCoA", value: 1 },
        { source: "dGoPg", target: "dT", value: 1 },
        { source: "dCoGo", target: "dPPPM", value: 1 },
        { source: "dCoGo", target: "Growth", value: 1 },
        { source: "dT", target: "Treatment", value: 1 },
        { source: "Treatment", target: "dANB", value: 1 },
      ],
    };
    const links = {
      nodes: [
        { id: "A", type: 1 },
        { id: "C", type: 1 },
        { id: "D", type: 1 },

        { id: "H", type: 1 },
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
        { source: "C", target: "A", value: 1 },
        { source: "A", target: "H", value: 1 },
        { source: "O", target: "A", value: 1 },
        { source: "C", target: "I", value: 1 },
        { source: "C", target: "T", value: 1 },
        { source: "H", target: "D", value: 1 },
        { source: "O", target: "D", value: 1 },
        { source: "H", target: "I", value: 1 },
        { source: "H", target: "T", value: 1 },
        { source: "O", target: "I", value: 1 },
        { source: "O", target: "T", value: 1 },
      ],
      gnnLinks: [
        { source: "A", target: "D", value: 1 },
        { source: "D", target: "C", value: 1 },
        { source: "D", target: "H", value: 1 },
        { source: "D", target: "I", value: 1 },
        { source: "O", target: "C", value: 1 },
        { source: "O", target: "D", value: 1 },
        { source: "O", target: "I", value: 1 },
        { source: "T", target: "I", value: 1 },
        { source: "T", target: "O", value: 1 },
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

    return {
      dagEnabled: ref(true),
      pcEnabled: ref(true),
      hcmEnabled: ref(true),
      hoverType: ref(),
      paper: ref(),
      simplePos: ref(),
      categories: ["Ground Truth", ""],
      nodes: ref(links.nodes),
      trueLinks: ref(links.trueLinks),
      pcLinks: ref(links.pcLinks),
      gnnLinks: ref(links.gnnLinks),
      hcmLinks: ref(links.hcmLinks),
      links,
      links2,
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
      let gap = 900 / (maxW - minW);
      if (500 / (maxH - minH) < gap) gap = 500 / (maxH - minH);
      let startX = (dom.clientWidth - gap * (maxW - minW)) / 2 + 70;
      let startY = (dom.clientHeight - gap * (maxH - minH)) / 3;
      console.log(startX);
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
    getBestLinks() {
      let bestLinks = [];
      let links = this.pcLinks.concat(this.gnnLinks).concat(this.hcmLinks);
      links.forEach((link) => {
        let index = findLink.sameNodeLink(link, bestLinks);
        if (index < 0) bestLinks.push(link);
        else if (findLink.showSameDireLink(link, this.trueLinks) > -1) {
          bestLinks[index].source = link.source;
          bestLinks[index].target = link.target;
        }
      });
      return bestLinks;
    },
    countHamming(links) {
      let miss = 0;
      this.trueLinks.forEach((link) => {
        if (findLink.sameNodeLink(link, links) < 0) miss++;
      });
      let dumn = 0;
      links.forEach((link) => {
        if (findLink.sameNodeLink(link, this.trueLinks) < 0) dumn++;
      });
      let reverse = 0;
      links.forEach((link) => {
        let index = findLink.sameNodeLink(link, this.trueLinks);
        if (index > -1 && link.source !== this.trueLinks[index].source)
          reverse++;
      });
      return miss + dumn;
    },
    countAccuracy(links) {
      //不计方向
      let accurate = 0;
      links.forEach((link) => {
        if (findLink.sameNodeLink(link, this.trueLinks) > -1) accurate++;
      });
      return (accurate / this.trueLinks.length).toFixed(2);
    },
    countFP(links) {
      //不计方向
      let fp = 0;
      links.forEach((link) => {
        if (findLink.sameNodeLink(link, this.trueLinks) < 0) fp++;
      });
      let sum = (this.nodes.length * (this.nodes.length - 1)) / 2;
      return (fp / (sum - this.trueLinks.length)).toFixed(2); //多出的边/所有不存在的边
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
    changeLinks(benchMark) {
      if (benchMark === "healthcare") {
        this.pcLinks = this.links.pcLinks;
        this.gnnLinks = this.links.gnnLinks;
        this.trueLinks = this.links.trueLinks;
        this.nodes = this.links.nodes;
        this.hcmLinks = this.links.hcmLinks;
      } else {
        this.pcLinks = this.links2.pcLinks;
        this.gnnLinks = this.links2.gnnLinks;
        this.trueLinks = this.links2.trueLinks;
        this.nodes = this.links2.nodes;
        this.hcmLinks = this.links2.hcmLinks;
      }
    },
  },
  mounted() {
    localStorage.setItem("DATATYPE", "benchmark");
    let benchMark = localStorage.getItem("benchMark");
    this.changeLinks(benchMark);
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
  height: max-content;
  width: 100%;
  display: flex;
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
  flex-direction: column;
  align-items: flex-start;
}
.algorithm-name {
  width: 100px;
}
.evaluation-rate {
  margin-left: 16px;
  color: #666666;
  font-size: 16px;
}
.summary-hamming {
  display: flex;
  flex-direction: column;
  font-size: 16px;
}
.summary-title {
  font-size: 18px;
  font-weight: bold;
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
