<template>
  <div class="OutcomeSelector">
    <h5>Outcome</h5>
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
    <h6>Choose n Covariant most relevant to the outcome:</h6>
    <input
      type="text"
      placeholder="number of Covariant"
      v-model="CovariantNum"
    />
    <!-- 通过v-model双向绑定，完成input框值获取。 -->
    <br />
    <button @click="getOutcomeCovariant()">
      Show the top {{ CovariantNum }} variables
    </button>
    <br />
    <ul class="variables">
      <li v-for="(item, index) in SelectedVariables" :key="index">
        {{ index + 1}}-{{ item }}
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
    <button @click="AppMsg()">Transmit data to history component</button>
    <br />
    <router-link
      class="list-group-item"
      active-class="active"
      to="/AppMainPlot/DirectedGraphView"
      >Get DirectedGraph (dynamic)</router-link
    >
    <hr />  
  </div>
</template>

<script>
// 引入axios
import axios from "axios";
import VueAxios from "vue-axios";
import bus from '../componentsInteraction/bus.js';
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
      // 注意：v-model需要在data内声明，才能this获取
      CovariantNum: "",
      SelectedVariables: [],
      Variables_result: {},
    };
  },
  methods: {
    getOutcomeCovariant() {
      // var outcome = getElementById("outcomeSelector").value
      // alert(value)
      var outcome = this.value;
      // alert(outcome)
      // window.console.log(this.value)
      var CovariantNum = this.CovariantNum;
      // alert(CovariantNum)
      // window.console.log(this.CovariantNum)

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
          console.log("请求成功了", response.data); 
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
    AppMsg(){
        bus.$emit('getOnBus',this.Variables_result)
    } 
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
</style>