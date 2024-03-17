<template>
  <div class="history-panel">
    <div class="history-main-title">· History</div>
    <div class="table">
      <el-table
        ref="multipleTable"
        :data="tableData"
        tooltip-effect="dark"
        :default-sort="{ prop: 'Outcome', order: 'descending' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45"> </el-table-column>
        <el-table-column
          fixed
          prop="outcome"
          label="Outcome"
          sortable
          width="120"
        />

        <el-table-column prop="CovariantNum" label="Num" width="75" />
        <el-table-column
          prop="Variables"
          label="Variables"
          show-overflow-tooltip
          :formatter="formatter"
        >
          <template slot-scope="scope">{{
            scope.row.Variables.join()
          }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="Operation" width="100">
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
      <div class="selections">
        <el-select
          v-model="graphType"
          placeholder="Please select the graph type"
        >
          <el-option
            v-for="item in graphOption"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
        <el-button
          type="primary"
          size="small"
          :loading="loading"
          @click="btnSelect()"
          >Plot the rows
        </el-button>
        <!--<el-select v-model="selectType" placeholder="Please Choose the mode">
         <el-option value="1" label="Compare the Rows"></el-option>
           <el-option value="2" label="Merge All the Nodes"></el-option>
        </el-select>-->
      </div>
    </div>
  </div>
</template>

<script>
// 引入axios
import axios from "axios";
import { ref } from "vue";
import { LinksManagement } from "@/plugin/joint/linkAndNode";
import { findLink } from "@/plugin/links";
import historyManage from "@/plugin/history";
export default {
  name: "CausalAnalysisHistory",
  props: {
    dataset: String,
    required: true,
  },
  data() {
    return {
      nowdataset: ref("default"),
      value: "",
      CovariantNum: "",
      SelectedVariables: [],
      Variables_result: {},
      tableData: [],
      graphOption: [
        {
          value: "DirectedGraphView",
          label: "DirectedGraph",
        },
        /*
        {
          label: "CausalGraphView",
          value: "CausalGraphView",
        },
        { label: "MultiOutcomes Matrix", value: "MultiOutcomesView" },*/
      ],
      graphType: ref("DirectedGraphView"),
      multipleSelection: [],
      dataString: ref("tableData"),
      selection: [],
      search: "",
      selection_result: {},
      nodesList: [],
      loading: ref(false),
      linksList: [],
    };
  },
  watch: {
    dataset: {
      handler: function (dataset) {
        this.changeTableData(dataset);
      },
      immediate: true,
    },
    $route: {
      handler: function (route) {
        if (route.query.mode === "save") {
          this.saveToTable();
        }
      },
      immediate: true,
    },
  },
  methods: {
    changeTableData(dataset) {
      if (this.nowdataset === dataset) return;
      let dataString = "";
      switch (this.nowdataset) {
        case "default":
          dataString = "tableData";
          break;
        default:
          dataString = this.nowdataset + "data";
          break;
      }
      localStorage.setItem(dataString, JSON.stringify(this.tableData));
      dataString = "";
      switch (dataset) {
        case "default":
          dataString = "tableData";
          break;
        default:
          dataString = dataset + "data";
          break;
      }
      this.tableData = JSON.parse(localStorage.getItem(dataString));
      this.dataString = dataString;
      this.nowdataset = dataset;
    },
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
        path: "/redirect",
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
    getLinks(outcomes, factors) {
      this.loading = true;
      axios({
        //请求类型
        method: "GET",
        //URL
        url: "http://localhost:8000/api/getLink",
        //参数
        params: {
          outcomes: outcomes.join(),
          factors: factors.join(),
        },
      })
        .then((response) => {
          console.log("new links", response.data);
          localStorage.setItem(
            "GET_JSON_RESULT",
            JSON.stringify({
              nodesList: response.data.nodes,
              linksList: response.data.links,
            })
          );
          this.loading = false;
          this.routeToGraph();
        })
        .catch((error) => {
          console.log("请求失败了", error.message);
        });
    },
    removeDuplicate(selections) {
      let finalSelections = [];
      let outs = [];
      selections.forEach((selection) => {
        if (!outs.includes(selection.outcome)) outs.push(selection.outcome);
      });
      for (let i = 0; i < outs.length; i++) {
        let outcome = outs[i];
        let selectionNow = {
          linksList: [],
          variable: [],
          outcome: outcome,
          history: [],
        };
        let records = [];
        let sameSelection = selections.filter(
          (selection) => selection.outcome === outcome
        );
        for (let j = 0; j < sameSelection.length; j++) {
          let selection = sameSelection[j];
          records.push(selection.history); //相同outcome合并历史
          selection.links.forEach((link) => {
            let index = findLink.sameNodeLink(link, selectionNow.linksList);
            if (index < 0) selectionNow.linksList.push(link);
          });
          selection.Variables.forEach((node) => {
            if (selectionNow.variable.indexOf(node) < 0)
              selectionNow.variable.push(node);
          });
        }
        selectionNow.linksList = LinksManagement.getFinalLinks(
          selectionNow.linksList
        ); //relayout(remove 'reverse','add','hidden')
        selectionNow.history = historyManage.combineHistory(records); //合并子图操作历史
        historyManage.reDoHistory(selectionNow); //redo
        //Redo后的结果是relayout后的结果
        finalSelections.push(selectionNow);
      }
      return finalSelections;
    },
    // 通过公用数据库store进行数据管理
    btnSelect() {
      let selections = this.$refs.multipleTable.selection;
      if (!selections || selections.length === 0) {
        this.$message({
          showClose: true,
          message: "Please select at least one history record!",
          type: "warning",
        });
        return;
      }
      if (selections.length > 1) {
        //combine all the data and relayout!
        let nodes = [];
        let nodesList = [];
        let linksList = [];
        selections = this.removeDuplicate(selections);
        for (let sI = 0; sI < selections.length; sI++) {
          let selection = selections[sI];

          if (!nodes.includes(selection.outcome)) {
            nodes.push(selection.outcome);
            nodesList.push({
              id: selection.outcome,
              type: 0,
            });
          }
          selection.variable.forEach((node) => {
            if (!nodes.includes(node)) {
              nodes.push(node);
              nodesList.push({
                id: node,
                type: 1,
              });
            }
          });
          for (let i = 0; i < selection.linksList.length; i++) {
            let index = findLink.sameNodeLink(
              selection.linksList[i],
              linksList
            );
            if (index < 0) linksList.push(selection.linksList[i]);
          }
        }
        const _this = this;

        setTimeout(() => {
          if (selections.length === 1)
            localStorage.setItem(
              "GET_JSON_RESULT",
              JSON.stringify({
                nodesList: nodesList,
                linksList: linksList,
                history: selections[0].history,
              })
            );
          else
            localStorage.setItem(
              "GET_JSON_RESULT",
              JSON.stringify({
                nodesList: nodesList,
                linksList: linksList,
                selections: selections,
              })
            );

          _this.routeToGraph();
        }, 500);
      } else {
        let nodes = [
          {
            id: selections[0].outcome,
            type: 0,
          },
        ].concat(
          selections[0].Variables.map((node) => {
            return {
              id: node,
              type: 1,
            };
          })
        );
        let data = {
          nodesList: nodes,
          linksList: selections[0].links,
          history: selections[0].history,
        };
        if (selections[0].aaaiLinks) data.aaaiLinks = selections[0].aaaiLinks;
        if (selections[0].dagLinks) data.dagLinks = selections[0].dagLinks;
        localStorage.setItem("GET_JSON_RESULT", JSON.stringify(data));
        this.routeToGraph();
      }
      return;
    },
    routeToGraph() {
      this.$router.push({
        path: "/redirect",
        query: { next: this.graphType },
      });
    },
    formatter(row, column) {
      return row.Variables;
    },

    deleteRow(index, rows) {
      rows.splice(index, 1);
      localStorage.setItem(this.dataString, JSON.stringify(this.tableData));
    },
    saveToTable() {
      console.log("saveMode");
      let saveData = localStorage.getItem("GET_SAVE_DATA");
      localStorage.setItem("GET_SAVE_DATA", "");
      if (saveData) {
        const newRow = JSON.parse(saveData);
        this.getDifferentRows(newRow);
      }
      this.$router.push({
        path: this.$route.path,
      });
    },
    saveRow(outcome, linksList, history, aaaiLinks, dagLinks) {
      let nextNodes = [];
      nextNodes.push(outcome);

      let flag = false;
      while (!flag) {
        flag = true;
        linksList.forEach((link) => {
          if (nextNodes.includes(link.source)) {
            if (!nextNodes.includes(link.target)) {
              nextNodes.push(link.target);
              flag = false;
            }
          } else if (nextNodes.includes(link.target)) {
            if (!nextNodes.includes(link.source)) {
              nextNodes.push(link.source);
              flag = false;
            }
          }
        });
      }

      nextNodes.splice(0, 1);
      if (!this.tableData) this.tableData = [];
      let newRowData = {
        CovariantNum: nextNodes.length,
        outcome: outcome,
        Variables: nextNodes,
        history: history,
        links: linksList,
      };
      if (aaaiLinks) newRowData.aaaiLinks = aaaiLinks;
      if (dagLinks) newRowData.dagLinks = dagLinks;
      this.tableData.push(newRowData);
    },
    getDifferentRows(newRow) {
      let nodesList = newRow.nodesList;
      let sonNum = 0;
      nodesList.forEach(function (state) {
        if (state.type === 0) sonNum++;
      });
      let _this = this;
      if (sonNum > 1) {
        for (let index = 0; index < newRow.selections.length; index++) {
          let row = newRow.selections[index];
          _this.saveRow(row.outcome, row.linksList, row.history);
        }
      } else {
        let index = nodesList.findIndex((node) => {
          if (node.type === 0) return true;
          else return false;
        });
        let outcome = nodesList[index].id;
        _this.saveRow(
          outcome,
          newRow.linksList,
          newRow.history,
          newRow.aaaiLinks,
          newRow.dagLinks
        );
      }
      localStorage.setItem(this.dataString, JSON.stringify(this.tableData));
    },
  },
  // 到站接收数据，在接收组件的mounted中接收
  mounted() {
    this.tableData = JSON.parse(localStorage.getItem(this.dataString));
    if (!this.tableData) this.tableData = [];
  },
};
</script>

<style scoped>
.history-panel {
  height: auto;
  display: flex;
  flex-direction: column;
  padding: 10px;
}
.history-main-title {
  font-size: 20px;
  font-weight: bold;
  line-height: 36px;
}
.table {
  height: auto;
  overflow: auto;
}
.list-group-item {
  cursor: pointer;
}
.drawing-command {
  margin-top: 20px;
  gap: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
}
.selections {
  width: 100%;
  display: flex;
  justify-content: space-between;
}
</style>