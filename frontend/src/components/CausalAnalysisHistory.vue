<template>
  <div>
    <h5>History of variables and the outcome</h5>
    <div>
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
        <el-table-column
          fixed
          prop="outcome"
          label="Outcome"
          sortable
          width="100"
        />

        <el-table-column
          prop="CovariantNum"
          label="CovariantNum"
          sortable
          width="80"
        />
        <el-table-column
          prop="Variables"
          label="Variables"
          sortable
          show-overflow-tooltip
          :formatter="formatter"
        >
          <template slot-scope="scope">{{
            scope.row.Variables.join()
          }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="Operation" width="120">
          <template slot-scope="scope">
            <el-button
              @click.native.prevent="deleteRow(scope.$index, tableData)"
              type="text"
              size="small"
            >
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>
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
      <el-button type="primary" size="small" @click="btnSelect()"
        >Plot the rows
      </el-button>
    </div>
  </div>
</template>

<script>
// 引入axios
import axios from "axios";
import { ref } from "vue";
import bus from "../componentsInteraction/bus.js";
export default {
  name: "CausalAnalysisHistory",
  data() {
    return {
      value: "",
      OutcomeOptions: [
        "death",
        "follow_dura",
        "multimorbidity_incid_byte",
        "hospital_freq",
        "MMSE_MCI_incid",
        "physi_limit_incid",
        "dependence_incid",
        "b11_incid",
        "b121_incid",
      ],
      CovariantNum: "",
      SelectedVariables: [],
      Variables_result: {},
      tableData: [],
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
      multipleSelection: [],
      selection: [],
      search: "",
      selection_result: {},
      nodesList: [],
      linksList: [],
    };
  },
  watch: {
    $route: {
      handler: function (route) {
        console.log(route);
        if (route.query.mode === "save") {
          this.saveToTable();
        }
      },
      immediate: true,
    },
  },
  computed: {},
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
    toDirectedGraph() {
      this.$router.push({
        path: "/AppMainPlot/redirect",
        query: { next: "DirectedGraphView" },
      });
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
      console.log("选中的比较结局数据为：", selection);
      console.log(typeof selection); //object类型数据
      axios({
        //请求类型
        method: "POST",
        //URL
        url: "http://localhost:8000/api/linksnodes/",
        //当数据量较大时，使用请求body的方式进行传参
        data: {
          selection: selection,
          selection1: "test1",
        },
      }).then(
        (response) => {
          console.log("请求成功了", response.data);
          this.selection_result = response.data;
          this.nodesList = this.selection_result.nodesList;
          this.linksList = this.selection_result.linksList;
          console.log("selection_result:", this.selection_result);
          localStorage.setItem(
            "GET_JSON_RESULT",
            JSON.stringify({
              nodesList: response.data.nodesList.map((row) => {
                if (this.OutcomeOptions.includes(row))
                  return {
                    type: 0,
                    id: row,
                  };
                else
                  return {
                    type: 1,
                    id: row,
                  };
              }),
              linksList: response.data.linksList,
            })
          );
        },
        (error) => {
          console.log("请求失败了", error.message);
        }
      );
      this.routeToGraph();
    },
    routeToGraph() {
      this.$router.push({
        path: "/AppMainPlot/redirect",
        query: { next: this.graphType },
      });
    },
    formatter(row, column) {
      return row.Variables;
    },

    deleteRow(index, rows) {
      rows.splice(index, 1);
    },
    saveToTable() {
      console.log("saveMode");
      let newRow = JSON.parse(localStorage.getItem("GET_JSON_RESULT"));
      const outcomeId = newRow.nodesList[0].id;
      const allnodesList = newRow.nodesList;
      if (newRow) {
        newRow.nodesList.splice(0, 1);
        console.log({
          CovariantNum: newRow.CovariantNum,
          outcome: outcomeId,
          Variables: newRow.nodesList.map((row) => {
            return row.id;
          }),
        });
        this.tableData.push({
          CovariantNum: newRow.CovariantNum,
          outcome: outcomeId,
          Variables: newRow.nodesList.map((row) => {
            return row.id;
          }),
          nodes: allnodesList.map((row) => {
            return row.id;
          }),
          links: newRow.linksList,
        });
      }
      this.$router.push({
        path: this.$route.path,
      });
    },

    //...mapMutations({ GET_JSON_RESULT: "GET_JSON_RESULT" }),
  },
  // 到站接收数据，在接收组件的mounted中接收
  mounted() {
    bus.$on("getOnBus", (val) => {
      this.value = val;
      console.log("接收到的传递的后台数据为：", val);
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

<style scoped>
.list-group-item {
  cursor: pointer;
}
.drawing-command {
  margin-top: 20px;
  display: flex;
  gap: 16px;

  padding-bottom: 20px;
}
</style>