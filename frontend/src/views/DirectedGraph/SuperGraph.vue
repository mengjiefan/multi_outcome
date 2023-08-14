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
    <div class="sum-svg">
      <svg v-if="simplePos">
        <g />
      </svg>
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
import * as dagreD3 from "dagre-d3";
import axios from "axios";
import { ref } from "vue";
import { Loading } from "element-ui";
import dagre from "dagre-d3/lib/dagre";
import { createChart } from "@/plugin/charts";
import singleGraph from "@/plugin/singleGraph";
import historyManage from "@/plugin/history";
import { countPos, countSimplePos } from "@/plugin/tightened/CountPos";

export default {
  name: "DirectedGraph",
  setup() {
    return {};
  },
  data() {
    return {
      simplePos: ref(),
      ifGroup: ref(false),
      loadingInstance: ref(null),
      countingGraph: ref(false),
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
          });
        } else if (link.source !== all[index].source && !link.reverse) {
          historyManage.reverseEdge(son.history, link);
        }
      }
      son.linksList = linksList;
      return son;
    },
    setGraph() {
      var data = this.multipleSearchValue;
      var states = data.nodesList;
      d3.select("svg").select("g").selectAll("*").remove();
      // {
      let g = new dagreD3.graphlib.Graph({ compound: true }).setGraph({
        ranker: "tight-tree",
      });

      states.forEach(function (state) {
        let node = {
          label: "",
          type: state.type,
        };
        if (node.type === 0) node["index"] = state.index;
        g.setNode(state.id, node);
      });
      /*
      if (this.ifGroup) {
        console.log("!");
        g.setNode("group", {
          label: "",
          clusterLabelPos: "bottom",
          style:
            "stroke-width:5;stroke:red;fill: transparent;stroke-dasharray:4 4",
        });
        states.forEach(function (state) {
          if (state.type === -1) {
            g.setParent(state.id, "group");
          }
        });
      }*/
      var edges = data.linksList;
      let that = this;
      edges.forEach(function (edge) {
        let edgeValue = edge.value > 0 ? edge.value * 10 : -edge.value * 10;
        var valString = edgeValue.toString() + "px";
        var widthStr = "stroke-width: " + valString;
        var edgeColor = "stroke: black";
        let completeStyle =
          edgeColor + ";" + widthStr + ";" + "fill: transparent;";
        let direction = "";
        if (edge.hidden) {
          g.setEdge(edge.source, edge.target, {
            style:
              "stroke: transparent; fill: transparent; opacity: 0;stroke-width:0",
            curve: d3.curveBasis,
          });
        } else {
          if (edge.reverse) {
            direction = that.checkDirection(edge.target, edge.source);
            completeStyle = completeStyle + "marker-start:url(#normals);";
          } else {
            direction = that.checkDirection(edge.source, edge.target);
            completeStyle = completeStyle + "marker-end:url(#normale);";
          }
          if (edge.value < 0) {
            completeStyle = completeStyle + "stroke-dasharray:4 4";
          }
          if (direction === "DOWN") {
            g.setEdge(edge.source, edge.target, {
              style: completeStyle,
              arrowhead: "undirected",
            });
          } else {
            g.setEdge(edge.source, edge.target, {
              style: completeStyle,
              curve: d3.curveBasis,
              arrowhead: "undirected",
            });
          }
        }
      });

      // Set some general styles
      g.nodes().forEach(function (v) {
        var node = g.node(v);
        node.rx = node.ry = 20;
        let indexes = that.getNodeIndex(v);

        if (indexes.length === 1) node.style = "fill:" + that.cmap[indexes[0]];
        else if (that.simplePos)
          node.style = "fill:url(#" + v.replaceAll("_", "") + ")";
      });
      dagre.layout(g);

      //save positon and redraw, which need to know the direction of edges
      let finalPos = countPos(g, this.multipleSearchValue.selections);
      localStorage.setItem("SON_POS", JSON.stringify(finalPos));
      if (!that.simplePos) {
        that.simplePos = countSimplePos(g, this.multipleSearchValue.nodesList);
        console.log("simplePos", that.simplePos);
        setTimeout(() => {
          that.setGraph();
        }, 0);
        return;
      }

      var svg = d3.select("svg");
      let inner = svg.select("g");

      if (this.tooltip) {
        this.tipHidden();
      }
      if (this.tooltip2) {
        this.tip2Hidden();
      }
      this.tooltip = this.createTooltip();
      this.tooltip2 = this.createTooltip();
      // Set up zoom support

      var zoom = d3.zoom().on("zoom", function (event) {
        that.transform = event.transform;
        inner.attr("transform", event.transform);
        that.tipHidden();
        that.tip2Hidden();
      });
      svg.call(zoom);

      // Create the renderer
      var render = new dagreD3.render();
      // Run the renderer. This is what draws the final graph.
      render(inner, g);
      //add hover effect & hover hint to nodes
      inner
        .selectAll("g.node")
        .on("mouseover", (v) => {
          //v.fromElement.setAttribute("id", "hover-node");
        })
        .on("mouseout", (v) => {
          v.fromElement.setAttribute("id", "");
        });

      // add hover effect & click hint to lines
      // Center the graph
      if (that.transform) {
        inner.attr("transform", that.transform);
      } else {
        var initialScale = 1;
        let xOffset = (1200 - g.graph().width * initialScale) / 2;
        let yOffset = (850 - g.graph().height * initialScale) / 2;
        svg.call(
          zoom.transform,
          d3.zoomIdentity.translate(xOffset, yOffset).scale(initialScale)
        );

        svg.attr("height", g.graph().height * initialScale + 40);
      }
      g.nodes().forEach(function (v) {
        var node = g.node(v);
        inner
          .append("text")
          .attr("x", node.x - v.length * 2)
          .attr("y", node.y - 20)
          .style("font-weight", 500)
          .style("font-size", 8)
          .style("font-family", "Arial")
          .style("fill", "black")
          .text(v);
      });
      var onmousepath = svg.selectAll(".edgePath");
      var allpathes = onmousepath.select(".path");
      const _this = this;
      singleGraph.addArrowType(svg);
      allpathes
        .on("mouseout", function (d, id) {
          if (d3.select(this).style("stroke") !== "transparent") {
            d3.select(this).style("stroke", "black");
            if (!_this.isReverse(id)) {
              d3.select(this).style("marker-end", "url(#normale)"); //Added
            } else {
              d3.select(this).style("marker-start", "url(#normals)"); //Added
            }
          }
          _this.tipHidden();
        })
        .on("mouseover", function (d, id) {
          if (d3.select(this).style("stroke") !== "transparent") {
            let router = "";
            if (!_this.isReverse(id)) {
              router = "(" + id.v + ", " + id.w + ")";
              d3.select(this).style("marker-end", "url(#activeE)"); //Added
            } else {
              router = "(" + id.w + ", " + id.v + ")";
              d3.select(this).style("marker-start", "url(#activeS)"); //Added
            }
            d3.select(this).style("stroke", "#1f77b4");

            let width = d3.select(this).style("stroke-width");
            let dash = d3.select(this).style("stroke-dasharray");
            console.log(dash);
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
        .on("click", function (d, id) {
          if (d3.select(this).style("stroke") !== "transparent") {
            let router = "";
            if (!_this.isReverse(id)) {
              router = "(" + id.v + ", " + id.w + ")";
            } else {
              router = "(" + id.w + ", " + id.v + ")";
            }
            let hintHtml =
              "<div class='operate-header'><div class='hint-list'>operate</div><div class='close-button'>x</div></div><hr/>\
              <div class='operate-menu'>Delete edge<br/>" +
              router +
              "</div><hr/><div class='operate-menu'>Reverse Direction</div>";
            _this.tip2Visible(hintHtml, { pageX: d.pageX, pageY: d.pageY });
            setTimeout(() => {
              document.addEventListener("click", _this.listener);
            }, 0);
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
    checkDirection(source, target) {
      if (!this.simplePos) return "DOWN";
      let sIndex = this.simplePos.findIndex((node) => {
        if (node.id === source) return true;
        else return false;
      });
      let tIndex = this.simplePos.findIndex((node) => {
        if (node.id === target) return true;
        else return false;
      });
      if (sIndex < 0 || tIndex < 0) return "DOWN";
      if (this.simplePos[sIndex].y <= this.simplePos[tIndex].y) return "DOWN";
      else return "UP";
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
    plotChart(line) {
      let dom = document.getElementsByClassName(line)[0];
      createChart(dom, line);
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
        clickDOM !== "operate-header"
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

    isReverse(edge) {
      let index = this.multipleSearchValue.linksList.findIndex(function (row) {
        if (row.source === edge.v && row.target === edge.w && !row.hidden) {
          return true;
        } else return false;
      });
      if (index < 0) return false;
      return this.multipleSearchValue.linksList[index].reverse === true;
    },

    reverseDirection(edge) {
      let nodes = edge.split("(")[1].split(")")[0].split(", ");
      let index = this.multipleSearchValue.linksList.findIndex(function (row) {
        if (
          (row.source === nodes[0] &&
            row.target === nodes[1] &&
            !row.hidden &&
            !row.reverse) ||
          (row.target === nodes[0] &&
            row.source === nodes[1] &&
            !row.hidden &&
            row.reverse)
        ) {
          return true;
        } else return false;
      });
      if (index > -1) {
        let history = {
          source: nodes[0],
          target: nodes[1],
        };
        if (!this.multipleSearchValue.linksList[index].reverse) {
          this.multipleSearchValue.linksList[index]["reverse"] = true;
          this.hasNoHidden = false;
        } else {
          this.multipleSearchValue.linksList[index].reverse = false;
        }
        //所有子图都改变，都要增加操作历史
        for (let i = 0; i < this.multipleSearchValue.selections.length; i++) {
          let selection = this.multipleSearchValue.selections[i];
          historyManage.reverseEdge(selection.history, history);
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
          if (link.source === history.source && !link.reverse) {
            link["reverse"] = true;
          } else if (link.source === history.target && link.reverse) {
            link.reverse = false;
          }
        }
        this.saveData();
        this.tip2Hidden();
        this.drawGraph();
      }
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
          source: this.multipleSearchValue.linksList[index].source,
          target: this.multipleSearchValue.linksList[index].target,
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
        this.drawGraph();
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
    this.setGradient();
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
  height: 90%;
  padding: 16px;
}

.sum-svg svg {
  width: 100%;
  height: 100%;
}
</style>
<style >
.super-graph .label-container:hover {
  stroke: #ff4365;
  stroke-width: 2.5px;
  display: block;
}
</style>