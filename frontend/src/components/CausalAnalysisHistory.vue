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
        <el-table-column prop="Outcome" label="Outcome" sortable width="100">
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
          <template slot-scope="scope">{{ scope.row.top_factors_list }}</template>
        </el-table-column>
        <el-table-column align="right" label="操作">
          <template slot="header">
            <el-input
              v-model="search"
              size="mini"
              placeholder="输入关键字搜索"
            />
          </template>
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
      <el-button @click="toggleSelection([tableData[1], tableData[2]])"
        >切换第二、第三行的选中状态</el-button
      >
      <el-button @click="toggleSelection()">取消选择</el-button> <br />
      <!-- <el-button @click="GetHypergraph()">Get Hypergraph</el-button> -->
    </div>
    <div style="margin-top: 20px">
      <el-button @click="btnGetSelection()">获取选中项并对比</el-button>
    </div>
    <br />
    <router-link
      class="list-group-item"
      active-class="active"
      to="/AppMainPlot/MultiOutcomesView"
      >Get MultiOutcomes matrix (static)</router-link
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
import bus from "../componentsInteraction/bus.js";
export default {
  name: "CausalAnalysisHistory",
  data() {
    return {
      value: "",
      CovariantNum: "",
      SelectedVariables: [],
      Variables_result: {},
      tableData:[],
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
      search: "",
    };
  },
 
  methods: {
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
    btnGetSelection() {
      let selection = this.$refs.multipleTable.selection;
      console.log(selection);
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
    // GetHypergraph() {},
    // getOutcomeCovariant() {},
  },
  // 到站接收数据，在接收组件的mounted中接收
  mounted() {
    bus.$on("getOnBus", (val) => {
      this.value = val;
      // console.log("传递的数据为：" + val)
      // this.tableData = []
      //重新生成需要的对象数组
      this.tableData.push(val)
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