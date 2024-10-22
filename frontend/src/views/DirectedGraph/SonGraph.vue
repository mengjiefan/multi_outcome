<template>
  <div class="sub-graph">
    <div class="group-graphs">
      <div class="son-svg">
        <div
          v-for="index in sonNum"
          :key="index"
          :class="'paper' + index"
          class="paper-svg"
          :style="getSonGraphSize()"
        >
          <div class="one-line-operator">
            <div class="son-title">
              <div
                class="color-hint"
                :style="[{ 'background-color': cmap[index - 1] }]"
              ></div>
              {{ multipleSearchValue.selections[index - 1].outcome }}
            </div>
            <div class="stress-score">
              <div class="stress-func">stress(X):</div>
              <div class="stress-value">{{ stressList?.[index - 1] }}</div>
            </div>
            <div class="drawing-buttons">
              <!--Apply Changes to Super Graph-->
              <el-button
                @click="applySubGraph(index - 1)"
                type="warning"
                size="small"
                round
                >Apply</el-button
              >
              <!--Save Sub Graph to Table-->
              <el-button
                @click="saveSingleToTable(index - 1)"
                type="warning"
                size="small"
                round
                >Save</el-button
              >
            </div>
          </div>
          <div class="son-graph">
            <div :id="'paper' + index + '-overview'" class="thumbnail"></div>
            <div :id="'paper' + index" class="svg-content"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import { ref } from "vue";
import { countTightenedSonPos } from "@/plugin/tightened/CountPos";
import {
  countExtractedSonPos,
  countExtractedScale,
} from "@/plugin/extracted/CountPos";
import { countOriginalSonPos } from "@/plugin/original/CountPos";
import {
  countCurveSonPos,
  countCurveScale,
  countControl,
} from "@/plugin/curve/CountPos";
import { countRelativeSonPos } from "@/plugin/relative/CountPos";
import { drawExtractedGraph, drawOverViewGraph } from "@/plugin/superGraph";
import { drawTightenedGraph } from "@/plugin/sonGraph";
import { drawCurveGraph } from "@/plugin/sonGraph";
import { LinksManagement } from "@/plugin/joint/linkAndNode";
import { addHighLight, removeHighLight } from "@/plugin/sonGraph";
import historyManage from "@/plugin/history";

import { createChart } from "@/plugin/charts";

import { findLink, linksOperation } from "@/plugin/links";
import { linkRequest } from "@/plugin/request/edge.js";
import { countStress } from "@/plugin/stress";

export default {
  name: "SonGraph",
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.graphType = to.name;
      vm.init();
    });
  },
  data() {
    return {
      stressList: [],
      graphType: ref(),
      ifCurve: ref(false),
      scales: ref([]),
      papers: ref([]),
      paper: ref(),
      sonGraphs: ref([]),
      finalPos: ref(),
      tooltip: null,
      tooltip2: null,
      sonNum: ref(0),
      deleteLinkView: ref(),
      tip2Show: ref(false),
      transform: ref([]),
      multipleSearchValue: ref({
        nodesList: [],
        linksList: [],
      }),
      cmap: [
        "#3182bd", //blue
        "#ff7f0e", //orange
        "#2ca02c", //green
        "#ff9896", //pale red
        "#9467bd", //purple
        "#8c564b", //brown
        "#e377c2", //pink
        "#c7c7c7", //gray
        "#bcbd22", //yellow green
        "#17becf", //light blue
      ],
    };
  },
  methods: {
    async drawGraph() {
      this.sonNum = 0;
      if (this.tooltip2) this.tip2Hidden();

      this.tooltip = this.createTooltip(1);
      this.tooltip2 = this.createTooltip(2);
      this.sonNum = this.multipleSearchValue.nodesList.filter(
        (node) => node.type === 0
      ).length;
      let name = "";
      switch (this.graphType) {
        case "CenterSubGraph":
          name = "center";
          break;
        case "AggregateSubGraph":
          name = "aggregate";
          break;
        case "RelativeSubGraph":
          name = "relative";
          break;
        case "TreeSubGraph":
          name = "tree";
          break;
        default:
          break;
      }
      if (!name) this.getNormalLayout();
      else await this.getCurveLayout(name);

      setTimeout(() => {
        this.drawSuperGraphs();
        this.drawSonGraphs();
      }, 0);
    },
    drawSuperGraphs() {
      for (let i = 0; i < this.sonNum; i++) {
        let dom = document.getElementById("paper" + (i + 1) + "-overview");
        let minW = 150000;
        let maxW = 0;
        let minH = 15000;
        let maxH = 0;
        let simplePos = JSON.parse(localStorage.getItem("SIMPLE_POS"));
        simplePos.nodesList.forEach((node) => {
          if (node.x > maxW) maxW = node.x;
          if (node.x < minW) minW = node.x;
          if (node.y > maxH) maxH = node.y;
          if (node.y < minH) minH = node.y;
        });
        simplePos.linksList.forEach((link) => {
          link.points.forEach((node) => {
            if (node.x > maxW) maxW = node.x;
            if (node.x < minW) minW = node.x;
            if (node.y > maxH) maxH = node.y;
            if (node.y < minH) minH = node.y;
          });
        });
        let gap = (dom.clientWidth - 16) / (maxW - minW);
        let startX = 16;
        let startY = 16;

        let scale = {
          startX,
          startY,
          gap,
        };
        let sonPaper = drawOverViewGraph(
          dom,
          simplePos.nodesList,
          simplePos.linksList,
          scale
        );
        let nodesList = this.sonGraphs[i].nodesList.map((node) => node.id);
        minW = 150000;
        maxW = 0;
        minH = 15000;
        maxH = 0;
        nodesList.forEach((node) => {
          let index = simplePos.nodesList.findIndex((item) => {
            if (item.id === node) return true;
            else return false;
          });
          let nodePos = simplePos.nodesList[index];
          if (nodePos.x < minW) minW = nodePos.x;
          if (nodePos.x > maxW) maxW = nodePos.x;
          if (nodePos.y > maxH) maxH = nodePos.y;
          if (nodePos.y < minH) minH = nodePos.y;
        });
        linksOperation.addRange(
          minW - 20,
          minH - 20,
          maxW - minW + 40,
          maxH - minH + 40,
          sonPaper
        );
      }
    },
    drawSonGraphs() {
      const graphs = this.sonGraphs;
      let dom = document.getElementById("paper1");
      if (this.ifCurve)
        this.scales = countCurveScale(
          graphs,
          dom.clientHeight,
          dom.clientWidth,
          this.sonNum
        );
      else
        this.scales = countExtractedScale(
          graphs,
          dom.clientHeight,
          dom.clientWidth,
          this.sonNum
        );

      for (let i = 0; i < this.sonNum; i++) this.drawSonGraph(i);
    },
    drawSonGraph(index) {
      this.stressList = countStress(
        this.sonGraphs.map((graph) => graph.nodesList),
        this.multipleSearchValue.selections.map(
          (selection) => selection.linksList
        )
      );
      let dom = document.getElementById("paper" + (index + 1));
      for (let i = 0; i < this.sonGraphs[index].nodesList.length; i++)
        this.sonGraphs[index].nodesList[i]["indexes"] = this.getNodeIndex(
          this.sonGraphs[index].nodesList[i].id
        );
      let paper;
      if (
        this.graphType === "ExtractedSubGraph" ||
        this.graphType === "OriginalSubGraph"
      )
        paper = drawExtractedGraph(
          dom,
          this.sonGraphs[index].nodesList,
          this.sonGraphs[index].linksList,
          this.scales[index]
        );
      else if (this.graphType === "TightenedSubGraph")
        paper = drawTightenedGraph(
          dom,
          this.sonGraphs[index].nodesList,
          this.multipleSearchValue.selections[index].linksList,
          this.scales[index],
          this.sonGraphs[index].linksList
        );
      else paper = this.countLinks(index);
      if (!this.papers[index]) {
        this.papers.push(paper);
      } else this.papers[index] = paper;
      this.setPaper(index, paper);
      if (
        this.graphType === "ExtractedSubGraph" ||
        this.graphType === "OriginalSubGraph"
      )
        this.drawAddEdges(index);
    },
    applySubGraph(index) {
      let selection = this.multipleSearchValue.selections[index];
      let linksList = LinksManagement.getFinalLinks(selection.linksList);
      for (let i = 0; i < this.multipleSearchValue.selections.length; i++) {
        if (i == index) continue;
        this.applyToSingle(linksList, i);
      } //应用到子图
      //应用到超图
      for (let i = 0; i < linksList.length; i++) {
        let link = linksList[i];
        let index = findLink.sameNodeLink(
          link,
          this.multipleSearchValue.linksList
        );
        if (index > -1) {
          let superLink = this.multipleSearchValue.linksList[index];
          if (superLink.hidden && !link.hidden) superLink.hidden = false;
          if (findLink.showReverseLink(link, [superLink]) === 0) {
            superLink.reverse = !superLink.reverse;
            superLink.value = link.value;
          }
        } else this.multipleSearchValue.linksList.push({ ...link, add: true });
      }

      this.saveData();
    },
    applyToSingle(answer, index) {
      this.paper = this.papers[index];
      let item = this.multipleSearchValue.selections[index];
      for (let i = 0; i < item.linksList.length; i++) {
        let link = item.linksList[i];
        let linkIndex = findLink.showReverseLink(link, answer); //目标边在本图中有
        if (
          findLink.sameNodeLink(
            { source: "Index of Multiple Deprivation", target: "BMI" },
            [link]
          ) === 0
        )
          console.log("ok", link);
        if (linkIndex > -1) this.drawSingleEdge(index, answer[linkIndex]);
      }
    },
    drawSingleEdge(index, link) {
      const _this = this;
      let graph = this.paper.model.attributes.cells.graph;

      graph.getCells().forEach((item) => {
        if (item.attributes.type.includes("Link")) {
          let realItem = LinksManagement.getLinkNode(_this.paper, item);
          if (
            realItem.source === link.target &&
            realItem.target === link.source
          ) {
            console.log(realItem);
            //原来边方向相反，相当于反转边
            _this.deleteLinkView = item.findView(_this.paper);
            _this.changeEdge(index, {
              source: link.target,
              target: link.source,
              value: link.value,
            });
          }
        }
      });
    },
    getNodeIndex(id) {
      let indexes = [];
      for (let i = 0; i < this.multipleSearchValue.selections.length; i++) {
        let selection = this.multipleSearchValue.selections[i];
        if (selection.outcome === id) indexes.push(i);
        else if (selection.variable.includes(id)) indexes.push(i);
      }
      return indexes;
    },
    saveSingleToTable(index) {
      let selection = this.multipleSearchValue.selections[index];
      let variables = [
        {
          type: 0,
          id: selection.outcome,
        },
      ];

      let finalData = {
        nodesList: variables.concat(
          selection.variable.map((v) => {
            return {
              id: v,
              type: 1,
            };
          })
        ),
        linksList: selection.linksList,
        history: selection.history,
      };
      localStorage.setItem("GET_SAVE_DATA", JSON.stringify(finalData));
      this.$router.push({
        path: this.$route.path,
        query: {
          mode: "save",
        },
      });
    },
    createTooltip(number) {
      let tooltips = d3.selectAll(".tooltip")._groups[0];
      if (tooltips.length < number)
        return d3
          .select("body")
          .append("div")
          .classed("tooltip", true)
          .style("opacity", 0)
          .style("display", "none");
      else
        return d3.selectAll(".tooltip").select(function (d, i, nodes) {
          if (i === number - 1) return this;
        });
    },

    drawAddEdges(index) {
      this.paper = this.papers[index];
      let addEdges = this.multipleSearchValue.selections[
        index
      ].linksList.filter((link) => link.add);

      let that = this;
      addEdges.forEach((edge) => {
        if (edge.reverse)
          that.addLink(index, {
            source: edge.target,
            target: edge.source,
            value: edge.value,
          });
        else that.addLink(index, edge);
      });
    },

    getWidth(index, router) {
      if (!router) return "-";
      let nodes = router.split(", ");
      nodes[0] = nodes[0].slice(1, nodes[0].length);
      nodes[1] = nodes[1].slice(0, nodes[1].length - 1);
      let value = 0;
      this.multipleSearchValue.selections[index].linksList.forEach((link) => {
        if (link.source === nodes[0] && link.target === nodes[1])
          value = link.value;
        else if (link.target === nodes[0] && link.source === nodes[1])
          value = link.value;
      });
      return value.toFixed(3);
    },
    plotChart(line) {
      let dom = document.getElementsByClassName(line)[0];
      createChart(dom, line);
    },

    checkIfExist(index, link, paper) {
      let realLink = LinksManagement.getLinkNode(paper, link);
      const _this = this;
      let graph = paper.model.attributes.cells.graph;
      let flag = true;
      graph.getCells().forEach((item) => {
        if (item.attributes.type.includes("Link")) {
          if (LinksManagement.dubplicateLink(paper, link, item)) {
            //原来就有边,什么也不做
            flag = false;
            _this.$message({
              showClose: true,
              message: "Duplicate Edge!",
              type: "warning",
            });
          } else if (LinksManagement.reversedLink(paper, link, item)) {
            flag = false;
            //原来边方向相反，相当于反转边
            _this.deleteLinkView = item.findView(paper);
            _this.getEdgeValue(index, realLink.target, realLink.source);
          }
        }
      });
      if (flag) this.addTempLink(index, realLink.source, realLink.target);
    },
    setPaper(index, paper) {
      const _this = this;
      let outcome = this.multipleSearchValue.selections[index].outcome;
      let graph = paper.model.attributes.cells.graph;
      graph.on("change:source change:target", function (link) {
        const linkView = link.findView(paper);
        console.log(linkView);
        if (
          linkView.targetView?.model.attributes.attrs?.body?.fill ===
          "rgba(151, 151, 151, 0.3)"
        )
          linkView.remove({ ui: true });
        else if (link.get("source").id && link.get("target").id) {
          _this.deleteLinkView = linkView;
          _this.deleteLinkView.model.remove({ ui: true });
          _this.paper = paper;
          if (link.get("source").id !== link.get("target").id) {
            _this.checkIfExist(index, link, paper);
          }
        }
      });
      paper.on("link:mouseenter", function (linkView, d) {
        linkView.model.attr("line/stroke", "#1f77b4");
        if (linkView.model.attributes.attrs.line.targetMarker)
          linkView.model.attr("line/targetMarker/stroke", "#1f77b4");
        let attributes = linkView.model.attributes.attrs;
        let router = attributes.id;
        let width = _this.getWidth(index, router);
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
        console.log(linkView, "click");
        let router = linkView.model.attributes.attrs.id;
        let hintHtml =
          "<div class='operate-header'><div class='hint-list'>" +
          outcome +
          "</div><div class='close-button'>x</div></div><hr/>\
                  <div class='operate-menu'>Delete edge<br/>" +
          router +
          "</div><hr/><div class='operate-menu'>Reverse Direction</div>";
        _this.tip2Visible(hintHtml, { pageX: d.pageX, pageY: d.pageY });
        _this.deleteLinkView = linkView;
        _this.paper = paper;
        setTimeout(() => {
          document.addEventListener("click", _this.listener3);
        }, 0);
      });
      paper.on("element:mouseover", function (elementView, evt) {
        if (elementView.model.attributes.type === "standard.Rectangle")
          _this.highLightAllPaper(elementView.model.attributes.attrs.title);
      });
      paper.on("element:mouseout", function (elementView, evt) {
        if (elementView.model.attributes.type === "standard.Rectangle")
          _this.removeAllHighLight(elementView.model.attributes.attrs.title);
      });
    },
    highLightAllPaper(id) {
      if (!id) return;
      this.papers.forEach((paper) => {
        var elements = paper.model.getElements();
        elements.forEach((element) => {
          if (element.attributes.attrs.title === id) {
            let view = element.findView(paper);
            addHighLight(view);
          }
        });
      });
    },
    removeAllHighLight(id) {
      if (!id) return;
      this.papers.forEach((paper) => {
        var elements = paper.model.getElements();
        elements.forEach((element) => {
          if (element.attributes.attrs.title === id) {
            let view = element.findView(paper);
            removeHighLight(view);
          }
        });
      });
    },

    tipVisible(textContent, event) {
      this.tip2Hidden();
      document.removeEventListener("click", this.listener3);
      this.tooltip
        .transition()
        .duration(0)
        .style("opacity", 1)
        .style("display", "block");
      this.tooltip
        .html('<div class="chart-box">' + textContent + "</div>")
        .style("left", `${event.pageX + 5}px`)
        .style("top", `${event.pageY - 40}px`);
    },
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
    tip2Visible(textContent, event) {
      this.tip2Hidden();
      document.removeEventListener("click", this.listener3);
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
        let stext = e.target.innerText;
        let title = e.srcElement.parentElement.children[0].innerText;
        let outcome = title.substr(0, title.length - 2);
        if (stext.includes("Delete")) {
          this.deleteSonEdge(outcome, stext);
        } else {
          let text = e.srcElement.parentElement.children[2].innerText;
          this.reverseSonEdge(outcome, text);
        }
      }
    },
    deleteSonEdge(outcome, edge) {
      for (let i = outcome.length - 1; i >= 0; i--) {
        if (!outcome[i]) {
          outcome = outcome.substr(0, i - 1);
        }
      }
      let i = this.multipleSearchValue.selections.findIndex((selection) => {
        if (selection.outcome === outcome) return true;
        else return false;
      });
      let selection = this.multipleSearchValue.selections[i];
      let nodes = edge.split("(")[1].split(")")[0].split(", ");
      let history = {
        source: nodes[0],
        target: nodes[1],
      };
      let index = findLink.sameNodeLink(history, selection.linksList);
      this.deleteLinkView.model.remove({ ui: true });

      if (index > -1) {
        if (selection.linksList[index].add)
          selection.linksList.splice(index, 1);
        else selection.linksList[index].hidden = true;
        selection.history = historyManage.deleteEdge(
          selection.history,
          history
        );
        this.tip2Hidden();
        this.saveData();
      }
    },
    addTempLink(i, source, target) {
      let selection = this.multipleSearchValue.selections[i];

      let oIndex = findLink.sameNodeLink(
        { source, target },
        selection.linksList
      );
      if (oIndex > -1) {
        let originalLink = selection.linksList[oIndex];
        if (originalLink.hidden) originalLink.hidden = false;
        if (LinksManagement.getFinalLink(originalLink).source !== source) {
          originalLink.reverse = !originalLink.reverse;
          linkRequest.getLinkValue(source, target).then((response) => {
            let value = response.data.value;
            originalLink.value = value;
            this.addNewEdge(i, { source, target, value });
          });
        } else this.addNewEdge(i, originalLink);
      } else this.getNewEdge(i, source, target);
    },
    getNewEdge(i, source, target) {
      linkRequest.getLinkValue(source, target).then((response) => {
        let selection = this.multipleSearchValue.selections[i];
        let link = {
          source,
          target,
          value: response.data.value,
          add: true,
        };
        selection.linksList.push(link);
        this.addNewEdge(i, link);
      });
    },
    addNewEdge(i, link) {
      let selection = this.multipleSearchValue.selections[i];
      selection.history = historyManage.addEdge(selection.history, link);
      this.addLink(i, link);
      this.saveData();
    },
    getEdgeValue(i, source, target) {
      linkRequest.getLinkValue(target, source).then((response) => {
        this.changeEdge(i, { source, target, value: response.data.value });
      });
    },
    getSonGraphSize() {
      if (this.sonNum === 1) return { width: "97%", maxWidth: "97%" };
      else if (this.sonNum < 4) return { width: "47%", maxWidth: "47%" };
      else return { width: "30.33%", maxWidth: "30.33%" };
    },
    changeEdge(i, link) {
      let selection = this.multipleSearchValue.selections[i];
      let index = findLink.showSameDireLink(link, selection.linksList);
      if (index > -1) {
        this.deleteLinkView.model.remove({ ui: true });
        this.addLink(
          i,
          LinksManagement.reverseLink(
            link,
            selection.linksList,
            selection.history
          )
        ); //方向数据改，坐标数据不改
      }

      this.tip2Hidden();
      this.saveData();
    },
    reverseSonEdge(outcome, edge) {
      for (let i = outcome.length - 1; i >= 0; i--) {
        if (!outcome[i]) {
          outcome = outcome.substr(0, i - 1);
        }
      }
      let i = this.multipleSearchValue.selections.findIndex((selection) => {
        if (selection.outcome === outcome) return true;
        else return false;
      });

      let nodes = edge.split("(")[1].split(")")[0].split(", ");
      this.getEdgeValue(i, nodes[0], nodes[1]);
    },
    countLinks(index) {
      const nodes = this.sonGraphs[index].nodesList;

      let dom = document.getElementById("paper" + (index + 1));

      let links = LinksManagement.getFinalLinks(
        this.multipleSearchValue.selections[index].linksList
      );

      for (let i = 0; i < links.length; i++) {
        let link = links[i];
        let source = nodes[nodes.findIndex((node) => node.id === link.source)];
        let target = nodes[nodes.findIndex((node) => node.id === link.target)];

        link["points"] = this.countPoint(index, source, target);

        if (source.id === "smoke" && target.id === "trueage")
          console.log(link.points);
      }
      //使用jointjs绘制，nodes: 点及点坐标{id, type, x, y}，links: 边及边控制点坐标{source, target, points}
      let paper = drawCurveGraph(dom, nodes, this.scales[index], links);
      this.sonGraphs[index].linksList = links;

      return paper;
    },

    countPoint(i, source, target) {
      let mid = {
        x: this.scales[i].mid.x,
        y: (this.scales[i].mid.maxH + this.scales[i].mid.minH) / 2,
      };
      let points = [
        {
          x: source.x,
          y: source.y,
        },
      ];
      let controlPoints = countControl(source, target, mid);
      if (controlPoints.length === 2) {
        if (
          Math.abs(controlPoints[0].x - source.x) +
            Math.abs(controlPoints[0].y - source.y) <=
          0.21
        )
          controlPoints = [controlPoints[1]];
        else if (
          Math.abs(controlPoints[1].x - target.x) +
            Math.abs(controlPoints[1].y - target.y) <=
          0.21
        )
          controlPoints = [controlPoints[0]];
      }
      controlPoints.forEach((point) => points.push(point));
      points.push({
        x: target.x,
        y: target.y,
      });
      return points;
    },
    countMid(nodesList, source, target) {
      let nodes = nodesList.toSorted((a, b) => {
        return a.x - b.x;
      });
      let leftX = source.x < target.x ? source.x : target.x;
      let rightX = source.x < target.x ? target.x : source.x;
      let leftIndex = nodes.findIndex((node) => node.x === leftX);
      let rightIndex = nodes.findLastIndex((node) => node.x === rightX);
      let sum = 0;
      for (let j = leftIndex; j <= rightIndex; j++) sum = sum + nodes[j].x;
      return sum / (rightIndex - leftIndex + 1);
    },
    getNormalLayout() {
      this.ifCurve = false;
      this.sonGraphs = [];
      this.scales = [];
      for (let i = 0; i < this.sonNum; i++) {
        let ans = {};
        let selection = this.multipleSearchValue.selections[i];
        let originalPos = countOriginalSonPos(
          selection.outcome,
          selection.variable,
          selection.linksList
        );
        switch (this.graphType) {
          case "ExtractedSubGraph":
            ans = countExtractedSonPos(this.finalPos, selection);
            break;
          case "OriginalSubGraph":
            ans = originalPos;
            break;
          case "TightenedSubGraph":
            ans = countTightenedSonPos(
              this.finalPos[i + 1],
              this.finalPos[0].nodesList,
              selection.linksList
            );
        }
        this.scales.push({});
        this.sonGraphs.push(ans);
      }
    },
    getCurveLayout() {
      this.ifCurve = true;
      this.sonGraphs = [];
      for (let i = 0; i < this.sonNum; i++) {
        let pos = countRelativeSonPos(
          this.finalPos,
          this.multipleSearchValue.selections[i],
          this.sonNum
        );
        this.sonGraphs.push({
          linksList: [],
          nodesList: pos,
        });
      }
    },
    saveData() {
      localStorage.setItem(
        "GET_JSON_RESULT",
        JSON.stringify(this.multipleSearchValue)
      );
    },
    searchForPos(index, link) {
      if (findLink.sameNodeLink(link, this.sonGraphs[index].linksList) > -1)
        return;

      let ans = {};
      let selection = this.multipleSearchValue.selections[index];
      switch (this.graphType) {
        case "ExtractedSubGraph":
          ans = countExtractedSonPos(this.finalPos, selection);
          break;
        case "OriginalSubGraph":
          ans = countOriginalSonPos(
            selection.outcome,
            selection.variable,
            selection.linksList
          );
          break;
        case "TightenedSubGraph":
          ans = countTightenedSonPos(
            this.finalPos[index + 1],
            this.finalPos[0].nodesList,
            selection.linksList
          );
      }

      this.sonGraphs[index] = ans;
    },
    addLink(index, link) {
      let curveType = "TreeCurve";
      if (
        this.graphType === "ExtractedSubGraph" ||
        this.graphType === "OriginalSubGraph"
      )
        curveType = "ExtractedCurve";
      else if (!this.ifCurve) curveType = "TightenedCurve";
      if (!this.ifCurve) this.searchForPos(index, link);
      let sIndex = this.sonGraphs[index].nodesList.findIndex(
        (node) => node.id === link.source
      );
      let tIndex = this.sonGraphs[index].nodesList.findIndex(
        (node) => node.id == link.target
      );
      linksOperation.addLink(
        this.sonGraphs[index],
        link,
        this.paper,
        curveType,
        {
          ...LinksManagement.getNodeByName(this.paper, link),
          gap: this.scales[index].gap,
          points: this.countPoint(
            index,
            this.sonGraphs[index].nodesList[sIndex],
            this.sonGraphs[index].nodesList[tIndex]
          ),
        }
      );
    },
    init() {
      this.multipleSearchValue = JSON.parse(
        localStorage.getItem("GET_JSON_RESULT")
      );
      console.log("graph Type", this.graphType);
      if (this.graphType === "TightenedSubGraph")
        this.finalPos = JSON.parse(localStorage.getItem("SON_POS"));
      else this.finalPos = JSON.parse(localStorage.getItem("SIMPLE_POS"));
      console.log("finalPos", this.finalPos);
      if (this.multipleSearchValue) this.drawGraph();
    },
  },
  mounted() {
    this.init();
  },
};
</script>
<style scoped>
.sub-graph {
  display: flex;
  height: 100%;
  flex: 1;
}
.directed-tabs {
  background-color: rgb(55, 162, 228);
  height: 40px;
  display: flex;
  font-size: 20px;
  padding-left: 16px;
  gap: 16px;
}
.active-tab {
  background-color: white;
  border-radius: 4px 4px 0 0;
  color: rgb(55, 162, 228);
  vertical-align: center;
  text-align: center;
  padding-left: 8px;
  padding-right: 8px;
  line-height: 40px;
  cursor: pointer;
}
.normal-tab {
  background-color: rgb(55, 162, 228);
  border-radius: 4px 4px 0 0;
  color: white;
  vertical-align: center;
  text-align: center;
  padding-left: 8px;
  padding-right: 8px;
  line-height: 40px;
  cursor: pointer;
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
  flex: 1;
  min-width: 30%;
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
.thumbnail {
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 1000;
  width: 30% !important;
  height: 30% !important;
  border: 1px solid rgba(151, 151, 151, 0.49);
  background: white;
}
.one-line-operator {
  margin: 0 2%;
  height: auto;
  width: 96%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}
.son-title {
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  height: 24px;
  line-height: 24px;
}
.color-hint {
  height: 20px;
  width: 20px;
  margin-right: 8px;
  border-radius: 16px;
}
.one-line-operator .drawing-buttons {
  flex: 1;
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
.stress-score {
  padding: 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 24px;
}
.stress-func {
  font-size: 16px;
}
.stress-value {
  font-size: 16px;
}
</style>
<style>
.joint-link path {
  transition-duration: 0.2s;
}
.sub-graph .el-button--small.is-round {
  padding: 5px 9px;
}
</style>
