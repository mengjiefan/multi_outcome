<template>
  <div id="DirectedGraph">
    <div class="graph-title">DirectedGraph View</div>
    <router-view></router-view>
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  name: "DirectedGraph",
  setup() {
    return {
      sonNum: ref(0),
    };
  },

  mounted() {
    let result = localStorage.getItem("GET_JSON_RESULT");

    if (result) {
      let multipleSearchValue = JSON.parse(result);
      let that = this;
      multipleSearchValue.nodesList.forEach(function (state) {
        if (state.type === 0) that.sonNum++;
      });
    }

    if (this.$route.name === "DirectedGraphView") {
      if (this.sonNum > 1) {
        this.$router.push({
          name: "DirectedSuperGraph",
        });
      } else {
        this.$router.push({
          name: "SimpleDirectedGraph",
        });
      }
    }
  },
};
</script>

<style>
.label > g > text {
  fill: white;
}

.link {
  fill: none;
  stroke: #bbb;
}
.tooltip {
  position: absolute;
  text-align: left;
  background-color: white;
  border-radius: 3px;
  box-shadow: rgb(174, 174, 174) 0px 0px 10px;

  padding-top: 5px;
}
.node-name {
  padding-bottom: 5px;
}
.tooltip > div {
  padding-left: 10px;
  padding-right: 10px;
}
rect#hover-node {
  stroke: #FF4365;
  stroke-width: 2.5px;
  display: block;
}
.node {
  cursor: pointer;
  transition-duration: 0.2s;
}
.path {
  transition-duration: 0.2s;
}
.tooltip {
  font-size: 14px;
}
.hint-list {
  font-weight: bold;
  padding-top: 5px;
  width: auto;
}
.hint-list::before {
  content: "· ";
}
.operate-menu {
  width: auto;
  text-align: left;
  cursor: pointer;
  padding-top: 5px;
  padding-bottom: 5px;
}
hr {
  padding: 0;
  margin-bottom: 0;

  margin-left: 10px;
  margin-right: 10px;
}
.operate-menu:hover {
  background-color: #e1e1e1;
}
.operate-header {
  padding: 0;
  display: flex;
  line-height: 24px;
  justify-content: space-between;
}
.close-button {
  float: right;
  font-size: 24px;
  margin-right: 5px;
  cursor: pointer;
}
</style>
<style scoped>
#DirectedGraph {
  height: 100vh;
  flex: 3;
  display: flex;
  flex-direction: column;
}
.graph-info-header {
  padding: 16px;
  height: auto;
}
.graph-title {
  background-color: rgb(55, 162, 228);
  color: white;
  padding: 16px;
  text-align: center;
  font-size: 36px;
}
.draw-directed-button {
  background-color: #fa95a6;
  color: white;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  padding: 8px 16px 8px 16px;
}
.save-button {
  margin-left: 8px;
  background-color: #fa95a6;
  color: white;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  padding: 8px 16px 8px 16px;
}
.hint {
  font-size: 14px;
  margin-top: 16px;
}
.hint span {
  color: red;
}
.hint::before {
  content: "* ";
  color: red;
}
.draw-directed-button:hover {
  box-shadow: 0 0 3px 1px #e8e8e8;
  transition-duration: 0.1s;
}
.draw-directed-button:active {
  background-color: #f77;
  color: white;
}
.save-button:hover {
  box-shadow: 0 0 3px 1px #e8e8e8;
  transition-duration: 0.1s;
}
.drawing-canvas {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.drawing-buttons {
  height: 10;
  padding: 16px;
}
.graph-svg {
  width: 100%;
  display: flex;
  height: 90%;
}
.group-graphs {
  width: 100%;
  display: flex;
  height: 90%;
}
.sum-svg {
  position: absolute;
  left: 16px;
  top: calc(8vh + 650px);
  padding: 16px;
  width: 458px;
  height: 480px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.sum-svg .title {
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: bold;
}
.sum-svg svg {
  height: 450px;
  width: 458px;
}

.son-title {
  font-size: 16px;
  font-weight: bold;
}
.one-line-operator .drawing-buttons {
  display: flex;
  justify-content: flex-end;
}
.graph-main-title {
  font-size: 20px;
  margin-top: 20px;
  font-weight: bold;
  line-height: 36px;
}
.graph-subtitle {
  font-size: 18px;
  font-weight: bold;
  line-height: 32px;
}
</style>
<style>
.counting-anime {
  position: absolute !important;
  top: 0;
  height: 100%;
}

.chart-content {
  padding: 16px;
  position: absolute;
  display: flex;
  flex-direction: column;
  bottom: 15px;
  left: 10px;
  width: 465px;
  height: 29vh;
  min-height: 0;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.fade-enter {
  opacity: 0;
}
.fade-enter-active {
  transition-duration: 0.1s;
}
.fade-leave-to {
  opacity: 0;
}
.fade-leave-active {
  transition-duration: 0.1s;
}

.one-line-name {
  flex: 0;
  text-align: center;
  align-items: center;
}
.line-chart {
  flex: 1;
  min-height: 25vh;
}
.line-title {
  font-size: 18px;
  font-weight: bold;
  line-height: 32px;
}
.chart-box {
  display: flex;
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: 8px;
  padding-top: 5px;
  justify-content: center;
  align-items: center;
}
.chart-hint {
  display: flex;
  height: 170px;
  width: 284px;
}
#triangle {
  height: 5px;
  width: 5px;
  background-color: black;
}
.son-header {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>