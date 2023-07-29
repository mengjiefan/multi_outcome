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
              · {{ multipleSearchValue.selections[index - 1].outcome }}
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
          <svg>
            <g />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import axios from "axios";
import { ref } from "vue";
import { Loading } from "element-ui";
import dagre from "dagre-d3/lib/dagre";
import { createChart } from "@/plugin/charts";
import historyManage from "@/plugin/history";
import singleGraph from "@/plugin/singleGraph";

var cmap = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

export default {
  name: "DirectedGraph",
  setup() {
    return {
      transform: ref([]),
    };
  },
  data() {
    return {
      ifGroup: ref(false),
      tooltip: null,
      tooltip2: null,
      tip2Show: ref(false),
      sonNum: ref(0),
      multipleSearchValue: ref({
        nodesList: [],
        linksList: [],
      }),
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

    setSonGraph(i) {
      const _this = this;
      let selection = this.multipleSearchValue.selections[i];
      let svg = d3.select(".paper" + (i + 1)).select("svg");
      let inner = svg.select("g");
      inner
        .selectAll("g.node")
        .on("mouseover", (v, id) => {
          if (
            (selection.variable.includes(id) || selection.outcome === id) &&
            v.fromElement.__data__ !== "group"
          )
            v.fromElement.setAttribute("id", "hover-node");
        })
        .on("mouseout", (v) => {
          v.fromElement.setAttribute("id", "");
        });
      svg
        .selectAll(".edgePath")
        .select(".path")
        .on("mouseover", function (d, id) {
          if (d3.select(this).style("stroke") !== "transparent") {
            let router = "";
            if (!_this.isSonReverse(i, id)) {
              router = "(" + id.v + ", " + id.w + ")";
              d3.select(this).style("marker-end", "url(#activeE)"); //Added
            } else {
              router = "(" + id.w + ", " + id.v + ")";
              d3.select(this).style("marker-start", "url(#activeS)"); //Added
            }
            d3.select(this).style("stroke", "#1f77b4");

            let width = d3.select(this).style("stroke-width");
            let dash = d3.select(this).style("stroke-dasharray");
            width.slice(width.length - 2, width.length);
            if (dash.includes("4")) {
              width = "-" + width;
            }
            if (!_this.tip2Show)
              _this.tipVisible(
                router + ": " + (parseFloat(width) / 10).toFixed(2),
                {
                  pageX: d.pageX,
                  pageY: d.pageY,
                }
              );
          }
        })
        .on("mouseout", function (d, id) {
          if (d3.select(this).style("stroke") !== "transparent") {
            d3.select(this).style("stroke", "black");
            if (!_this.isSonReverse(i, id)) {
              d3.select(this).style("marker-end", "url(#normale)"); //Added
            } else {
              d3.select(this).style("marker-start", "url(#normals)"); //Added
            }
          }
          _this.tipHidden();
        })
        .on("click", function (d, id) {
          if (d3.select(this).style("stroke") !== "transparent") {
            let router = "";
            if (!_this.isSonReverse(i, id)) {
              router = "(" + id.v + ", " + id.w + ")";
            } else {
              router = "(" + id.w + ", " + id.v + ")";
            }
            let hintHtml =
              "<div class='operate-header'><div class='hint-list'>" +
              selection.outcome +
              "</div><div class='close-button'>x</div></div><hr/>\
              <div class='operate-menu'>Delete edge<br/>" +
              router +
              "</div><hr/><div class='operate-menu'>Reverse Direction</div>";
            _this.tip2Visible(hintHtml, { pageX: d.pageX, pageY: d.pageY });
            setTimeout(() => {
              document.addEventListener("click", _this.listener3);
            }, 0);
          }
        });
    },
    setGraph() {
      if (this.tooltip) {
        this.tipHidden();
      }
      if (this.tooltip2) {
        this.tip2Hidden();
      }
      this.tooltip = this.createTooltip();
      this.tooltip2 = this.createTooltip();

      if (this.sonNum > 1) {
        this.drawSonGraphs();
      }
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
    drawSonGraph(i) {
      let height = 1200;
      if (this.sonNum > 6) {
        height = height / 3;
      } else if (this.sonNum > 3) {
        height = height / 2;
      }
      let width = 1500;
      if (this.sonNum > 3) {
        width = width / 3;
      } else if (this.sonNum > 0) {
        width = width / this.sonNum;
      }
      let size = {
        scale: this.sonNum > 0 ? 1.8 / 3 : 1,
        width: width,
        height: height,
      };
      let selection = this.multipleSearchValue.selections[i];
      let svg = d3.select(".paper" + (i + 1)).select("svg");
      let finalPos = JSON.parse(localStorage.getItem("SON_POS"));
      singleGraph.setSingleGraph(
        svg,
        {
          linksList: this.multipleSearchValue.linksList,
          nodesList: this.multipleSearchValue.nodesList,
        },
        selection,
        size,
        this.transform[i],
        finalPos[i+1].nodesList
      );

      //Set up zoom support
      let that = this;
      let inner = svg.select("g");
      var zoom = d3.zoom().on("zoom", function (event) {
        that.transform[i] = event.transform;
        inner.attr("transform", event.transform);
        that.tipHidden();
        that.tip2Hidden();
      });
      svg.call(zoom);

      this.setSonGraph(i);
    },
    drawSonGraphs() {
      this.transform = [];
      for (let i = 0; i < this.sonNum; i++) {
        this.transform.push(null);
        this.drawSonGraph(i);
      }
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
    //delete edge from son graph
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
      console.log(index);
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
        this.drawSonGraph(i);
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
      console.log(selection.linksList[index]);
      if (index > -1) {
        historyManage.reverseEdge(selection.history, {
          source: nodes[0],
          target: nodes[1],
        });
        if (!selection.linksList[index].reverse) {
          selection.linksList[index]["reverse"] = true;
        } else {
          selection.linksList[index].reverse = false;
        }
        this.tip2Hidden();
        this.saveData();
        this.drawSonGraph(i);
      }
    },
    isSonReverse(i, edge) {
      let index = this.multipleSearchValue.selections[i].linksList.findIndex(
        function (row) {
          if (row.source === edge.v && row.target === edge.w && !row.hidden) {
            return true;
          } else return false;
        }
      );
      if (index < 0) return false;
      return (
        this.multipleSearchValue.selections[i].linksList[index].reverse === true
      );
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
    //display delete-menu tooltip
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
      this.drawGraph();
    }
  },
};
</script>
  
 <style scoped>
.sub-graph {
  display: flex;
  flex-direction: column;
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

.graph-svg {
  width: 100%;
  display: flex;
  height: 90%;
}
.group-graphs {
  width: 100%;
  display: flex;
  height: 100%;
}

.son-svg {
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
}
.paper-svg {
  padding: 1.5%;
  flex: 1 1/3;
  min-width: 30%;
}
.son-svg div svg {
  width: 100%;
  height: 90%;
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
 