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
          <div :id="'paper' + index"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import * as d3 from "d3";
import { ref } from "vue";
import { Loading } from "element-ui";
import dagre from "dagre-d3/lib/dagre";
import { createChart } from "@/plugin/charts";
import { drawSonCharts } from "@/plugin/sonGraph";
import { countSonPos } from "@/plugin/tightened/CountPos";

export default {
  data() {
    return {
      finalPos: ref(),
      ifGroup: ref(false),
      loadingInstance: ref(null),
      countingGraph: ref(false),
      tooltip: null,
      tooltip2: null,
      menuShow: ref(false),
      sonNum: ref(0),
      tip2Show: ref(false),
      transform: ref([]),
      multipleSearchValue: ref({
        nodesList: [],
        linksList: [],
      }),
    };
  },
  methods: {
    drawGraph() {
      this.ifGroup = false;
      let that = this;
      this.sonNum = 0;
      this.multipleSearchValue.nodesList.forEach(function (state) {
        if (state.type === -1) that.ifGroup = true;
        else if (state.type === 0) that.sonNum++;
      });
      setTimeout(() => {
        this.drawSonGraphs();
      }, 0);
    },
    drawSonGraphs() {
      let sonGraphs = [];
      let gap = {
        xGap: 100,
        yGap: 100,
      };
      for (let i = 1; i <= this.sonNum; i++) {
        let ans = countSonPos(
          this.finalPos[i].nodesList,
          this.finalPos[0].nodesList
        );
        sonGraphs.push(ans.sonPos);
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

      for (let i = 1; i <= this.sonNum; i++) {
        let dom = document.getElementById("paper" + i);
        drawSonCharts(
          dom,
          sonGraphs[i - 1],
          this.multipleSearchValue.selections[i-1].linksList,
          gap,
          "paper" + i
        );
      }
    },
  },
  mounted() {
    this.multipleSearchValue = JSON.parse(
      localStorage.getItem("GET_JSON_RESULT")
    );
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
  height: 90%;
}

.son-svg {
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-left: 16px;
  padding-right: 16px;
}
.paper-svg {
  flex: 1;
  min-width: 25%;
  max-width: 100%;
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
 