<template>
  <div class="OutcomeSelector">
    <!--original h5-->
    <div class="outcome-main-title">· Outcome</div>
    <div class="outcome-input">
      <el-select
        v-model="value"
        :disabled="loadingInstance!==null"
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
      :disabled="loadingInstance!==null"
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

      <el-button size="small" type="primary" @click="saveSingleData" :disabled="!Variables_result"
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
import VariablesOptions from "@/plugin/variable";
import { ref } from "vue";

export default {
  name: "OutcomeSelector",
  setup() {
    return {
      CovariantNum: ref(""),
      value: ref(""),
      SelectedVariables: ref([]),
      options: [
        {
          value: "death",
          label: "death",
        },
        {
          value: "follow_dura",
          label: "follow_dura",
        },
        {
          value: "multimorbidity_incid_byte",
          label: "multimorbidity_incid_byte",
        },
        {
          value: "hospital_freq",
          label: "hospital_freq",
        },
        {
          value: "MMSE_MCI_incid",
          label: "MMSE_MCI_incid",
        },
        {
          value: "physi_limit_incid",
          label: "physi_limit_incid",
        },
        {
          value: "dependence_incid",
          label: "dependence_incid",
        },
        {
          value: "b11_incid",
          label: "b11_incid",
        },
        {
          value: "b121_incid",
          label: "b121_incid",
        },
      ],
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
      Variables: VariablesOptions,
    };
  },
  methods: {
    reselect(){
      console.log('reselect');
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
      axios({
        //请求类型
        method: "GET",
        //URL
        url: "http://localhost:8000/api/covariant",
        //参数
        params: {
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
          this.SelectedVariables = this.Variables_result.top_factors_list;
          console.log("Variables_result:", this.Variables_result);
          this.checkedVariables = this.Variables_result.top_factors_list;
        })
        .catch((error) => {
          console.log("请求失败了", error.message);
        });
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
      let nodesList = [];
      if (!this.Variables_result.top_factors_list) {
        this.showErrorMsg("Please confirm first!");
        return;
      }
      nodesList.push({
        type: 0,
        id: this.Variables_result.outcome,
      });
      this.Variables_result.top_factors_list.forEach((row) => {
        nodesList.push({
          type: 1,
          id: row,
        });
      });
      localStorage.setItem(
        "GET_JSON_RESULT",
        JSON.stringify({
          nodesList: nodesList,
          linksList: this.Variables_result.links,
          CovariantNum: this.Variables_result.CovariantNum,
          history: []
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
  },
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
  max-height: 800px;
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