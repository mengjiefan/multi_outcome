<template>
  <div class="OutcomeSelector">
    <!--original h5-->
    <div class="outcome-main-title">· Outcome</div>
    <div class="outcome-input">
      <el-select
        v-model="value"
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
    <!--<el-button @click="AppMsg()">Save to Table</el-button>-->
    <el-button @click="saveSingleData">Get the list</el-button>
    <br />
  </div>
</template>

<script>
// 引入axios
import axios from "axios";
import VueAxios from "vue-axios";
import bus from "../componentsInteraction/bus.js";
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
    };
  },
  data() {
    return {
      loadingInstance: null,
      Variables_result: {},
      Variables: VariablesOptions,
    };
  },
  methods: {
    getOutcomeCovariant() {
      // var outcome = getElementById("outcomeSelector").value
      // alert(value)
      this.SelectedVariables = [];
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

      // 目前axios仅能请求成功，但无法获取py文件的结果
      // 1. axios方式一
      //axios
      //   .get("http://localhost:8000/#/api/covariant", {
      //     params: {
      //       outcome: outcome,
      //       CovariantNum: CovariantNum,
      //     },
      //   })
      //   .then(
      //     (response) => {
      //       console.log("请求成功了", response);  //response.data返回的是html的文字信息
      //     },
      //     (error) => {
      //       console.log("请求失败了", error.message);
      //     }
      //   );
      // 2. axios方式二
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
      }).then(
        (response) => {
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
        },
        (error) => {
          console.log("请求失败了", error.message);
        }
      );
      // }).then(function (ret) {
      //     console.log(ret)
      // });

      //     axios.get('http://localhost:8080/factor_selector_pc_dag.py', {
      //       params: {
      //           outcome: '',
      //           CovariantNum: ''
      //         }
      // }).then(response => {
      //     console.log('请求成功了',response.data)
      //     },
      //     error => {
      //       console.log("请求失败了",error.message)
      //     }
      //    );
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
    AppMsg() {
      // only the top node & links & list
      bus.$emit("getOnBus", this.Variables_result);
    },
    saveSingleData() {
      let nodesList = [];

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
        })
      );
    },
  },
  // 只是监视了，但尚未实现实时组件间数据传输
  // watch: {
  //   Variables_result:{
  //     handler(newValue,oldValue){
  //       console.log('Variables_result被修改了',newValue,oldValue)
  //     }
  //   }
  // },
};
</script>

<style>
.variables {
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
  height: auto;
}
.show-variable-button {
  margin-left: 50px;
  height: 36px;
  display: flex;
}
</style>