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
import { node } from "dagre-d3/lib/intersect/index.js";
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
          this.routeToGraph();
        },
        (error) => {
          console.log("请求失败了", error.message);
        }
      );
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
      const newRow = JSON.parse(localStorage.getItem("GET_JSON_RESULT"));
      this.getDifferentRows(newRow.nodesList, newRow.linksList);
      this.$router.push({
        path: this.$route.path,
      });
    },
    getDifferentRows(nodesList, linksList) {
      console.log("split", nodesList, linksList);
      let outcomes = nodesList.filter((node) => node.type === 0);
      outcomes = outcomes.map((outcome) => {
        return outcome.id;
      });
      outcomes.forEach((outcome) => {
        let rowNodes = [];
        let nextNodes = [];
        rowNodes.push({
          id: outcome,
          type: 0,
        });
        nextNodes.push(outcome);
        let rowLinks = [];

        let flag = false;
        while (!flag) {
          flag = true;
          linksList.forEach((link) => {
            if (nextNodes.includes(link.source)) {
              if (
                !outcomes.includes(link.target) &&
                !nextNodes.includes(link.target)
              ) {
                nextNodes.push(link.target);
                rowNodes.push({
                  id: link.target,
                  type: 1,
                });
                flag = false;
              }
            } else if (nextNodes.includes(link.target)) {
              if (
                !outcomes.includes(link.source) &&
                !nextNodes.includes(link.source)
              ) {
                nextNodes.push(link.source);
                rowNodes.push({
                  id: link.source,
                  type: 1,
                });
                flag = false;
              }
            }
          });
        }
        linksList.forEach((link) => {
          if (
            nextNodes.includes(link.source) &&
            nextNodes.includes(link.target)
          ) {
            rowLinks.push(link);
          }
        });
        nextNodes.splice(0, 1);
        this.tableData.push({
          CovariantNum: nextNodes.length,
          outcome: outcome,
          Variables: nextNodes,
          nodes: rowNodes.map((node) => {
            return node.id;
          }),
          links: rowLinks,
          originData: {
            nodesList: rowNodes,
            linksList: rowLinks,
          },
        });
      });
    },
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