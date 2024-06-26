<template>
  <div class="mainCharacter">
    <div v-for="(source, sindex) in nodes" :key="sindex" class="node-charts">
      <div v-for="(target, tindex) in nodes" :key="tindex" class="node-chart">
        <!--<div class="factor-title">
          <span v-if="sindex === tindex">{{ source }}</span>
        </div>-->
        <div
          :id="'chart' + (sindex * nodes.length + tindex)"
          class="chart-canvas"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import { getIndexOfDataset } from "@/plugin/variable";
import { ref } from "vue";
import {
  createCharts,
  createMultipleCharts,
  getLabelsForType,
} from "@/plugin/charts";
import axios from "axios";
export default {
  name: "AppMainCharacter",
  data() {
    return {
      nodes: ref(),
    };
  },
  methods: {
    getRandomSubarray(arr, size) {
      var shuffled = arr.slice(0),
        i = arr.length,
        min = i - size,
        temp,
        index;
      while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
      }
      return shuffled.slice(min);
    },
    async drawMatrix() {
      let dataset = localStorage.getItem("DATATYPE");
      let discreateIndexes = await getIndexOfDataset(dataset);

      let _this = this;
      try {
        const response = await axios({
          method: "get",
          url: "http://localhost:8000/api/get_csv_data",
          params: {
            dataset: dataset,
          },
        });
        let item = response.data;
        let variables = item[0];
        item = _this.getRandomSubarray(item, 1000);

        item = item.map((row) => {
          let newRow = {};
          _this.nodes.forEach((node) => {
            let index = variables.indexOf(node);
            newRow[node] = parseFloat(row[index]);
          });
          return newRow;
        });
        for (let i = 0; i < _this.nodes.length; i++) {
          for (let j = 0; j < _this.nodes.length; j++) {
            let chart = document.getElementById(
              "chart" + (i * _this.nodes.length + j)
            );
            let source = _this.nodes[i];
            let target = _this.nodes[j];
            if (i === j) {
              createCharts(
                source,
                chart,
                item.map((row) => row[source])
              );
              continue;
            }
            let newData = item.map((row) => {
              let data = {};
              data[source] = row[source];
              data[target] = row[target];
              return data;
            });
            let ifXDis = discreateIndexes.includes(source);
            let ifYDis = discreateIndexes.includes(target);

            if (ifXDis === ifYDis)
              createMultipleCharts(
                source,
                target,
                ifXDis,
                ifYDis,
                chart,
                newData
              );
            else
              this.createViolin(i, j, source, target, newData, ifXDis, ifYDis);
          }
        }
      } catch (error) {
        console.log("请求失败了", error);
      }
    },
    createViolin(i, j, source, target, item, ifXDis, ifYDis) {
      const margin = { top: 10, right: 10, bottom: 20, left: 25 },
        width = 150 - margin.left - margin.right,
        height = 150 - margin.top - margin.bottom;

      let svg = d3
        .select("#chart" + (i * this.nodes.length + j))
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
      let xAxis = item.map((row) => row[source]);
      let yAxis = item.map((row) => row[target]);

      let xMin = d3.min(xAxis);
      let xMax = d3.max(xAxis);
      let yMin = d3.min(yAxis);
      let yMax = d3.max(yAxis);

      let xTick = 5;
      let yTick = 5;
      var x;
      var y;
      let xRange = [];
      let yRange = [];
      item.forEach((row) => {
        if (!xRange.includes(row[source])) xRange.push(row[source]);
        if (!yRange.includes(row[target])) yRange.push(row[target]);
      });
      xRange.sort();
      yRange.sort();
      if (ifXDis) {
        xMin = xMin - 0.5;
        xMax = xMax + 0.5;

        x = d3.scaleBand().domain([xMin, xMax]).range([0, width]);

        let xlabels = getLabelsForType(source);
        if (!xlabels && xRange.length === 2 && xRange[0] + xRange[1] === 1)
          xlabels = ["no", "yes"];
        if (xlabels) {
          item = item.map((row) => {
            let data = {};
            data[target] = row[target];
            data[source] = xlabels[row[source]];
            return data;
          });
          if (!xlabels[0]) xlabels.splice(0, 1);
          x = d3.scaleBand().domain(xlabels).range([0, width]);
        }

        xTick = Math.ceil(xMax - xMin);
        yTick = Math.ceil(yMax - yMin);
        if (xTick > 5) xTick = 5;
        if (yTick > 5) yTick = 5;

        y = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

        svg.append("g").call(d3.axisLeft(y).ticks(yTick));
        svg
          .append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(x).ticks(xTick));
        if (xlabels) xRange = xlabels;
      } else if (ifYDis) {
        yMax = yMax + 0.5;
        yMin = yMin - 0.5;

        x = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);

        xTick = Math.ceil(xMax - xMin);
        yTick = Math.ceil(yMax - yMin);
        if (xTick > 5) xTick = 5;
        if (yTick > 5) yTick = 5;

        y = d3.scaleBand().domain([yMin, yMax]).range([height, 0]);
        let ylabels = getLabelsForType(target);
        if (!ylabels && yRange.length === 2 && yRange[0] + yRange[1] === 1)
          ylabels = ["no", "yes"];
        if (ylabels) {
          item = item.map((row) => {
            let data = {};
            data[source] = row[source];
            data[target] = ylabels[row[target]];
            return data;
          });
          if (!ylabels[0]) ylabels.splice(0, 1);
          y = d3.scaleBand().domain(ylabels).range([height, 0]);
        }

        svg.append("g").call(d3.axisLeft(y).ticks(yTick));
        svg
          .append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(x).ticks(xTick));
        if (ylabels) yRange = ylabels;
      }
      if (ifXDis) {
        let histogram = d3
          .histogram()
          .domain(y.domain())
          .thresholds(y.ticks(yTick)) // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
          .value((d) => d);
        let disAxis = d3
          .scaleBand()
          .range([0, width])
          .domain(xRange)
          .padding(0.05);
        this.drawMixedChartX(item, source, target, svg, histogram, disAxis, y);
      } //condition 4: Y axis represents discrete variables while X axis does not
      else {
        let histogram = d3
          .histogram()
          .domain(x.domain())
          .thresholds(x.ticks(xTick)) // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
          .value((d) => d);

        let disAxis = d3
          .scaleBand()
          .range([height, 0])
          .domain(yRange)
          .padding(0.05);

        this.drawMixedChartY(item, target, source, svg, histogram, disAxis, x);
      }
    },
    drawMixedChartX(item, disD, conD, svg, histogram, disAxis, conAxis) {
      let sumstat = d3.rollup(
        item,
        (v) => {
          let input = v.map((g) => g[conD]);
          return histogram(input);
        },
        (d) => {
          return d[disD];
        }
      );
      const maxNum = Array.from(sumstat.values())
        .map((value, key) => d3.max(value.map((d) => d.length)))
        .reduce((a, b) => (a > b ? a : b));

      let xNumScale = d3
        .scaleLinear()
        .range([disAxis.bandwidth() / 2, disAxis.bandwidth()])
        .domain([0, maxNum]);

      svg
        .selectAll("violinBands")
        .data(sumstat)
        .enter()
        .append("g")
        .attr("transform", function (d) {
          return "translate(" + disAxis(d[0]) + ", " + 0 + ")";
        })
        .append("path")
        .datum(function (d) {
          return d[1];
        })
        .style("stroke", "none")
        .attr("fill", "rgb(92,111,196)")
        .attr(
          "d",
          d3
            .area()
            .x0(function (d) {
              return xNumScale(-d.length);
            })
            .x1(function (d) {
              return xNumScale(d.length);
            })
            .y(function (d) {
              return conAxis(d.x0);
            })
            .curve(d3.curveCatmullRom)
        );
    },
    drawMixedChartY(item, disD, conD, svg, histogram, disAxis, conAxis) {
      let sumstat = d3.rollup(
        item,
        (v) => {
          let input = v.map((g) => g[conD]);
          return histogram(input);
        },
        (d) => d[disD]
      );
      const maxNum = Array.from(sumstat.values())
        .map((value, key) => d3.max(value.map((d) => d.length)))
        .reduce((a, b) => (a > b ? a : b));

      let yNumScale = d3
        .scaleLinear()
        .range([disAxis.bandwidth() / 2, disAxis.bandwidth()])
        .domain([0, maxNum]);
      svg
        .selectAll("violinBands")
        .data(sumstat)
        .enter()
        .append("g")
        .attr("transform", function (d) {
          return "translate(" + 0 + ", " + disAxis(d[0]) + ")";
        })
        .append("path")
        .datum(function (d) {
          return d[1];
        })
        .style("stroke", "none")
        .attr("fill", "rgb(92,111,196)")
        .attr(
          "d",
          d3
            .area()
            .x(function (d) {
              return conAxis(d.x0);
            })
            .y0(function (d) {
              return yNumScale(-d.length);
            })
            .y1(function (d) {
              return yNumScale(d.length);
            })

            .curve(d3.curveCatmullRom)
        );
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
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 16px;
  font-size: 20px;
  width: fit-content;
  height: max-content;
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
  height: 150px;
}
.factor-title {
  font-size: 14px;
}
.chart-canvas {
  width: 150px;
  height: 150px;
}
</style>
