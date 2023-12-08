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
import axios from "axios";
import { ref } from "vue";
import { linksOperation } from "@/plugin/links";
import { countTightenedSonPos } from "@/plugin/tightened/CountPos";
import {
  countExtractedSonPos,
  countExtractedScale,
} from "@/plugin/extracted/CountPos";
import { countOriginalSonPos } from "@/plugin/original/CountPos";
import { countCurveSonPos, countCurveScale } from "@/plugin/curve/CountPos";

export default {
  name: "SonGraph",
  props: {
    graphType: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
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

      let dom = document.getElementById("paper1");
      if (name)
        this.scales = countCurveScale(
          this.sonGraphs,
          dom.clientHeight,
          dom.clientWidth,
          this.sonNum
        );
      else
        this.scales = countExtractedScale(
          this.sonGraphs,
          dom.clientHeight,
          dom.clientWidth,
          this.sonNum
        );
      for (let i = 0; i < this.sonNum; i++) this.drawSonGraph(i);
    },
    getNormalLayout() {
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
    async getCurveLayout(name) {
      let graphs = await countCurveSonPos(this.finalPos, name);
      this.sonGraphs = [];
      graphs.forEach((graph) => {
        this.sonGraphs.push({
          nodesList: graph,
          linksList: [],
        });
      });
    },
    saveData() {
      localStorage.setItem(
        "GET_JSON_RESULT",
        JSON.stringify(this.multipleSearchValue)
      );
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
    init() {
      this.multipleSearchValue = JSON.parse(
        localStorage.getItem("GET_JSON_RESULT")
      );
      console.log(this.graphType);
      console.log(this.graphType.slice(0, this.graphType.indexOf("Sub")));
      if (this.graphType === "TightenedSubGraph")
        this.finalPos = JSON.parse(localStorage.getItem("SON_POS"));
      else this.finalPos = JSON.parse(localStorage.getItem("SIMPLE_POS"));
      if (this.multipleSearchValue) this.drawGraph();
    },
  },
  mounted() {
    this.init();
  },
};
</script>
