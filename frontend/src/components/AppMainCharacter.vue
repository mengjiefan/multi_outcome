<template>
  <div class="mainCharacter">
    <div v-for="(source, sindex) in nodes" :key="sindex" class="node-charts">
      <div v-for="(target, tindex) in nodes" :key="tindex" class="node-chart">
        <div class="factor-title">
          <span v-if="sindex === tindex">{{ source }}</span></div>
        <div
          :id="'chart' + (sindex * nodes.length + tindex)"
          class="chart-canvas"
        ></div>
      </div>
    </div>
    <!-- <button>
			<router-link class="list-group-item" active-class="active" to="/CausalGraphView">Get CausalGraph</router-link>
		</button>
    <hr>
		<button>
			<router-link class="list-group-item" active-class="active" to="/MultiOutcomesView">Get MultiOutcomes matrix</router-link>
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
        item = item.slice(0, 1000);
        item = item.map((row) => {
          let newRow = {};
          _this.nodes.forEach((node) => {
            newRow[node] = parseFloat(row[node]);
          });
          return newRow;
        });
        for (let i = 0; i < _this.nodes.length; i++) {
          for (let j = 0; j < _this.nodes.length; j++) {
            let svg = d3
              .select("#chart" + (i * _this.nodes.length + j))
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", `translate(${margin.left}, ${margin.top})`);

            let xAxis = item.map((row) => row[_this.nodes[i]]);
            let yAxis = item.map((row) => row[_this.nodes[j]]);
            let xMin = xAxis.reduce((a, b) => Math.min(a, b), Infinity) - 0.5;
            let xMax = xAxis.reduce((a, b) => Math.max(a, b), -Infinity) + 0.5;
            let yMin = yAxis.reduce((a, b) => Math.min(a, b), Infinity) - 0.5;
            let yMax = yAxis.reduce((a, b) => Math.max(a, b), -Infinity) + 0.5;

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
              .data(item)
              .join("circle")
              .attr("cx", function (d) {
                return x(d[_this.nodes[i]]);
              })
              .attr("cy", function (d) {
                return y(d[_this.nodes[j]]);
              })
              .attr("r", 5)
              .attr("fill-opacity", 0.01)
              .style("fill", "#69b3a2");
          }
        }
      });
    },
  },
  mounted() {
    let result = localStorage.getItem("GET_JSON_RESULT");
    if (result) result = JSON.parse(result);

    this.nodes = result.nodesList.map((node) => {
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
  width: fit-content;
}
.node-charts {
  height: fit-content;
  width: fit-content;
  display: flex;
}
.factor-title {
  height: 20px;
  display: flex;
}
.node-chart {
  width: 150px;
  height: 220px;
  overflow-x: visible;
}
.factor-title {
  font-size: 14px;
}
.chart-canvas {
  width: 100%;
}
</style>