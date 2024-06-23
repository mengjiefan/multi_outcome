<template>
  <div class="navbar">
    <el-dialog
      title="Create Dataset"
      :visible.sync="dialogVisible"
      width="50%"
      :before-close="handleClose"
    >
      <div class="data-form">
        <div class="data-item">
          <div class="data-title">Dataset Name:</div>
          <div class="data-input">
            <el-input
              v-model="datasetName"
              maxlength="10"
              show-word-limit
            ></el-input>
          </div>
        </div>
        <div class="data-item">
          <div class="data-title">File:</div>
          <div class="data-input">
            <el-upload
              :auto-upload="false"
              action=""
              accept=".csv"
              class="upload-file"
              :on-change="handleChange"
              multiple
              :limit="2"
              :file-list="fileList"
            >
              <el-button size="small" type="primary">Select</el-button>
            </el-upload>
          </div>
        </div>

        <div class="hint">
          1.Only <b>CSV</b> files are allowed.
          <nav></nav>
          2.The CSV file should have variable names as headers; do not include
          an index column.
          <nav></nav>
          3.The data in the CSV file should only contain
          <b>numeric values</b>.
        </div>
        <div class="data-selection" v-if="variables?.length">
          <div class="data-title">Outcomes:</div>
          <div class="data-checkbox">
            <el-checkbox-group
              v-model="outcomes"
              @change="handleCheckedOutcomeChange"
            >
              <el-checkbox
                v-for="variable in variables"
                :label="variable"
                :key="variable"
                >{{ variable }}</el-checkbox
              >
            </el-checkbox-group>
          </div>
        </div>
        <div class="data-selection" v-if="variables?.length">
          <div class="data-title">
            Discrete
            <nav></nav>
            Variables:
          </div>
          <div class="data-checkbox">
            <el-checkbox-group
              v-model="discreteIndex"
              @change="handleCheckedIndexChange"
            >
              <el-checkbox
                v-for="variable in variables"
                :label="variable"
                :key="variable"
                >{{ variable }}</el-checkbox
              >
            </el-checkbox-group>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button
          type="primary"
          @click="createDataset"
          :disabled="!variables?.length || !outcomes?.length"
          >Confirm</el-button
        >
      </span>
    </el-dialog>
    <el-card class="box-card">
      <div class="box-card-header">
        <el-radio-group v-model="dataset" style="margin-bottom: 30px">
          <el-radio-button label="benchmark">benchmark</el-radio-button>
          <el-radio-button label="default">default</el-radio-button>
          <el-radio-button label="clhls">clhls</el-radio-button>
          <el-radio-button label="ukb">ukb</el-radio-button>
        </el-radio-group>
        <el-button
          type="primary"
          circle
          class="upload-button"
          @click="dialogVisible = true"
        >
          <i class="ri-upload-fill"></i>
        </el-button>
      </div>
      <el-tabs v-model="activeName" v-if="dataset !== 'benchmark'">
        <el-tab-pane label="Single Outcome" name="single">
          <div class="CharacterSelector">
            <OutcomeSelector :dataset="dataset"></OutcomeSelector></div
        ></el-tab-pane>
        <el-tab-pane label="Multiple Outcomes" name="second">
          <div class="AnalysisHistory">
            <CausalAnalysisHistory :dataset="dataset"></CausalAnalysisHistory>
          </div>
        </el-tab-pane>
      </el-tabs>
      <benchmark-list v-else></benchmark-list>
    </el-card>
  </div>
</template>

<script>
import OutcomeSelector from "./OutcomeSelector";
import CausalAnalysisHistory from "./CausalAnalysisHistory";
import { ref } from "vue";
import BenchmarkList from "./BenchmarkList.vue";
import { Loading } from "element-ui";

export default {
  name: "AppNavbar",
  components: { OutcomeSelector, CausalAnalysisHistory, BenchmarkList },
  setup() {
    let datasetType = localStorage.getItem("DATATYPE");
    if (!datasetType) datasetType = "default";
    return {
      dataset: ref(datasetType),
      activeName: ref("single"),
    };
  },
  data() {
    return {
      dialogVisible: ref(true),
      fileList: ref(),
      variables: ref(),
      datasetName: ref(),
      outcomes: ref(),
      discreteIndex: ref(),
    };
  },
  methods: {
    handleChange(file, fileList) {
      let name = file.name;
      this.datasetName = name.substring(0, name.length - 4);
      if (fileList.length > 1) fileList.splice(0, 1);
      const reader = new FileReader();
      this.variables = [];
      reader.onload = () => {
        const rows = reader.result.split("\n");
        const headers = rows[0].split(",");
        this.variables = headers;
        this.outcomes = [];
        this.discreteIndex = [];
      };
      reader.readAsText(file.raw);
      console.log(file);
    },
    createDataset() {
      let _this = this;
      let wrong = this.discreteIndex.filter((variable) =>
        _this.outcomes.includes(variable)
      );
      if (wrong.length) {
        this.$message({
          showClose: true,
          message: "There is an error in the selected variables.",
          type: "error",
        });
        return;
      }
    },
  },
  watch: {
    $route: {
      handler: function (route) {
        if (route.query.mode === "save") {
          this.activeName = "second";
        }
      },
      immediate: true,
    },
  },
};
</script>

<style scoped>
.box-card {
  max-height: 90vh;
  overflow: auto;
}
.box-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.upload-button {
  margin-bottom: 30px;
}
.navbar {
  min-width: 500px;
  max-width: 500px;
  font-size: 20px;
  position: relative;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 1vh;
  height: 99vh;
  overflow-y: auto; /* 当内容过多时y轴出现滚动条 */
  background-color: #e0eeee55;
}
.nav-title {
  padding-top: 10px;
  font-size: 32px;
  font-weight: bold;
  text-align: center;
}

.data-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.data-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.data-selection {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.data-checkbox {
  flex: 1;
}
.data-title {
  font-size: 16px;
  font-weight: bold;
  width: fit-content;
}
.upload-file {
  height: 30px;
  display: flex;
  overflow: hidden;
  align-items: center;
}
.hint {
  width: 100%;
  font-size: 12px;
}
</style>
