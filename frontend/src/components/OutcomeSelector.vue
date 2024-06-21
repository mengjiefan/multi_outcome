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
      <el-button
        :disabled="loadingInstance !== null"
        size="small"
        class="show-variable-button"
        type="primary"
        @click="getAllCorrelation()"
      >
        Calculate
      </el-button>
    </div>
    <div class="outcome-main-title">· Variables</div>
    <!--original h6-->
    <div class="outcome-subtitle">
      Choose n variables most relevant to the outcome:
    </div>

    <!-- 通过v-model双向绑定，完成input框值获取。 -->
    <div class="number-input-line">
      <div>The top</div>
      <div class="outcome-number-input">
        <el-input
          :onkeyup="(covariantNum = covariantNum.replace(/[^\d]/g, ''))"
          type="text"
          v-model="covariantNum"
        />
      </div>
      <div>variables</div>
      <el-button
        :disabled="loadingInstance !== null"
        size="small"
        class="get-list-button"
        type="primary"
        @click="getTopCovariant()"
      >
        Confirm
      </el-button>
    </div>
    <div v-if="corrValues" class="correlation-chart">
      Correlation Value
      <div class="variable-chart"></div>
    </div>
    <div class="loading-box"></div>
    <ul class="variables">
      <li v-for="(item, index) in selectedVariables" :key="index">
        {{ index + 1 }}-{{ item }}
      </li>
    </ul>
    <div class="outcome-main-title">· Algorithms</div>
    <!--original h6-->
    <div class="outcome-subtitle">Select causal discovery methods :</div>
    <div class="drawing-command">
      <el-select
        v-model="algorithmSelected"
        placeholder="Please select at least one algorithm."
        multiple
      >
        <el-option
          v-for="item in algorithmOptions"
          :key="item"
          :label="item"
          :value="item"
        >
        </el-option>
      </el-select>

      <el-button
        size="small"
        type="primary"
        @click="saveSingleData"
        :disabled="!selectedVariables"
        >Plot the graph</el-button
      >
    </div>
    <div class="hint">* The first selection will be the skeleton.</div>
    <br />
  </div>
</template>

<script>
// 引入axios
import axios from "axios";
import { Loading } from "element-ui";
import { defaultResults, clhlsResults, ukbResults } from "@/plugin/variable";
import { ref } from "vue";
import { creatAllChart } from "@/plugin/charts";

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
      corrValues: ref(),
      nowType: ref(datasetType),
      covariantNum: ref(""),
      value: ref(""),
      selectedVariables: ref([]),
      defaultResults,
      clhlsResults,
      ukbResults,
      options: ref(options),
      algorithmOptions: ["PC", "DAG-GNN", "HCM"],
      algorithmSelected: ref(["PC"]),
    };
  },
  data() {
    return {
      loadingInstance: ref(null),
      allChart: ref(),
    };
  },
  methods: {
    reselect() {
      console.log("reselect");
      this.corrValues = null;
      this.selectedVariables = [];
      this.covariantNum = "";
    },
    async getAllCorrelation() {
      var outcome = this.value;
      this.corrValues = null;
      if (!outcome) {
        this.showErrorMsg("Please choose outcome!");
        return;
      }
      this.showLoading();
      const _this = this;
      try {
        let response = await axios({
          method: "GET",
          url: "http://localhost:8000/api/get_correlation",
          params: {
            dataset: this.nowType,
            outcome: outcome,
          },
        });
        console.log("variable list", response.data);

        //hide loading anime
        this.loadingInstance.close();
        this.loadingInstance = null;
        //include node & links & list
        this.corrValues = response.data;

        let allValues = [];
        for (let i = 0; i < this.corrValues.variable.length; i++) {
          allValues.push({
            axis: this.corrValues.variable[i],
            value: this.corrValues.outcome[i],
          });
        }
        allValues.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
        this.allChart = {
          axis: allValues.map((item) => item.axis),
          value: allValues.map((item) => item.value),
        };
        setTimeout(() => {
          _this.createChart();
        }, 0);

        return;
      } catch (error) {
        console.log("请求失败了", error);
      }
    },
    async getTopCovariant() {
      if (!this.covariantNum) {
        this.showErrorMsg("Please enter the number of variables!");
        return;
      }
      if (!this.value) {
        this.showErrorMsg("Please choose outcome!");
        return;
      }
      if (!this.corrValues) await this.getAllCorrelation();

      this.selectedVariables = [];
      for (let i = 0; i < this.covariantNum; i++) {
        this.selectedVariables.push(this.allChart.axis[i]);
      }
    },
    //全变量相关性排序
    createChart() {
      let charts = document.getElementsByClassName("variable-chart");
      creatAllChart(charts[0], this.allChart);
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
      if (!this.selectedVariables?.length) {
        this.showErrorMsg("Please confirm the variables first!");
        return;
      } else if (!this.algorithmSelected?.length) {
        this.showErrorMsg("Please select the methods first!");
        return;
      }
      let variables = this.selectedVariables.map((node) => ({
        type: 1,
        id: node,
      }));
      let nodes = [
        {
          type: 0,
          id: this.value,
        },
      ];
      localStorage.setItem(
        "GET_JSON_RESULT",
        JSON.stringify({
          nodesList: nodes.concat(variables),
          algorithm: this.algorithmSelected,
          history: [],
        })
      );
      this.routeToGraph();
    },
    routeToGraph() {
      this.$router.push({
        path: "/redirect",
        query: { next: "DirectedGraphView" },
      });
    },
    getTag(dataset) {
      this.value = null;
      this.reselect();
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
            path: "/redirect",
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
.OutcomeSelector .el-input {
  font-size: 18px !important;
}
.OutcomeSelector .el-select-dropdown__item {
  font-size: 16px !important;
}
.outcome-input .el-select {
  width: 280px;
  font-size: 18px;
}
.OutcomeSelector .el-button {
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
  font-size: 14px;
  font-style: italic;
  margin-bottom: 10px;
}
.hint {
  font-size: 12px;
  line-height: 20px;
}

.outcome-input {
  width: 100%;
  font-size: 18px;
  display: flex;
  gap: 16px;
}
.number-input-line {
  display: flex;
  height: 40px;
  align-items: center;
  font-size: 18px;
  padding-bottom: 16px;
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
.correlation-chart {
  font-weight: bold;
}
.variable-chart {
  height: 300px;
  width: 100%;
}
.show-variable-button {
  height: 36px;
  display: flex;
}
.get-list-button {
  height: 36px;
  display: flex;
  margin-left: 16px;
}
.drawing-command {
  display: flex;
  gap: 16px;
}
</style>
<style>
.el-tag:first-of-type.el-tag--info {
  background-color: #fa95a6;
  color: white;
}
.el-tag:first-of-type.el-tag--info .el-tag__close {
  color: #fa95a6;
}
.el-select .el-tag__close:first-of-type.el-icon-close {
  background-color: white;
}
</style>
