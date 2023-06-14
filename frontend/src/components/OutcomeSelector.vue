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
    <!-- <table border="1">
        <tr>
          <td>Outcome</td>
          <td>CovariantNum</td>
          <td>Variables</td>
        </tr>
        <tr>
          <td>{{ Variables_result.outcome }}</td>
          <td>{{ Variables_result.CovariantNum }}</td>
          <td>{{ Variables_result.top_factors_list }}</td>
        </tr>
      </table> -->
    <div class="outcome-main-title">· VariablesCheckbox</div>
    <div class="outcome-subtitle">(Meant to Adding or Deleting Nodes)</div>
    <p style="color: red; font-size: 20px">
      Todo:To achieve getting variables from VariablesCheckbox
    </p>
    <el-checkbox
      :indeterminate="isIndeterminate"
      v-model="checkAll"
      @change="handleCheckAllChange"
      >Select All</el-checkbox
    >
    <div style="margin: 15px 0"></div>
    <el-checkbox-group
      v-model="checkedVariables"
      @change="handleCheckedVariablesChange"
    >
      <el-checkbox
        v-for="Variable in Variables"
        :label="Variable"
        :key="Variable"
        >{{ Variable }}</el-checkbox
      >
    </el-checkbox-group>
    <br />
    <button>
      Save and Show Variables Characters in the AppMainCharacter component
    </button>
    <br />
    <button @click="AppMsg()">Transmit data to history component</button>
    <br />
  </div>
</template>

<script>
// 引入axios
import axios from "axios";
import VueAxios from "vue-axios";
import bus from "../componentsInteraction/bus.js";
import { Loading } from "element-ui";

const VariablesOptions = [
  "frailty_base_tri",
  "age_group_decade",
  "a1_sex",
  "residenc_byte",
  "education_tri",
  "smoke",
  "drink",
  "sleep",
  "sport",
  "hear",
  "visual",
  "g511_sbp",
  "g521_dbp",
  "g71_hr",
  "BMI_cate",
  "MMSE_base_byte",
  "physi_limit_base",
  "multimorbidity_base",
  "b11_byte",
  "b121_byte",
  "income",
  "f64_sum",
  "a51_byte",
  "f31_sum",
  "f5_whocaresick",
  "dependence_base",
  "g15a1_HT",
  "g15b1_DM",
  "g15c1_CVD",
  "g15e1_COPD",
  "g15n1_RA",
  "g15o1_dementia",
  "g15k1_gastric",
  "g15v1_hepatitis",
  "eye_base",
  "g15i1_cancer",
  "g15l1_parkinson",
  "g15j1_prostate",
  "g15p1_mental",
  "g15r1_others",
];
export default {
  name: "OutcomeSelector",
  data() {
    return {
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
      value: "",
      loadingInstance: null,
      // 注意：v-model需要在data内声明，才能this获取
      CovariantNum: "",
      SelectedVariables: [],
      Variables_result: {},
      checkAll: false,
      checkedVariables: ["frailty_base_tri", "age_group_decade"],
      Variables: VariablesOptions,
      isIndeterminate: true,
    };
  },
  methods: {
    getOutcomeCovariant() {
      // var outcome = getElementById("outcomeSelector").value
      // alert(value)
      var outcome = this.value;
      if(!outcome) {
        this.showErrorMsg("Please choose outcome!")
        return;
      } 
      var CovariantNum = this.CovariantNum;
      if(!CovariantNum) {
        this.showErrorMsg("Please enter the number of variables!")
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
          this.loadingInstance.close();
          this.loadingInstance = null;
          var Variables_result = response.data;
          this.Variables_result = Variables_result;
          this.SelectedVariables = Variables_result.top_factors_list;
          console.log("Variables_result:", Variables_result);
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
          type: 'error'
        });
    },
    showLoading() {
      const options = {
        target: document.getElementsByClassName("loading-box")[0],
        background: "transparent",
        customClass: 'loading-anime'
      };
      this.loadingInstance = Loading.service(options);
    },
    AppMsg() {
      bus.$emit("getOnBus", this.Variables_result);
    },
    handleCheckAllChange(val) {
      this.checkedVariables = val ? VariablesOptions : [];
      this.isIndeterminate = false;
    },
    handleCheckedVariablesChange(value) {
      let checkedCount = value.length;
      this.checkAll = checkedCount === this.Variables.length;
      this.isIndeterminate =
        checkedCount > 0 && checkedCount < this.Variables.length;
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
  position: relative!important;
  height: 80px;
}
</style>
<style scoped>
.OutcomeSelector {
  padding: 10px;
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
  height: auto

}
.show-variable-button {
  margin-left: 50px;
  height: 36px;
  display: flex;
}

</style>