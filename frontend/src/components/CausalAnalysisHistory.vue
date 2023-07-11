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
        <el-select v-model="selectType" placeholder="Please Choose the mode">
          <el-option value="1" label="Compare the Rows"></el-option>
          <el-option value="2" label="Merge All the Nodes"></el-option>
        </el-select>
      </div>
      <el-button
        type="primary"
        size="small"
        :loading="loading"
        @click="btnSelect()"
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
      outs.forEach((outcome) => {
        let selectionNow = {
          linksList: [],
          variable: [],
          outcome: outcome,
        };
        selections.forEach((selection) => {
          if (selection.outcome === outcome) {
            selection.links.forEach((link) => {
              let index = selectionNow.linksList.findIndex((item) => {
                if (
                  item.target === link.target &&
                  item.source === link.source
                ) {
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
              } else if (selectionNow.linksList[index].hidden && !link.hidden) {
                //未隐藏覆盖隐藏
                selectionNow.linksList[index] = {
                  source: linksList[index].source,
                  target: linksList[index].target,
                  value: linksList[index].value,
                };
              } else if (link.reverse) {
                //翻转中覆盖无翻转
                selectionNow.linksList[index] = {
                  source: linksList[index].source,
                  target: linksList[index].target,
                  value: linksList[index].value,
                  reverse: true,
                };
              }
            });
            selection.Variables.forEach((node) => {
              if (selectionNow.variable.indexOf(node) < 0) {
                selectionNow.variable.push(node);
              }
            });
          }
        });
        finalSelections.push(selectionNow);
      });
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
      } else {
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
              if(link.reverse) {
                if(link.source === linksList[index].target
                 &&link.target === linksList[index]) {
                link.reverse = false;
                }
              }
              link.source = linksList[index].source;
              link.target = linksList[index].target;
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
    console.log(this.tableData);
  },
};
</script>

<style scoped>
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
  display: flex;
  gap: 16px;
}
</style>