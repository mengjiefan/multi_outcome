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
import { LinksManagement } from "@/plugin/joint/linkAndNode";
import { findLink, linksOperation } from "@/plugin/links";
import { linkRequest } from "@/plugin/request/edge";
import { createChart } from "@/plugin/charts";
import {
  drawTightenedGraph,
  addHighLight,
  removeHighLight,
} from "@/plugin/sonGraph";
import * as joint from "jointjs";
import historyManage from "@/plugin/history";
import { countSonPos } from "@/plugin/tightened/CountPos";

export default {
  data() {
    return {
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
      console.log(tooltips.length, number, "tooltip");
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

    drawSonGraphs() {
      this.sonGraphs = [];

      for (let i = 1; i <= this.sonNum; i++) {
        let ans = countSonPos(
          this.finalPos[i],
          this.finalPos[0].nodesList,
          this.multipleSearchValue.selections[i - 1].linksList
        );
        this.sonGraphs.push({
          nodesList: ans.sonPos,
          linksList: ans.linksPos,
        });
        this.scales.push({});
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
      let dom = document.getElementById("paper" + (index + 1));
      for (let i = 0; i < this.sonGraphs[index].nodesList.length; i++)
        this.sonGraphs[index].nodesList[i]["indexes"] = this.getNodeIndex(
          this.sonGraphs[index].nodesList[i].id
        );

      let paper = drawTightenedGraph(
        dom,
        this.sonGraphs[index].nodesList,
        this.multipleSearchValue.selections[index].linksList,
        this.scales[index],
        this.sonGraphs[index].linksList
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
    plotChart(line) {
      let dom = document.getElementsByClassName(line)[0];
      createChart(dom, line);
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

    addTempLink(i, source, target) {
      /*TODO*/
      this.getNewEdge(i, source, target);
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
    checkDirection(source, target) {
      if (source.y <= target.y) return "DOWN";
      else return "UP";
    },
    addLink(index, link) {
      linksOperation.addLink(
        this.sonGraphs[index],
        link,
        this.paper,
        "TightenedCurve",
        {
          gap: this.scales[index].gap,
        }
      );
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
  },

  mounted() {
    console.log(1);
  },
};
</script>
  