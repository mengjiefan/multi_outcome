<template>
  <div>
    <h5>History of top most relevant variables to the outcome</h5>
    <div>
      <!-- <table border="1">
        <tr>
          <td>Outcome</td>
          <td>CovariantNum</td>
          <td>Variables</td>
        </tr>
        <tr>
          <td>{{ value.outcome }}</td>
          <td>{{ value.CovariantNum }}</td>
          <td>{{ value.top_factors_list }}</td>
        </tr>
      </table> -->
      <el-table
        ref="multipleTable"
        :data="tableData"
        height="300"
        tooltip-effect="dark"
        style="width: 100%"
        :default-sort="{ prop: 'Outcome', order: 'descending' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"> </el-table-column>
        //实现多选非常简单:
        //手动添加一个el-table-column，设type属性为selection即可；
        <!-- 在列中设置sortable属性即可实现以该列为基准的排序，接受一个Boolean，默认为false。 -->
        <el-table-column
          fixed
          prop="Outcome"
          label="Outcome"
          sortable
          width="100"
        >
          <template slot-scope="scope">{{ scope.row.outcome }}</template>
          <!-- <template slot-scope="scope">{{ scope.row.value.outcome }}</template> -->
        </el-table-column>
        <el-table-column
          prop="CovariantNum"
          label="CovariantNum"
          sortable
          width="80"
        >
          <template slot-scope="scope">{{ scope.row.CovariantNum }}</template>
          <!-- <template slot-scope="scope">{{ scope.row.value.outcome }}</template> -->
        </el-table-column>
        <!-- 默认情况下若内容过多会折行显示，若需要单行显示可以使用show-overflow-tooltip属性，它接受一个Boolean，为true时多余的内容会在 hover 时以 tooltip 的形式显示出来。 -->
        <!-- formatter属性，它用于格式化指定列的值，接受一个Function，会传入两个参数：row和column，可以根据自己的需求进行处理。 -->
        <el-table-column
          prop="Variables"
          label="Variables"
          sortable
          show-overflow-tooltip
          :formatter="formatter"
        >
          <template slot-scope="scope">{{
            scope.row.top_factors_list
          }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="Operation" width="120">
          <template slot-scope="scope">
            <el-button
              @click.native.prevent="deleteRow(scope.$index, tableData)"
              type="text"
              size="small"
            >
              delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div style="margin-top: 20px">
      <el-button @click="btnSelect()">Get the selected item and compare them</el-button>
    </div>
    <!-- other button options -->
    <!-- <div style="margin-top: 20px">
      <el-button @click="toggleSelection([tableData[1], tableData[2]])"
        >切换第二、第三行的选中状态</el-button
      >
      <el-button @click="toggleSelection()">取消选择</el-button> <br />
      <el-button @click="GetHypergraph()">Get Hypergraph</el-button>
    </div> -->
    <br />
    <!-- Several router components to show in the AppMainPlot component-->
    <h6>Several router components to show after getting the selected item in the AppMainPlot component</h6>
    <p style="color:blue;font-size:15px;">We now only use the DirectedGraph router component</p>
    <br />
    <router-link
      class="list-group-item"
      active-class="active"
      to="/AppMainPlot/DirectedGraphView"
      >Get DirectedGraph (dynamic)</router-link
    >
    <br />
    <br />
    <router-link
        class="list-group-item"
        active-class="active"
        to="/AppMainPlot/CausalGraphView">
      Get CausalGraph (Not used component now)
    </router-link>
     <!-- 缓存一个路由组件 -->
    <br />
    <br />
    <router-link
      class="list-group-item"
      active-class="active"
      to="/AppMainPlot/MultiOutcomesView"
      >Get MultiOutcomes matrix (Not used component now)</router-link
    >
  </div>
</template>

<script>
/*
tableData_test: [
        {
          Outcome: "death",
          CovariantNum: "5",
          Variables: [
            "frailty_base_tri",
            "MMSE_base_byte",
            "hear",
            "physi_limit_base",
            "education_tri",
          ],
        },
        {
          Outcome: "hospital_freq",
          CovariantNum: "5",
          Variables: [
            "multimorbidity_base",
            "g15c1_CVD",
            "hear",
            "sleep",
            "MMSE_base_byte",
          ],
        },
        {
          Outcome: "physi_limit_incid",
          CovariantNum: "5",
          Variables: [
            "physi_limit_base",
            "frailty_base_tri",
            "dependence_base",
            "MMSE_base_byte",
            "hear",
          ],
        },
      ]
*/
// 引入axios
import axios from "axios";
import VueAxios from "vue-axios";
import bus from "../componentsInteraction/bus.js";
import {mapState,mapGetters,mapMutations,mapActions} from 'vuex'
export default {
  name: "CausalAnalysisHistory",
  data() {
    return {
      value: "",
      CovariantNum: "",
      SelectedVariables: [],
      Variables_result: {},
      tableData: [],
      // tableData:[
      //   {
      //     // Outcome: "", //value.outcome
      //     // CovariantNum: "", //value.CovariantNum,
      //     // Variables: "", // value.top_factors_list,
      //     // value:{}
      //   },
      // ],
      // 在tableData赋值的地方，顺便随机设置下key，页面就会刷新了
      // this.itemKey = Math.random()
      multipleSelection: [],
      selection : [],
      search: "",
      selection_result : {},
      nodesList : [],
      linksList : []
    };
  },
  computed:{

  },
  methods: {
    // 实现表格数据去重（定义unique函数）
    unique(arr) {
        if (!Array.isArray(arr)) {
          console.log("type error!");
          return;
        }
        arr = arr.sort();
        var array = [arr[0]];
        for (var i = 1; i < arr.length; i++) {
          if (arr[i] !== arr[i - 1]) {
            array.push(arr[i]);
          }
        }
        return array;
      },
    toggleSelection(rows) {
      if (rows) {
        rows.forEach((row) => {
          this.$refs.multipleTable.toggleRowSelection(row);
        });
      } else {
        this.$refs.multipleTable.clearSelection();
      }
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    handleSelectionChange(selection) {
      console.log(selection);
    },
    
    // 通过公用数据库store进行数据管理
    btnSelect() {
      let selection = this.$refs.multipleTable.selection;
      console.log('选中的比较结局数据为：',selection);
      console.log(typeof selection);  //object类型数据
      // console.log(JSON.stringify(selection));
      // bus.$emit('getOnBusLinksNodes',this.selection)
      axios({
        //请求类型
        method: "POST",
        //URL
        url: "http://localhost:8000/api/linksnodes/",
        //当数据量较大时，使用请求body的方式进行传参
        data:{
          selection: selection,
          selection1:"test1"
        },
        //参数
        // params: {
        //   selection: selection,
        //   selection1:"test1"
          
        // },
      }).then(
        (response) => {
          console.log("请求成功了", response.data); 
          var selection_result = response.data;
          this.selection_result = selection_result;
          this.nodesList = selection_result.nodesList;
          this.linksList = selection_result.linksList;
          // console.log("nodesList:", nodesList);
          // console.log("linksList:", linksList);
          console.log("selection_result:", selection_result);
          this.$store.commit('GET_JSON_RESULT',selection_result)
        },
        (error) => {
          console.log("请求失败了", error.message);
        }
      );
      // this.$store.commit('GET_JSON_RESULT',selection)
      // this.$store.commit('GET_JSON_RESULT',selection_result)
    },
  
    formatter(row, column) {
      return row.Variables;
    },
    // handleEdit(index, row) {
    //   console.log(index, row);
    // },

    deleteRow(index, rows) {
      rows.splice(index, 1);
    },
    GetHypergraph() {},
    getOutcomeCovariant() {},

    ...mapMutations({GET_JSON_RESULT:'GET_JSON_RESULT'})
  },
  // 到站接收数据，在接收组件的mounted中接收
  mounted() {
    bus.$on("getOnBus", (val) => {
      this.value = val;
      console.log("接收到的传递的后台数据为：" + val)
      //重新生成需要的对象数组
      this.tableData.push(val);
      // 实现表格数据去重（定义unique函数）
      function unique(arr) {
        if (!Array.isArray(arr)) {
          console.log("type error!");
          return;
        }
        arr = arr.sort();
        var array = [arr[0]];
        for (var i = 1; i < arr.length; i++) {
          if (arr[i] !== arr[i - 1]) {
            array.push(arr[i]);
          }
        }
        return array;
      }
      this.tableData = unique(this.tableData);
    });
  },
};
</script>

<style>
/* .demo{
		background-color: orange;
	} */
</style>