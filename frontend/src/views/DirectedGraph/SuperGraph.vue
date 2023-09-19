<template>
  <div class="super-graph">
    <div class="guide-line">
      <div class="drawing-buttons">
        <el-button @click="saveToTable" type="success" size="small" round
          >Save to Table</el-button
        >
        <el-button
          @click="trulyDelete()"
          type="success"
          round
          size="small"
          :disabled="hasNoHidden"
        >
          Relayout
        </el-button>
      </div>
      <div class="graph-directors">
        <div
          class="single-hint"
          v-for="(child, index) in multipleSearchValue.selections"
          :key="index"
        >
          <div
            class="color-hint"
            :style="[{ 'background-color': cmap[index] }]"
          ></div>
          <div class="outcome-name">{{ child.outcome }}</div>
        </div>
      </div>
    </div>
    <div id="paper" class="sum-svg"></div>
  </div>
</template>

<script>
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import dagre from "dagre";
import axios from "axios";
import { ref } from "vue";
import * as joint from "jointjs";
import "/node_modules/jointjs/dist/joint.css";
import { createChart } from "@/plugin/charts";
import {
  drawSuperGraph,
  setSuperGraph,
  showHiddenEdge,
} from "@/plugin/superGraph";
import historyManage from "@/plugin/history";
import { countPos } from "@/plugin/tightened/CountPos";
import { countSimplePos } from "@/plugin/extracted/CountPos";
import { addHighLight, removeHighLight } from "@/plugin/sonGraph";
import { findLink } from "@/plugin/links";
import { linkRequest } from "@/plugin/request/edge.js";

export default {
  name: "DirectedGraph",
  setup() {
    return {};
  },
  data() {
    return {
      simplePos: ref(),
      paper: ref(),
      scale: ref(),
      g: ref(),
      ifGroup: ref(false),
      loadingInstance: ref(null),
      countingGraph: ref(false),
      deleteLinkView: ref(),
      tooltip: null,
      tooltip2: null,
      sonNum: ref(0),
      transform: ref(),
      hasNoHidden: ref(true),
      tip2Show: ref(false),
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

    trulyDelete() {
      this.simplePos = null;
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
      this.multipleSearchValue.selections =
        this.multipleSearchValue.selections.map((selection) => {
          return this.trulyDeleteSon(selection);
        });
      this.hasNoHidden = true;
      this.saveData();
      this.drawGraph();
    },
    trulyDeleteSon(son) {
      let all = this.multipleSearchValue.linksList;
      son.linksList = son.linksList.filter((link) => !link.hidden);
      let linksList = [];
      for (let i = 0; i < son.linksList.length; i++) {
        let link = son.linksList[i];
        let index = all.findIndex((item) => {
          if (link.source === item.source && link.target === item.target)
            return true;
          else if (link.source === item.target && link.target === item.source)
            return true;
          else return false;
        });
        if (index > -1) {
          linksList.push(all[index]);
        }
        if (link.source === all[index].source && link.reverse) {
          historyManage.reverseEdge(son.history, {
            source: link.target,
            target: link.source,
            value: all[index].value,
          });
        } else if (link.source !== all[index].source && !link.reverse) {
          historyManage.reverseEdge(son.history, {
            source: link.source,
            target: link.target,
            value: all[index].value,
          });
        }
      }
      son.linksList = linksList;
      return son;
    },

    setGraph() {
      var data = this.multipleSearchValue;
      let g = new dagreD3.graphlib.Graph({ compound: true }).setGraph({
        ranker: "tight-tree",
      });
      let that = this;
      setSuperGraph(g, data);
      //save positon and redraw, which need to know the direction of edges
      const simpleG = g;

      that.simplePos = countSimplePos(
        simpleG,
        this.multipleSearchValue.nodesList,
        this.multipleSearchValue.linksList
      );
      console.log("simplePos", that.simplePos);

      let commonNodes = [];
      for (let i = 0; i < this.simplePos.nodesList.length; i++) {
        this.simplePos.nodesList[i]["indexes"] = this.getNodeIndex(
          this.simplePos.nodesList[i].id
        );
        if (this.simplePos.nodesList[i].indexes.length > 1)
          commonNodes.push(this.simplePos.nodesList[i].id);
      }

      let finalPos = countPos(
        g,
        this.multipleSearchValue.selections,
        commonNodes
      );
      localStorage.setItem("SON_POS", JSON.stringify(finalPos));
      setTimeout(() => {
        that.redrawGraph();
      }, 0);
    },
    redrawGraph() {
      localStorage.setItem("SIMPLE_POS", JSON.stringify(this.simplePos));
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
      let gap = 1000 / (maxW - minW);
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
    getWidth(router) {
      if (!router) return "-";
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
      this.multipleSearchValue.selections.forEach((selection) => {
        let index = findLink.showReverseLink(
          { source, target },
          selection.linksList
        );
        if (index > -1) {
          link = selection.linksList[index];
          if (link.reverse) link.reverse = false;
          else link["reverse"] = true;
          link.value = value;
        }
      });
      index = findLink.showSameDireLink(
        { source, target },
        this.simplePos.linksList
      );

      link = this.simplePos.linksList[index];
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
        if (originalLink.hidden) {
          originalLink.hidden = false;
          this.multipleSearchValue.selections.forEach((selection) => {
            let index = findLink.sameNodeLink(
              { source, target },
              selection.linksList
            );
            if (index > -1 && selection.linksList[index].hidden)
              selection.linksList[index].hidden = false;
          });
        }
        if (originalLink.source !== source) {
          linkRequest.getLinkValue(source, target).then((response) => {
            let value = response.data.value;
            this.reverseAndShow(source, target, value);
          });
        } else this.showHiddenLink(source, target);
      } else this.getEdgeValue(source, target);
    },
    emphasizeLink(source, target) {
      let oIndex = findLink.showSameDireLink(
        { source, target },
        this.multipleSearchValue.linksList
      );
      let value = this.multipleSearchValue.linksList[oIndex].value;
      let history = {
        source: target,
        target: source,
        reverse: true,
      };
      for (let i = 0; i < this.multipleSearchValue.selections.length; i++) {
        let selection = this.multipleSearchValue.selections[i];
        historyManage.reverseEdge(selection.history, history);
        let index = findLink.showSameDireLink(history, selection.linksList);
        console.log(index);
        if (index < 0) continue;
        let link = selection.linksList[index];
        link.value = value;
        if (link.source === history.source) link["reverse"] = true;
        else if (link.source === history.target) link.reverse = false;
      }
      this.saveData();
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
                _this.emphasizeLink(realLink.source, realLink.target);
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

    getNodeIndex(id) {
      let indexes = [];
      for (let i = 0; i < this.multipleSearchValue.selections.length; i++) {
        let selection = this.multipleSearchValue.selections[i];
        if (selection.outcome === id) indexes.push(i);
        else if (selection.variable.includes(id)) indexes.push(i);
      }
      return indexes;
    },
    drawGraph() {
      this.ifGroup = false;
      let that = this;
      this.sonNum = 0;
      this.multipleSearchValue.nodesList.forEach(function (state) {
        if (state.type === -1) that.ifGroup = true;
        else if (state.type === 0) that.sonNum++;
      });
      setTimeout(() => {
        this.setGraph();
      }, 0);
    },
    plotChart(line) {
      let dom = document.getElementsByClassName(line)[0];
      createChart(dom, line);
    },
    saveData() {
      localStorage.setItem(
        "GET_JSON_RESULT",
        JSON.stringify(this.multipleSearchValue)
      );
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
      let vertices = [];
      if (this.deleteLinkView.model.attributes.vertices)
        vertices = this.deleteLinkView.model.attributes.vertices.reverse();
      path.vertices(vertices);
      path.source(nodesList[sIndex].node);
      path.target(nodesList[tIndex].node);
      path.addTo(this.paper.model);
    },
    getEdgeValue(source, target) {
      console.log("getEdgeVa");
      linkRequest.getLinkValue(target, source).then((response) => {
        console.log("value", response.data.value);
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
      let history = {
        source,
        target,
        value, //the true value after reversing
      };
      if (index > -1) {
        console.log(this.multipleSearchValue.linksList[index]);
        this.deleteLinkView.model.remove({ ui: true });
        this.multipleSearchValue.linksList[index].value = value;
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
        //所有子图都改变，都要增加操作历史
        for (let i = 0; i < this.multipleSearchValue.selections.length; i++) {
          let selection = this.multipleSearchValue.selections[i];
          historyManage.reverseEdge(selection.history, history);
          let index = selection.linksList.findIndex((link) => {
            if (
              link.source === source &&
              link.target === target &&
              !link.hidden
            )
              return true;
            else if (
              link.source === target &&
              link.target === source &&
              !link.hidden
            )
              return true;
          });
          if (index < 0) continue;
          let link = selection.linksList[index];
          link.value = value;
          if (link.source === source && !link.reverse) {
            link["reverse"] = true;
          } else if (link.source === target && link.reverse) {
            link.reverse = false;
          }
        }
        this.saveData();
        this.tip2Hidden();
      } else {
        let newLink = { source, target, value };
        this.multipleSearchValue.linksList.push(newLink);
        this.multipleSearchValue.selections.forEach((selection) => {
          let node = selection.variable.concat([selection.outcomt]);
          if (node.includes(source) && node.includes(target))
            selection.linksList.push(newLink);
        });
        this.saveData();
        this.setGraph();
      }
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
        let history = {
          source: nodes[0],
          target: nodes[1],
        };
        this.multipleSearchValue.linksList[index] = {
          source: nodes[0],
          target: nodes[1],
          value: this.multipleSearchValue.linksList[index].value,
          hidden: true,
        };
        for (let i = 0; i < this.multipleSearchValue.selections.length; i++) {
          let selection = this.multipleSearchValue.selections[i];
          selection.history = historyManage.deleteEdge(
            selection.history,
            history
          );
          let index = selection.linksList.findIndex((link) => {
            if (
              link.source === history.source &&
              link.target === history.target &&
              !link.hidden
            )
              return true;
            else if (
              link.source === history.target &&
              link.target === history.source &&
              !link.hidden
            )
              return true;
          });
          if (index < 0) continue;
          let link = selection.linksList[index];
          link["hidden"] = true;
        }
        this.saveData();
        this.hasNoHidden = false;
        this.tip2Hidden();
        this.deleteLinkView.model.remove({ ui: true });
      }
    },
    // create tooltip but not show it
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
.super-graph {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.guide-line {
  display: flex;
  justify-content: space-between;
  padding: 16px;
}
.graph-directors {
  display: flex;
  gap: 12px;
}
.single-hint {
  display: flex;
  align-items: center;
  gap: 8px;
}
.color-hint {
  height: 16px;
  width: 16px;
  border-radius: 16px;
}
.outcome-name {
  font-size: 16px;
}
.drawing-buttons {
  height: 10;
}
.sum-svg {
  display: flex;
  width: 100%;
  height: 90%;
  padding: 16px;
}
</style>