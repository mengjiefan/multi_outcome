<template>
  <div class="sub-graph">
    <div class="group-graphs">
      <div class="son-svg">
        <div
          v-for="index in sonNum"
          :key="index"
          :class="'paper' + index"
          class="paper-svg"
        >
          <div class="one-line-operator">
            <div class="son-title">
              <div
                class="color-hint"
                :style="[{ 'background-color': cmap[index - 1] }]"
              ></div>
              {{ multipleSearchValue.selections[index - 1].outcome }}
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
          <div :id="'paper' + index" class="svg-content"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import * as d3 from "d3";
import { ref } from "vue";
import { createChart } from "@/plugin/charts";
import { addHighLight, removeHighLight } from "@/plugin/sonGraph";
import { drawExtractedGraph, showHiddenEdge } from "@/plugin/superGraph";

import historyManage from "@/plugin/history";
import { countExtractedSonPos } from "@/plugin/extracted/CountPos";
import { countOriginalSonPos } from "@/plugin/original/CountPos";
import { LinksManagement } from "@/plugin/joint/linkAndNode.js";
import { findLink, linksOperation } from "@/plugin/links";
import { linkRequest } from "@/plugin/request/edge.js";

export default {
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      console.log(to.name);
      vm.init();
      vm.graphType = to.name;
    });
  },
  data() {
    return {
      graphType: ref(),
      scales: ref([]),
      papers: ref([]),
      paper: ref(),
      sonGraphs: ref([]),
      finalPos: ref(),
      ifGroup: ref(false),
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
      ],
    };
  },
  methods: {
    applySubGraph(index) {
      let selection = this.multipleSearchValue.selections[index];

      for (let i = 0; i < this.multipleSearchValue.selections.length; i++) {
        if (i == index) continue;
        this.applyToSingle(selection.linksList, i);
      }
      for (let i = 0; i < selection.linksList.length; i++) {
        let link = selection.linksList[i];
        let index = findLink.sameNodeLink(
          link,
          this.multipleSearchValue.linksList
        );
        if (index > -1) this.multipleSearchValue.linksList[index] = link;
        else this.multipleSearchValue.linksList.push(link);
      }

      this.saveData();
    },
    applyToSingle(answer, index) {
      let item = this.multipleSearchValue.selections[index];
      let flag = false;
      for (let i = 0; i < item.linksList.length; i++) {
        let link = item.linksList[i];
        let linkIndex = findLink.sameNodeLink(link, answer); //目标边在本图中有
        console.log(index, linkIndex);
        if (linkIndex > -1) {
          console.log(link);
          let mapLink = answer[linkIndex]; //现边
          if (findLink.showReverseLink(link, answer) > -1) {
            flag = true;
            historyManage.reverseEdge(item.history, {
              source: link.source,
              target: link.target,
              value: mapLink.value,
            });
            item.linksList.splice(i, 1, mapLink);
          }

          if (findLink.sameNodeLink(link, this.sonGraphs[index].linksList) < 0)
            flag = true;
          //然后目标边是新加的，没坐标
        }
      }

      if (flag) {
        switch (this.graphType) {
          case "ExtractedSubGraph":
            this.sonGraphs[index] = countExtractedSonPos(this.finalPos, item);
            break;
          case "OriginalSubGraph":
            this.sonGraphs[index] = countOriginalSonPos(
              item.outcome,
              item.variable,
              item.linksList
            );
            break;
        }
        console.log("apply and redraw");
        this.drawSonGraph(index);
      }
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
    drawGraph() {
      this.ifGroup = false;
      let that = this;
      this.sonNum = 0;
      if (this.tooltip2) {
        this.tip2Hidden();
      }
      this.tooltip = this.createTooltip(1);
      this.tooltip2 = this.createTooltip(2);
      this.multipleSearchValue.nodesList.forEach(function (state) {
        if (state.type === -1) that.ifGroup = true;
        else if (state.type === 0) that.sonNum++;
      });
      setTimeout(() => {
        this.drawSonGraphs();
      }, 0);
    },
    drawSonGraphs() {
      this.sonGraphs = [];
      this.scales = [];
      for (let i = 0; i < this.sonNum; i++) {
        let ans = {};
        let selection = this.multipleSearchValue.selections[i];
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
        }

        this.scales.push({});
        this.sonGraphs.push(ans);
      }
      const graphs = this.sonGraphs;

      let dom = document.getElementById("paper1");
      let minGap = 10000;

      let midX = [];
      let midY = [];

      graphs.forEach((graph) => {
        let minW = 150000;
        let maxW = 0;
        let minH = 15000;
        let maxH = 0;
        graph.nodesList.forEach((node) => {
          if (node.x > maxW) maxW = node.x;
          if (node.x < minW) minW = node.x;
          if (node.y > maxH) maxH = node.y;
          if (node.y < minH) minH = node.y;
        });
        graph.linksList.forEach((link) => {
          link.points.forEach((node) => {
            if (node.x > maxW) maxW = node.x;
            if (node.x < minW) minW = node.x;
            if (node.y > maxH) maxH = node.y;
            if (node.y < minH) minH = node.y;
          });
        });
        let gap = (dom.clientWidth - 40) / (maxW - minW);
        if ((dom.clientHeight - 120) / (maxH - minH) < gap)
          gap = (dom.clientHeight - 120) / (maxH - minH);
        if (gap < minGap) minGap = gap;
        midX.push(maxW + minW);
        midY.push(maxH + minH);
      });

      for (let i = 0; i < this.sonNum; i++) {
        let startX = (dom.clientWidth - minGap * midX[i]) / 2;
        let startY = (dom.clientHeight - 80 - minGap * midY[i]) / 2;
        this.scales[i] = {
          gap: minGap,
          startX,
          startY,
        };
        this.drawSonGraph(i);
      }
    },
    drawSonGraph(index) {
      for (let i = 0; i < this.sonGraphs[index].nodesList.length; i++)
        this.sonGraphs[index].nodesList[i]["indexes"] = this.getNodeIndex(
          this.sonGraphs[index].nodesList[i].id
        );
      let dom = document.getElementById("paper" + (index + 1));

      let paper = drawExtractedGraph(
        dom,
        this.sonGraphs[index].nodesList,
        this.sonGraphs[index].linksList,
        this.scales[index]
      );

      if (!this.papers[index]) {
        this.papers.push(paper);
      } else this.papers[index] = paper;
      this.setPaper(index, paper);
      this.drawAddEdges(index);
    },
    drawAddEdges(index) {
      this.paper = this.papers[index];
      let addEdges = this.multipleSearchValue.selections[
        index
      ].linksList.filter((link) => link.add);
      console.log("addedges", addEdges);
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
    tipVisible(textContent, event) {
      this.tip2Hidden();
      document.removeEventListener("click", this.listener3);
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
    tipHidden() {
      this.tooltip
        .transition()
        .duration(100)
        .style("opacity", 0)
        .style("display", "none");
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
    //TODO:需检查  尤其是改过了reverseLink方法
    showHiddenLink(i, source, target) {
      let selection = this.multipleSearchValue.selections[i];
      let index = findLink.sameNodeLink(
        { source, target },
        selection.linksList
      );
      let link = selection.linksList[index];

      index = findLink.sameNodeLink(
        { source, target },
        this.sonGraphs[i].linksList
      );
      let nowlink = this.sonGraphs[i].linksList[index];
      index = findLink.showReverseLink({ source, target }, selection.linksList);
      if (index > -1) {
        LinksManagement.reverseLink(link);
        historyManage.reverseEdge(selection.history, {
          source: target,
          target: source,
          value: link.value,
        });
        //LinksManagement.reverseLink(nowlink);

        nowlink.value = link.value;
      }

      showHiddenEdge(this.paper, nowlink, this.scales[i], this.sonGraphs[i]);
      this.saveData();
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
        if (link.get("source").id && link.get("target").id) {
          _this.deleteLinkView = link.findView(paper);
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

      let index = selection.linksList.findIndex(function (row) {
        if (
          (row.source === nodes[0] && row.target === nodes[1]) ||
          (row.source === nodes[1] && row.target === nodes[0])
        ) {
          return true;
        } else return false;
      });
      this.deleteLinkView.model.remove({ ui: true });
      if (index > -1) {
        let history = historyManage.deleteEdge(selection.history, {
          source: nodes[0],
          target: nodes[1],
        });
        selection.linksList.splice(index, 1);

        selection.history = history;
        this.tip2Hidden();
        this.saveData();
      }
    },
    addTempLink(i, source, target) {
      /*
      let oIndex = findLink.sameNodeLink(
        { source, target },
        this.multipleSearchValue.linksList
      );
      if (oIndex > -1) {
        let originalLink = this.multipleSearchValue.linksList[oIndex];
        this.deleteLinkView.model.remove({ ui: true });
        if (originalLink.hidden) {
          originalLink.hidden = false;
        }
        if (originalLink.source !== source) {
          linkRequest.getLinkValue(source, target).then((response) => {
            let value = response.data.value;
            this.reverseAndShow(source, target, value);
          });
        } else this.showHiddenLink(source, target);
      } else */ this.getNewEdge(i, source, target);
    },
    getNewEdge(i, source, target) {
      linkRequest.getLinkValue(source, target).then((response) => {
        this.addNewEdge(i, { source, target, value: response.data.value });
      });
    },
    addNewEdge(i, link) {
      let selection = this.multipleSearchValue.selections[i];
      selection.linksList.push({ ...link, add: true });
      selection.history = historyManage.addEdge(selection.history, link);
      this.addLink(i, link);
      this.saveData();
    },
    getEdgeValue(i, source, target) {
      linkRequest.getLinkValue(target, source).then((response) => {
        this.changeEdge(i, { source, target, value: response.data.value });
      });
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
    addLink(index, link) {
      linksOperation.addLink(
        this.sonGraphs[index],
        link,
        this.paper,
        "ExtractedCurve",
        {
          gap: this.scales[index].gap,
        }
      );
    },
    saveData() {
      localStorage.setItem(
        "GET_JSON_RESULT",
        JSON.stringify(this.multipleSearchValue)
      );
    },
    init() {
      this.multipleSearchValue = JSON.parse(
        localStorage.getItem("GET_JSON_RESULT")
      );
      this.finalPos = JSON.parse(localStorage.getItem("SIMPLE_POS"));
      if (this.multipleSearchValue) {
        this.drawGraph();
      }
    },
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
  padding: 1%;
  margin: 0.5%;
  border: 1px solid rgba(151, 151, 151, 0.49);
  flex: 1 1/3;
  min-width: 30%;
}
.svg-content {
  width: 100%;
  height: 90% !important;
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
  display: flex;
  align-items: center;
}
.color-hint {
  height: 20px;
  width: 20px;
  margin-right: 8px;
  border-radius: 16px;
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
  <style>
.joint-link path {
  transition-duration: 0.2s;
}
</style>
     