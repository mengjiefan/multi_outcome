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
                :style="[{ 'background-color': cmap[index-1] }]"
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
    <svg
      id="gradient-svg"
      aria-hidden="true"
      focusable="false"
      style="width: 0; height: 0; position: absolute"
    ></svg>
  </div>
</template>
  <script>
import * as d3 from "d3";
import { ref } from "vue";
import { Loading } from "element-ui";
import { createChart } from "@/plugin/charts";
import {
  drawSonCharts,
  addHighLight,
  removeHighLight,
} from "@/plugin/sonGraph";
import * as joint from "jointjs";
import historyManage from "@/plugin/history";
import { countSonPos } from "@/plugin/tightened/CountPos";

export default {
  data() {
    return {
      papers: ref([]),
      paper: ref(),
      gap: ref(),
      sonGraphs: ref([]),
      finalPos: ref(),
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
        this.drawSonGraph(i);
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
            historyManage.reverseEdge(item.history, link);
          } else if (link.reverse && !mapLink.reverse) {
            historyManage.reverseEdge(item.history, mapLink);
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
    createTooltip() {
      return d3
        .select("body")
        .append("div")
        .classed("tooltip", true)
        .style("opacity", 0)
        .style("display", "none");
    },
    drawGraph() {
      this.ifGroup = false;
      let that = this;
      this.sonNum = 0;
      if (this.tooltip2) {
        this.tip2Hidden();
      }

      this.tooltip2 = this.createTooltip();
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
      let gap = {
        xGap: 66,
        yGap: 80,
      };
      for (let i = 1; i <= this.sonNum; i++) {
        let ans = countSonPos(
          this.finalPos[i],
          this.finalPos[0].nodesList,
          this.multipleSearchValue.selections[i - 1].linksList
        );
        this.sonGraphs.push({
          nodes: ans.sonPos,
          links: ans.linksPos,
        });
        if (this.sonNum > 4) ans.gap.xGap = ans.gap.xGap / 4;
        else ans.gap.xGap = ans.gap.xGap / this.sonNum;
        if (ans.gap.xGap < gap.xGap) {
          gap.xGap = ans.gap.xGap;
        }
        if (this.sonNum > 8) ans.gap.yGap = ans.gap.yGap / 3;
        else if (this.sonNum > 4) ans.gap.yGap = ans.gap.yGap / 2;
        if (ans.gap.yGap < gap.yGap) {
          gap.yGap = ans.gap.yGap;
        }
      }
      this.gap = gap;
      for (let i = 1; i <= this.sonNum; i++) {
        this.drawSonGraph(i - 1);
      }
    },
    drawSonGraph(index) {
      let dom = document.getElementById("paper" + (index + 1));
      for (let i = 0; i < this.sonGraphs[index].nodes.length; i++)
        this.sonGraphs[index].nodes[i]["indexes"] = this.getNodeIndex(
          this.sonGraphs[index].nodes[i].id
        );
      let paper = drawSonCharts(
        dom,
        this.sonGraphs[index].nodes,
        this.multipleSearchValue.selections[index].linksList,
        this.gap,
        index,
        this.sonGraphs[index].links
      );
      if (!this.papers[index]) {
        this.papers.push(paper);
      } else this.papers[index] = paper;
      this.setPaper(index, paper);
    },
    setPaper(index, paper) {
      const _this = this;
      let outcome = this.multipleSearchValue.selections[index].outcome;

      paper.on("link:mouseenter", function (linkView) {
        linkView.model.attr("line/stroke", "#1f77b4");
      });
      paper.on("link:mouseout", function (linkView) {
        linkView.model.attr("line/stroke", "black");
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
        _this.highLightAllPaper(elementView.model.attributes.attrs.title);
      });
      paper.on("element:mouseout", function (elementView, evt) {
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

      let selection = this.multipleSearchValue.selections[i];
      let nodes = edge.split("(")[1].split(")")[0].split(", ");

      let index = selection.linksList.findIndex(function (row) {
        if (
          (row.source === nodes[0] &&
            row.target === nodes[1] &&
            !row.hidden &&
            !row.reverse) ||
          (row.source === nodes[1] &&
            row.target === nodes[0] &&
            !row.hidden &&
            row.reverse)
        ) {
          return true;
        } else return false;
      });
      if (index > -1) {
        this.deleteLinkView.model.remove({ ui: true });

        historyManage.reverseEdge(selection.history, {
          source: nodes[0],
          target: nodes[1],
        });
        if (!selection.linksList[index].reverse) {
          selection.linksList[index]["reverse"] = true;
          this.addLink(this.sonGraphs[i].nodes, {
            source: selection.linksList[index].target,
            target: selection.linksList[index].source,
            value: selection.linksList[index].value,
          });
        } else {
          selection.linksList[index].reverse = false;
          this.addLink(this.sonGraphs[i].nodes, selection.linksList[index]);
        }
        this.tip2Hidden();
        this.saveData();
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
      if (link.value < 0)
        path.attr({
          id: "(" + link.source + ", " + link.target + ")",
          line: {
            strokeWidth: -link.value * 10 + "",
            strokeDasharray: "4 4",
          },
        });
      else {
        path.attr({
          id: "(" + link.source + ", " + link.target + ")",
          line: {
            strokeWidth: link.value * 10 + "",
          },
        });
      }
      path.source(nodesList[sIndex].node);
      path.target(nodesList[tIndex].node);
      path.addTo(this.paper.model);
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
    setGradient() {
      let nodes = this.multipleSearchValue.nodesList;
      let gradientSvg = document.getElementById("gradient-svg");
      let that = this;

      // Set some general styles
      nodes.forEach(function (node) {
        let v = node.id;
        let indexes = that.getNodeIndex(v);

        v = v.replaceAll("_", "");
        if (indexes.length !== 1) {
          let gradient = document.getElementById(v);

          if (gradient) gradientSvg.removeChild(gradient);

          gradient = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "linearGradient"
          );
          gradient.setAttribute("id", v);

          for (let i = 0; i < indexes.length; i++) {
            let stop = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "stop"
            );
            stop.setAttribute("offset", (1 / (indexes.length - 1)) * i);
            stop.setAttribute("stop-color", that.cmap[indexes[i]]);
            gradient.appendChild(stop);
          }
          gradientSvg.appendChild(gradient);
        }
      });
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
    this.setGradient();
    console.log("getItem", this.multipleSearchValue);
    this.finalPos = JSON.parse(localStorage.getItem("SON_POS"));
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
   