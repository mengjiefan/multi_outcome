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
          <div :id="'paper' + index" class="svg-content">
            <svg></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  <script>
import axios from "axios";
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import dagre from "@/plugin/dagre/dagre";
import { ref } from "vue";
import { Loading } from "element-ui";
import { createChart } from "@/plugin/charts";
import { addHighLight, removeHighLight } from "@/plugin/sonGraph";
import { drawExtractedGraph } from "@/plugin/superGraph";
import * as joint from "jointjs";
import historyManage from "@/plugin/history";
import { countSonPos, countSimplePos } from "@/plugin/extracted/CountPos";

export default {
  data() {
    return {
      papers: ref([]),
      paper: ref(),
      sonGraphs: ref([]),
      finalPos: ref(),
      gaps: [],
      ifGroup: ref(false),
      loadingInstance: ref(null),
      countingGraph: ref(false),
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
        let item = this.multipleSearchValue.selections[i];
        this.applyToSingle(selection.linksList, item);
        this.sonGraphs[i] = countSonPos(
          this.finalPos,
          this.multipleSearchValue.selections[i]
        );
        this.setSonGraph(i);
      }
      for (let i = 0; i < this.multipleSearchValue.linksList.length; i++) {
        let link = this.multipleSearchValue.linksList[i];
        let mapLink = link;
        let index = selection.linksList.findIndex((edge) => {
          if (edge.source === link.source && edge.target === link.target)
            return true;
          else return false;
        });
        if (index > -1) mapLink = selection.linksList[index];
        this.multipleSearchValue.linksList[i] = mapLink;
      }
      this.saveData();
    },
    applyToSingle(answer, item) {
      for (let i = 0; i < item.linksList.length; i++) {
        let link = item.linksList[i];
        let mapLink = link;
        let index = answer.findIndex((edge) => {
          if (edge.source === link.source && edge.target === link.target)
            return true;
          else return false;
        });
        if (index > -1) {
          mapLink = answer[index];
          if (link.hidden) {
            mapLink = link;
          } else if (mapLink.hidden) {
            item.history = historyManage.deleteEdge(item.history, link);
          } else if (mapLink.reverse && !link.reverse) {
            historyManage.reverseEdge(item.history, mapLink);
          } else if (link.reverse && !mapLink.reverse) {
            historyManage.reverseEdge(item.history, {
              target: link.source,
              source: link.target,
              value: mapLink.value,
            });
          }
        }
        item.linksList[i] = mapLink;
      }
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
      this.gaps = [];
      for (let i = 0; i < this.sonNum; i++) {
        let ans = countSonPos(
          this.finalPos,
          this.multipleSearchValue.selections[i]
        );
        this.sonGraphs.push(ans);
        this.gaps.push(1);
      }

      for (let i = 0; i < this.sonNum; i++) {
        this.setSonGraph(i);
      }
      //this.setSonGraph(0);
    },
    traversal(list, value, id, ids) {
      let index = list.lastIndexOf(value);
      if (index > -1) {
        list.splice(index, 0, value);
        ids.splice(index, 0, id);
        return;
      }
      let i;
      for (i = 0; i < list.length; i++) {
        if (value < list[i]) {
          list.splice(i, 0, value);
          ids.splice(i, 0, id);
          break;
        }
      }
      if (i === list.length) {
        list.push(value);
        ids.push(id);
      }
    },
    setSonGraph(index) {
      var data = this.sonGraphs[index];
      var states = data.nodesList;
      var edges = data.linksList;

      let g = new dagreD3.graphlib.Graph({}).setGraph({});

      let fixedY = [];
      let fixedNode = [];
      let that = this;
      this.multipleSearchValue.nodesList.forEach((node) => {
        let index = states.findIndex((state) => {
          if (
            state.id === node.id &&
            state.indexes.length === that.sonNum
          )
            return true;
          else return false;
        });
        if (index > -1)
          that.traversal(fixedY, states[index].y, node.id, fixedNode);
      });
      /*
      states.forEach(function (state) {
        if (state.indexes.length === that.sonNum) {
          that.traversal(fixedY, state.y, state.id, fixedNode);
        }
      });*/
      /*
      for (let i = 1; i < fixedNode.length; i++) {
        let source = fixedNode[i];
        let target = fixedNode[i - 1];
        let k = edges.findIndex((edge) => {
          if (edge.source === source && edge.target === target) return true;
          else if (edge.target === source && edge.source === target)
            return true;
          else return false;
        });
        if (k < 0) {
          console.log({
            index,
            source,
            target,
          });
          edges.push({
            source,
            target,
            temp: true,
            value: 0,
          });
        }
      }
      */
      states.forEach(function (state) {
        if (state.indexes.length === that.sonNum)
          console.log(state.id, fixedNode.indexOf(state.id));
        g.setNode(state.id, {
          orank: fixedNode.indexOf(state.id) * 2,
          fixed: state.indexes.length === that.sonNum,
          type: state.type,
        });
      });

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
        node.style = "fill:" + that.cmap[0];
      });
      dagre.layout(g);
      let simplePos = countSimplePos(g, data.nodesList, data.linksList);
      this.drawSonGraph(index, simplePos);
      /*
      if (index === 3) {
        let render = new dagreD3.render();
        // 选择 svg 并添加一个g元素作为绘图容器.
        let svgGroup = d3.select("svg").append("g");
        // 在绘图容器上运行渲染器生成流程图.
        render(svgGroup, g);
      }*/
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
    drawSonGraph(index, simplePos) {
      let dom = document.getElementById("paper" + (index + 1));
      for (let i = 0; i < simplePos.nodesList.length; i++) {
        simplePos.nodesList[i]["indexes"] = this.getNodeIndex(
          simplePos.nodesList[i].id
        );
      }
      let minW = 150000;
      let maxW = 0;
      let minH = 15000;
      let maxH = 0;
      simplePos.nodesList.forEach((node) => {
        if (node.x > maxW) maxW = node.x;
        if (node.x < minW) minW = node.x;
        if (node.y > maxH) maxH = node.y;
        if (node.y < minH) minH = node.y;
      });
      let gap = (dom.clientWidth - 32) / (maxW - minW + 24);
      if ((dom.clientHeight - 96) / (maxH - minH + 24) < gap)
        gap = (dom.clientHeight - 96) / (maxH - minH + 24);
      let startX = (dom.clientWidth - gap * (maxW - minW)) / 2 - minW * gap;
      let startY =
        (dom.clientHeight - 64 - gap * (maxH - minH)) / 2 - minH * gap;
      this.gaps[index] = gap;

      let paper = drawExtractedGraph(
        dom,
        simplePos.nodesList,
        simplePos.linksList,
        {
          gap,
          startX,
          startY,
        },
        index
      );

      if (!this.papers[index]) {
        this.papers.push(paper);
      } else this.papers[index] = paper;
      this.setPaper(index, paper);
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
    setPaper(index, paper) {
      const _this = this;
      let outcome = this.multipleSearchValue.selections[index].outcome;

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
        selection.linksList[index] = {
          source: selection.linksList[index].source,
          target: selection.linksList[index].target,
          value: selection.linksList[index].value,
          hidden: true,
        };
        selection.history = history;
        this.tip2Hidden();
        this.saveData();
      }
    },
    getEdgeValue(i, source, target) {
      axios({
        //请求类型
        method: "GET",
        //URL
        url: "http://localhost:8000/api/recaculate_Links",
        //参数
        params: {
          dataset: localStorage.getItem("DATATYPE"),
          source: target,
          target: source,
        },
      })
        .then((response) => {
          console.log("value", response.data.value);
          let value = response.data.value;
          this.changeEdge(i, source, target, value);
        })
        .catch((error) => {
          console.log("请求失败了", error.message);
        });
    },
    changeEdge(i, source, target, value) {
      let selection = this.multipleSearchValue.selections[i];
      let index = selection.linksList.findIndex(function (row) {
        if (
          (row.source === source &&
            row.target === target &&
            !row.hidden &&
            !row.reverse) ||
          (row.source === target &&
            row.target === source &&
            !row.hidden &&
            row.reverse)
        ) {
          return true;
        } else return false;
      });
      if (index > -1) {
        this.deleteLinkView.model.remove({ ui: true });

        historyManage.reverseEdge(selection.history, {
          source,
          target,
          value,
        });
        selection.linksList[index].value = value;
        if (!selection.linksList[index].reverse) {
          selection.linksList[index]["reverse"] = true;
          this.addLink(i, {
            source: selection.linksList[index].target,
            target: selection.linksList[index].source,
            value,
          });
        } else {
          selection.linksList[index].reverse = false;
          this.addLink(i, selection.linksList[index]);
        }
        this.tip2Hidden();
        this.saveData();
      }
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
      var path = new joint.shapes.standard.Link({});
      let attributes = this.deleteLinkView.model.attributes;
      const _this = this;
      let value = Math.abs(link.value);
      if (value > 1) value = 1;
      path.attr({
        id: "(" + link.source + ", " + link.target + ")",
        line: {
          strokeWidth: value * 8 * _this.gaps[index],
          targetMarker: {
            type: "path",
            stroke: "black",
            "stroke-width": value * 7 * _this.gaps[index],
            fill: "transparent",
            d: "M 10 -5 0 0 10 5 ",
          },
        },
      });
      if (link.value < 0) path.attr("line/strokeDasharray", "4 4");
      let source = attributes.target;
      let target = attributes.source;

      if (attributes.attrs.line.targetMarker)
        path.attr("line/targetMarker", null);
      path.connector("rounded");
      let vertices = attributes.vertices.reverse();
      path.vertices(vertices);
      path.source(source);
      path.target(target);
      path.addTo(this.paper.model);
    },
    saveData() {
      localStorage.setItem(
        "GET_JSON_RESULT",
        JSON.stringify(this.multipleSearchValue)
      );
    },
  },
  mounted() {
    this.multipleSearchValue = JSON.parse(
      localStorage.getItem("GET_JSON_RESULT")
    );
    console.log("getItem", this.multipleSearchValue);
    this.finalPos = JSON.parse(localStorage.getItem("SIMPLE_POS"));
    if (this.multipleSearchValue) {
      this.drawGraph();
    }
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
.svg-content svg {
  width: 100%;
  height: 100%;
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
   