<template>
  <div class="OutcomeSelector">
    <!--original h5-->
    <div class="outcome-main-title">· Outcome</div>
    <div class="outcome-input">
      <el-select
        v-model="value"
        :disabled="loadingInstance !== null"
        @change="reselect()"
        filterable
        placeholder="Please choose an outcome"
      >
        <el-option
          id="outcomeSelector"
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        >
        </el-option>
      </el-select>
    </div>
    <div class="outcome-main-title">· Variables</div>
    <!--original h6-->
    <div class="outcome-subtitle">
      Choose n Covariant most relevant to the outcome:
    </div>

    <!-- 通过v-model双向绑定，完成input框值获取。 -->
    <div class="number-input-line">
      <div>Show the top</div>
      <div class="outcome-number-input">
        <el-input
          :onkeyup="(CovariantNum = CovariantNum.replace(/[^\d]/g, ''))"
          type="text"
          v-model="CovariantNum"
        />
      </div>
      <div>variables</div>
      <el-button
        :disabled="loadingInstance !== null"
        size="small"
        class="show-variable-button"
        type="primary"
        @click="getOutcomeCovariant()"
      >
        Confirm
      </el-button>
    </div>
    <div class="loading-box"></div>
    <ul class="variables">
      <li v-for="(item, index) in SelectedVariables" :key="index">
        {{ index + 1 }}-{{ item }}
      </li>
    </ul>
    <div v-for="(item, index) in SelectedVariables" :key="index">
      {{ SelectedVariables[index] }}
      <div class="variable-chart"></div>
    </div>
    <div v-if="Variables_result">
      Correlation Value
      <div class="variable-chart"></div>
    </div>
    <div class="drawing-command">
      <el-select v-model="graphType" placeholder="请选择">
        <el-option
          v-for="item in graphOption"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        >
        </el-option>
      </el-select>

      <el-button
        size="small"
        type="primary"
        @click="saveSingleData"
        :disabled="!Variables_result"
        >Plot the list</el-button
      >
    </div>
    <br />
  </div>
</template>

<script>
// 引入axios
import axios from "axios";
import { Loading } from "element-ui";
import { defaultResults, clhlsResults, ukbResults } from "@/plugin/variable";
import { ref } from "vue";
import { createCharts, creatAllChart } from "@/plugin/charts";

export default {
  props: {
    dataset: String,
    required: true,
  },
  name: "OutcomeSelector",
  setup() {
    let options = [];
    let datasetType = localStorage.getItem("DATATYPE");
    if (!datasetType) datasetType = "default";
    switch (datasetType) {
      case "default":
        options = defaultResults;
        break;
      case "clhls":
        options = clhlsResults;
        break;
      case "ukb":
        options = ukbResults;
        break;
      default:
        break;
    }
    options = options.map((result) => {
      return {
        label: result,
        value: result,
      };
    });
    return {
      nowType: ref(datasetType),
      CovariantNum: ref(""),
      value: ref(""),
      SelectedVariables: ref([]),
      defaultResults,
      clhlsResults,
      ukbResults,
      options: ref(options),
      graphOption: [
        {
          value: "DirectedGraphView",
          label: "DirectedGraph",
        },
        {
          label: "CausalGraphView",
          value: "CausalGraphView",
        },
        { label: "MultiOutcomes Matrix", value: "MultiOutcomesView" },
      ],
      graphType: ref("DirectedGraphView"),
    };
  },
  data() {
    return {
      loadingInstance: ref(null),
      Variables_result: ref(),
      allChart: ref(),
    };
  },
  methods: {
    reselect() {
      console.log("reselect");
      this.Variables_result = null;
      this.SelectedVariables = [];
    },
    getOutcomeCovariant() {
      // var outcome = getElementById("outcomeSelector").value
      // alert(value)
      this.SelectedVariables = [];
      this.Variables_result = null;
      var outcome = this.value;
      if (!outcome) {
        this.showErrorMsg("Please choose outcome!");
        return;
      }
      var CovariantNum = this.CovariantNum;
      if (!CovariantNum) {
        this.showErrorMsg("Please enter the number of variables!");
        return;
      }

      this.showLoading();
      const _this = this;
      axios({
        //请求类型
        method: "GET",
        //URL
        url: "http://localhost:8000/api/covariant",
        //参数
        params: {
          dataset: this.nowType,
          outcome: outcome,
          CovariantNum: CovariantNum,
        },
      })
        .then((response) => {
          console.log("variable list", response.data);
          //hide loading anime
          this.loadingInstance.close();
          this.loadingInstance = null;
          //include node & links & list
          this.Variables_result = response.data;
          //only the list
          let nodes = this.Variables_result.nodes.filter(
            (node) => node.type === 1
          );
          let allValues = [];
          for (
            let i = 0;
            i < this.Variables_result.allValue.variable.length;
            i++
          ) {
            allValues.push({
              axis: this.Variables_result.allValue.variable[i],
              value: this.Variables_result.allValue.outcome[i],
            });
          }
          allValues.sort((a, b) => Math.abs(a.value) - Math.abs(b.value));
          this.allChart = {
            axis: allValues.map((item) => item.axis),
            value: allValues.map((item) => item.value),
          };
          this.SelectedVariables = nodes.map((node) => {
            return node.id;
          });
          console.log("Variables_result:", this.Variables_result);

          setTimeout(() => {
            _this.createChart();
          }, 0);
        })
        .catch((error) => {
          console.log("请求失败了", error.message);
        });
    },
    createChart() {
      let charts = document.getElementsByClassName("variable-chart");
      for (let i = 0; i < this.SelectedVariables.length; i++) {
        let dom = charts[i];
        let id = this.SelectedVariables[i];
        createCharts(id, dom, this.Variables_result.nodes[i].range);
      }
      creatAllChart(charts[charts.length - 1], this.allChart);
    },
    showErrorMsg(msg) {
      this.$message({
        showClose: true,
        message: msg,
        type: "error",
      });
    },
    showLoading() {
      const options = {
        target: document.getElementsByClassName("loading-box")[0],
        background: "transparent",
        customClass: "loading-anime",
      };
      this.loadingInstance = Loading.service(options);
    },
    saveSingleData() {
      if (!this.Variables_result.nodes) {
        this.showErrorMsg("Please confirm first!");
        return;
      }
      let linksList = this.Variables_result.links;

      localStorage.setItem(
        "GET_JSON_RESULT",
        JSON.stringify({
          nodesList: this.Variables_result.nodes,
          linksList: linksList,
          CovariantNum: this.Variables_result.CovariantNum,
          history: [],
        })
      );
      this.routeToGraph();
    },
    routeToGraph() {
      this.$router.push({
        path: "/AppMainPlot/redirect",
        query: { next: this.graphType },
      });
    },
    getTag(dataset) {
      this.value = null;
      let options = [];
      switch (dataset) {
        case "default":
          options = this.defaultResults;
          break;
        case "clhls":
          options = this.clhlsResults;
          break;
        case "ukb":
          options = this.ukbResults;
          break;
        default:
          break;
      }
      if (this.nowType !== dataset) {
        this.nowType = dataset;
        this.options = options.map((option) => {
          return {
            value: option,
            label: option,
          };
        });
        localStorage.setItem("GET_JSON_RESULT", ""); //the data of graph
        localStorage.setItem("GET_SAVE_DATA", ""); //the data to be saved
        localStorage.setItem("DATATYPE", dataset);
        if (this.$route.name !== "DirectedGraphView")
          this.$router.push({
            path: "/AppMainPlot/redirect",
            query: { next: "DirectedGraphView" },
          });
      }
    },
  },
  watch: {
    dataset: {
      handler: function (dataset) {
        console.log("dataset changes");
        this.getTag(dataset);
      },
      immediate: true,
    },
  },
  mounted() {},
};
</script>

<style>
.variables {
  max-height: 500px;
  min-height: 148px;
  overflow-y: auto;
  font-size: 0.1;
  color: red;
}
.el-input {
  font-size: 18px !important;
}
.el-select-dropdown__item {
  font-size: 16px !important;
}
.outcome-input .el-select {
  width: 280px;
  font-size: 18px;
}
.el-button {
  font-size: 18px !important;
}
.loading-anime {
  position: relative !important;
  height: 80px;
}
</style>
<style scoped>
.OutcomeSelector {
  padding: 10px;
  height: auto;
}
.outcome-main-title {
  font-size: 20px;
  font-weight: bold;
  line-height: 36px;
}
.outcome-subtitle {
  font-size: 18px;
  font-weight: bold;
  line-height: 32px;
}

.outcome-input {
  width: 280px;
  font-size: 18px;
}
.number-input-line {
  display: flex;
  height: 40px;
  align-items: center;
  font-size: 18px;
}
.outcome-number-input {
  margin-left: 10px;
  margin-right: 10px;
  width: 70px;
  font-size: 18px;
}
.loading-box {
  height: 0;
}
.variable-chart {
  height: 300px;
  width: 100%;
}
.show-variable-button {
  margin-left: 50px;
  height: 36px;
  display: flex;
}
.drawing-command {
  display: flex;
  gap: 16px;
}
</style>