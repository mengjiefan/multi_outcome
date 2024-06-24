<template>
  <div class="navbar">
    <el-dialog title="Create Dataset" :visible.sync="dialogVisible" width="50%">
      <div class="data-form">
        <div class="data-item">
          <div class="data-title">Dataset Name:</div>
          <div class="data-input">
            <el-input
              v-model="datasetName"
              maxlength="10"
              show-word-limit
              @input="checkName"
              clearable
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
            <el-checkbox-group v-model="outcomes">
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
            <el-checkbox v-model="checkAll" @change="handleCheckAllChange"
              ><i>Select All</i></el-checkbox
            >
            <el-checkbox-group v-model="discreteIndex">
              <el-checkbox
                v-for="variable in variables"
                :label="variable"
                :key="variable"
                @change="checkIfAll"
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
          :disabled="!variables?.length || !outcomes?.length || !datasetName"
          >Confirm</el-button
        >
      </span>
    </el-dialog>
    <el-card class="box-card">
      <div class="box-card-header">
        <el-radio-group v-model="dataset" style="margin-bottom: 30px">
          <el-radio-button label="benchmark">benchmark</el-radio-button>
          <el-radio-button
            v-for="dataType in allDataSets"
            :key="dataType"
            :label="dataType"
          >
            {{ dataType }}
          </el-radio-button>
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
import axios from "axios";

export default {
  name: "AppNavbar",
  components: { OutcomeSelector, CausalAnalysisHistory, BenchmarkList },
  setup() {
    let datasetType = localStorage.getItem("DATATYPE");
    if (!datasetType) datasetType = "default";

    return {
      allDataSets: ref([]),
      dataset: ref(datasetType),
      activeName: ref("single"),
    };
  },
  data() {
    return {
      checkAll: ref(false),
      dialogVisible: ref(false),
      fileList: ref(),
      variables: ref(),
      datasetName: ref(),
      outcomes: ref(),
      discreteIndex: ref(),
    };
  },
  methods: {
    checkName() {
      console.log("key");
      const pattern = /^[a-zA-Z]*$/;
      if (!pattern.test(this.datasetName)) {
        this.$message({
          showClose: true,
          message: "Only letters are allowed.",
          type: "error",
        });
      }
      this.datasetName = this.datasetName.replace(/[^a-zA-Z]/g, "");
    },
    checkIfAll() {
      if (this.discreteIndex.length === this.variables.length && !this.checkAll)
        this.checkAll = true;
      else if (
        this.discreteIndex.length < this.variables.length &&
        this.checkAll
      )
        this.checkAll = false;
    },
    handleCheckAllChange(val) {
      if (val === true) this.discreteIndex = this.variables;
      else this.discreteIndex = [];
    },
    getDatasets() {
      axios({
        method: "get",
        url: "http://localhost:8000/api/get_all_dataset",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          this.allDataSets = response.data;
        })
        .catch((error) => {
          console.error("Error fetching the CSV file names:", error);
        });
    },
    handleChange(file, fileList) {
      let name = file.name;
      this.datasetName = name
        .substring(0, name.length - 4)
        .replace(/[^a-zA-Z]/g, "");
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
      this.fileList = [file.raw];
    },
    createDataset() {
      if (!this.datasetName) {
        this.$message({
          showClose: true,
          message: "Please enter the name.",
          type: "error",
        });
        return;
      } else if (
        this.datasetName === "default" ||
        this.datasetName === "ukb" ||
        this.datasetName === "clhls"
      ) {
        this.$message({
          showClose: true,
          message: "Please enter a different name.",
          type: "error",
        });
        return;
      }

      const formData = new FormData();
      let factors = this.variables.filter(
        (variable) => !this.outcomes.includes(variable)
      );
      formData.append("file", this.fileList[0]);
      formData.append("name", this.datasetName);
      formData.append("factors", JSON.stringify(factors));
      formData.append("outcomes", JSON.stringify(this.outcomes));
      formData.append("discreteIndex", JSON.stringify(this.discreteIndex));
      axios
        .post("http://localhost:8000/api/save_new_data", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          console.log("File uploaded successfully:", response.data);
          if (!this.allDataSets.includes(this.datasetName))
            this.allDataSets.push(this.datasetName);
          this.dialogVisible = false;
          this.$message({
            showClose: true,
            message: "A new dataset is created.",
            type: "success",
          });
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
          this.$message({
            showClose: true,
            message: "Failed to create dataset.",
            type: "error",
          });
        });
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
  mounted() {
    console.log("getDataset");
    this.getDatasets();
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
