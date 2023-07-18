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

        <el-table-column prop="CovariantNum" 
       label="Num" width="75" />
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
import bus from "../componentsInteraction/bus.js";
import { node } from "dagre-d3/lib/intersect/index.js";
import historyManage from "@/plugin/history";
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
      selectType: ref("1"),
      multipleSelection: [],
      selection: [],
      search: "",
      selection_result: {},
      nodesList: [],
      loading: ref(false),
      linksList: [],
    };
  },
  watch: {
    $route: {
      handler: function (route) {
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
            let index = selectionNow.linksList.findIndex((item) => {
              if (item.target === link.target && item.source === link.source) {
                return true;
              } else if (
                item.source === link.target &&
                item.target === link.source
              ) {
                return true;
              } else {
                return false;
              }
            });
            if (index < 0) {
              selectionNow.linksList.push(link);
            }
          });
          selection.Variables.forEach((node) => {
            if (selectionNow.variable.indexOf(node) < 0) {
              selectionNow.variable.push(node);
            }
          });
        }
        selectionNow.history = historyManage.combineHistory(records); //合并子图操作历史
        console.log(outcome, selectionNow.history);
        historyManage.reDoHistory(selectionNow);
        finalSelections.push(selectionNow);
      }
      return finalSelections;
    },
    // 通过公用数据库store进行数据管理
    btnSelect() {
      let selections = this.$refs.multipleTable.selection;

      if (this.selectType === "2") {
        let outcomes = [];
        let factors = [];
        selections.forEach((selection) => {
          if (!outcomes.includes(selection.outcome)) {
            outcomes.push(selection.outcome);
          }
          selection.Variables.forEach((variable) => {
            if (!factors.includes(variable)) factors.push(variable);
          });
        });
        this.getLinks(outcomes, factors);
      } else if (selections.length > 1) {
        let nodes = [];
        let nodesList = [];
        let linksList = [];
        selections = this.removeDuplicate(selections);
        let allNumber = selections.length;
        for (let sI = 0; sI < selections.length; sI++) {
          let selection = selections[sI];
          let flag = false;
          if (!nodes.includes(selection.outcome)) {
            flag = true;
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
            } else if (flag) {
              let index = nodes.indexOf(node);
              nodesList[index].type++;
            }
          });
          for (let i = 0; i < selection.linksList.length; i++) {
            let link = selection.linksList[i];
            let index = linksList.findIndex((item) => {
              if (item.target === link.target && item.source === link.source) {
                return true;
              } else if (
                item.source === link.target &&
                item.target === link.source
              ) {
                return true;
              } else {
                return false;
              }
            });
            if (index < 0) {
              linksList.push(link);
            } else if (linksList[index].hidden && !link.hidden) {
              //不隐藏覆盖隐藏
              linksList[index] = {
                source: linksList[index].source,
                target: linksList[index].target,
                value: linksList[index].value,
              };
            } else if (!linksList[index].hidden && !link.hidden) {
              //需要都转为同向，否则布局不同；对于带reverse的特别处理
              if (link.source !== linksList[index].source) {
                link.source = linksList[index].source;
                link.target = linksList[index].target;
                console.log("differ", link);
                if (!link.reverse) {
                  link["reverse"] = true;
                }
              }
            }
          }
        }
        nodesList = nodesList.map((node) => {
          if (node.type === allNumber && allNumber > 1)
            return {
              id: node.id,
              type: -1,
            };
          else if (node.type > 0)
            return {
              id: node.id,
              type: 1,
            };
          else return node;
        });
        const _this = this;
        setTimeout(() => {
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
        localStorage.setItem(
          "GET_JSON_RESULT",
          JSON.stringify({
            nodesList: nodes,
            linksList: selections[0].links,
            history: selections[0].history,
          })
        );
        this.routeToGraph();
      }
      return;
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
      localStorage.setItem("tableData", JSON.stringify(this.tableData));
    },
    saveToTable() {
      console.log("saveMode");
      const newRow = JSON.parse(localStorage.getItem("GET_SAVE_DATA"));
      this.getDifferentRows(newRow);
      this.$router.push({
        path: this.$route.path,
      });
    },
    getDifferentRows(newRow) {
      let history = newRow.history;
      let nodesList = newRow.nodesList;
      let linksList = newRow.linksList;
      let outcomes = nodesList.filter((node) => node.type === 0);
      outcomes = outcomes.map((outcome) => {
        return outcome.id;
      });
      outcomes.forEach((outcome) => {
        let nextNodes = [];

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

                flag = false;
              }
            } else if (nextNodes.includes(link.target)) {
              if (
                !outcomes.includes(link.source) &&
                !nextNodes.includes(link.source)
              ) {
                nextNodes.push(link.source);

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
          history: history,
          links: rowLinks,
        });

        localStorage.setItem("tableData", JSON.stringify(this.tableData));
      });
    },
  },
  // 到站接收数据，在接收组件的mounted中接收
  mounted() {
    this.tableData = JSON.parse(localStorage.getItem("tableData"));
    if (!this.tableData) this.tableData = [];
  },
};
</script>

<style scoped>
.history-panel {
  height: auto;
  max-height: 70vh;
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