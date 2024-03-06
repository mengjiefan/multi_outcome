<template>
  <div class="mainCharacter">
    <div v-for="(node, index) in nodes" :key="index" class="node-chart">
     <div class="factor-title"> {{ node }}</div>
      <div :id="'chart' + index" class="chart-canvas"></div>
    </div>
    <!-- <button>
			<router-link class="list-group-item" active-class="active" to="/AppMainPlot/CausalGraphView">Get CausalGraph</router-link>
		</button>
    <hr>
		<button>
			<router-link class="list-group-item" active-class="active" to="/AppMainPlot/MultiOutcomesView">Get MultiOutcomes matrix</router-link>
		</button> -->
  </div>
</template>
 
<script>
import * as d3 from "d3";
import { ref } from "vue";
export default {
  name: "AppMainCharacter",
  data() {
    return {
      nodes: ref(),
      outcome: ref(),
    };
  },
  methods: {
    drawMatrix() {
      let dataset = localStorage.getItem("DATATYPE");

      // set the dimensions and margins of the graph
      const margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 200 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

      // append the svg object to the body of the page

      /*
      //Read the data
      d3.csv("/" + dataset + ".csv").then(function (item) {
        let newTable = item.map((row) => {
          let newRow = {};
          nodes.forEach((node) => {
            newRow[node] = row[node];
          });
          return newRow;
        });
      });*/
      let _this = this;
      d3.csv("/" + dataset + ".csv").then(function (item) {
        item = item.slice(0, 100);
        for (let i = 0; i < _this.nodes.length; i++) {
          let nowFac = _this.nodes[i];
          let svg = d3
            .select("#chart" + i)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

          let data = item.map((row) => {
            let newRow = {};
            newRow[nowFac] = parseFloat(row[nowFac]);
            newRow[_this.outcome] = parseFloat(row[_this.outcome]);
            return newRow;
          });
          let xAxis = data.map((row) => row[nowFac]);
          let yAxis = data.map((row) => row[_this.outcome]);
          let xMin = xAxis.reduce((a, b) => Math.min(a, b), Infinity) - 0.5;
          let xMax = xAxis.reduce((a, b) => Math.max(a, b), -Infinity) + 0.5;
          let yMin = yAxis.reduce((a, b) => Math.min(a, b), Infinity) - 0.5;
          let yMax = yAxis.reduce((a, b) => Math.max(a, b), -Infinity) + 0.5;
          console.log(xMin, xMax, nowFac);
          const x = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);
          let xTick = Math.ceil(xMax - xMin);
          let yTick = Math.ceil(yMax - yMin);
          if (xTick > 5) xTick = 5;
          if (yTick > 5) yTick = 5;
          svg.append("g").attr("transform", `translate(0, ${height})`).call(
            d3.axisBottom(x).ticks(xTick) // 设置分段数量为10
          );

          // Add Y axis
          const y = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);
          svg.append("g").call(d3.axisLeft(y).ticks(yTick));

          // Add dots
          svg
            .append("g")
            .selectAll("dot")
            .data(data)
            .join("circle")
            .attr("cx", function (d) {
              return x(d[nowFac]);
            })
            .attr("cy", function (d) {
              return y(d[_this.outcome]);
            })
            .attr("r", 1.5)
            .style("fill", "#69b3a2");
        }
      });
    },
  },
  mounted() {
    let result = localStorage.getItem("GET_JSON_RESULT");
    if (result) result = JSON.parse(result);
    let outIndex = result.nodesList.findIndex((node) => node.type === 0);
    this.outcome = result.nodesList[outIndex].id;

    this.nodes = result.nodesList
      .filter((node) => node.type === 1)
      .map((node) => {
        return node.id;
      });
    this.drawMatrix();
  },
};
</script>
 
<style scoped>
.mainCharacter {
  padding: 16px;
  font-size: 20px;
  max-width: 500px;
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 一行两列 */
  row-gap: 10px; /* 设置列之间的间距 */
}
.node-chart {
  height: fit-content;
}
.factor-title {
  font-size: 14px;
}
.chart-canvas {
  width: 100%;
  height: fit-content;
}
</style>