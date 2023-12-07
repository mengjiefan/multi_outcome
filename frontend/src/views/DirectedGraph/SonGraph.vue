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
import { ref } from "vue";
import { linksOperation } from "@/plugin/links";
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
      if (this.graphType === "ExtractedSubGraph")
        this.finalPos = JSON.parse(localStorage.getItem("SIMPLE_POS"));
      else if (this.graphType === "TightenedSubGraph")
        this.finalPos = JSON.parse(localStorage.getItem("SON_POS"));
      if (this.multipleSearchValue) this.drawGraph();
    },
  },
  mounted() {
    this.init();
  },
};
</script>
