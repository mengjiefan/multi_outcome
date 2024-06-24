<template>
  <div class="mainCharacter">
    <div v-for="(source, sindex) in nodes" :key="sindex" class="node-charts">
      <div v-for="(target, tindex) in nodes" :key="tindex" class="node-chart">
        <div class="factor-title">
          <span v-if="sindex === tindex">{{ source }}</span>
        </div>
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
import { createCharts } from "@/plugin/charts";
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
    getLabelsForType(id) {
      if (id === "Sex" || id === "a1_sex") return ["", "male", "female"];
      else if (id === "Insomnia") {
        return ["Rarely", "Sometimes", "Usually"];
      } else if (id === "BMI_cate")
        return ["18.5-23.9", "<18.5", "24-27.9", "≥28"];
      else if (id === "frailty_base_tri")
        return ["no frailty", "pre-frailty", "frailty"];
      else if (id === "residenc_byte") return ["", "city", "rural"];
      else if (id === "f64_sum")
        return ["no", "public or urban", "new rural", "social or commercial"];
      else if (id === "a51_byte") ["family or institutes", "live alone"];
      else if (id === "f31_sum")
        return [
          "",
          "pension",
          "spouse or child",
          "relatives",
          "work by self",
          "government",
        ];
      else if (id === "f5_whocaresick")
        return [
          "",
          "spouse",
          "son",
          "daughter in law",
          "daughter",
          "son in law",
          "son and daughter",
          "grandchild",
          "relatives",
          "friends and neighbors",
          "social service",
          "live-in caregiver",
          "nobody",
        ];
    },
    drawDiscreteChart(item, source, target, svg, x, y) {
      // Add a scale for bubble size
      let sum = [];
      let max = 0;
      for (let i = 0; i < 5; i++) {
        sum.push([]);
        for (let j = 0; j < 5; j++) {
          sum[i].push(0);
        }
      }
      item.forEach((row) => {
        sum[row[source]][row[target]]++;
        if (sum[row[source]][row[target]] > max)
          max = sum[row[source]][row[target]];
      });
      let realData = [];
      let xRange = [];
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          if (sum[i][j] > 0) {
            realData.push({
              x: i,
              y: j,
              value: sum[i][j],
            });
            if (!xRange.includes(i)) xRange.push(i);
          }
        }
      }

      const z = d3.scaleLinear().domain([0, max]).range([1, 20]);

      // Add dots
      svg
        .append("g")
        .selectAll("dot")
        .data(realData)
        .join("circle")
        .attr("cx", (d) => x(d.x))
        .attr("cy", (d) => y(d.y))
        .attr("r", (d) => z(d.value))
        .style("fill", "rgb(92,111,196)")
        .style("opacity", "1");
      let labels = this.getLabelsForType(source);
      if (!labels && xRange.length === 2 && xRange[0] + xRange[1] === 1)
        labels = ["no", "yes"];

      if (labels) {
        const xAxis = d3
          .axisBottom(x)
          .tickValues(realData.map((d) => d.x))
          .tickFormat((d, i) => labels[d]); // 使用数据中的 label 作为刻度标签
        svg.append("g").attr("transform", `translate(0, 110)`).call(xAxis);
        return true;
      }
      return false;
    },
    drawContinuousChart(item, source, target, svg, x, y) {
      // Add dots
      svg
        .append("g")
        .selectAll("dot")
        .data(item)
        .join("circle")
        .attr("cx", function (d) {
          return x(d[source]);
        })
        .attr("cy", function (d) {
          return y(d[target]);
        })
        .attr("r", 5)
        .attr("fill-opacity", 0.01)
        .style("fill", "rgb(92,111,196)");
    },
    drawMixedChartX(item, disD, conD, svg, histogram, disAxis, conAxis) {
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
    drawDensityChart(item, source, target, svg, x, y, height, width) {
      // Prepare a color palette
      const color = d3
        .scaleLinear()
        .domain([0, 0.1]) // Points per square pixel.
        .range(["white", "rgb(92,111,196)"]);

      // compute the density data
      const densityData = d3
        .contourDensity()
        .x(function (d) {
          return x(d[source]);
        })
        .y(function (d) {
          return y(d[target]);
        })
        .size([width, height])
        .bandwidth(20)(item);

      // show the shape!
      svg
        .insert("g", "g")
        .selectAll("path")
        .data(densityData)
        .enter()
        .append("path")
        .attr("d", d3.geoPath())
        .attr("fill", function (d) {
          return color(d.value);
        });
    },
    drawHistogram(item, svg, histogram, x, y, height) {
      // And apply this function to data to get the bins
      var bins = histogram(item);

      y.domain([
        0,
        d3.max(bins, function (d) {
          return d.length;
        }),
      ]); // d3.hist has to be called before the Y axis obviously
      svg.append("g").call(d3.axisLeft(y));

      // append the bar rectangles to the svg element
      svg
        .selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", 1)
        .attr("transform", function (d) {
          return "translate(" + x(d.x0) + "," + y(d.length) + ")";
        })
        .attr("width", function (d) {
          return x(d.x1) - x(d.x0) - 1;
        })
        .attr("height", function (d) {
          return height - y(d.length);
        })
        .style("fill", "rgb(92,111,196)");
    },
    async drawMatrix() {
      let dataset = localStorage.getItem("DATATYPE");
      let discreateIndexes = await getIndexOfDataset(dataset);

      // set the dimensions and margins of the graph
      const margin = { top: 10, right: 10, bottom: 30, left: 25 },
        width = 150 - margin.left - margin.right,
        height = 150 - margin.top - margin.bottom;

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
          let chart = document.getElementById(
            "chart" + (i * _this.nodes.length + i)
          );
          createCharts(
            _this.nodes[i],
            chart,
            item.map((row) => row[_this.nodes[i]])
          );
          continue;
        }

        for (let i = 0; i < _this.nodes.length; i++) {
          for (let j = 0; j < _this.nodes.length; j++) {
            let source = _this.nodes[i];
            let target = _this.nodes[j];
            if (i === j) continue;

            let svg = d3
              .select("#chart" + (i * _this.nodes.length + j))
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
            //if (source === "Income score") console.log(xMax, xMin);
            if (discreateIndexes.includes(source)) {
              xMin = xMin - 0.5;
              xMax = xMax + 0.5;
            }
            if (discreateIndexes.includes(target)) {
              yMax = yMax + 0.5;
              yMin = yMin - 0.5;
            }

            const x = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);
            let xTick = Math.ceil(xMax - xMin);
            let yTick = Math.ceil(yMax - yMin);
            if (xTick > 5) xTick = 5;
            if (yTick > 5) yTick = 5;

            // Add Y axis
            const y = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

            svg.append("g").call(d3.axisLeft(y).ticks(yTick));
            //condition 1: all continuous variables
            let flag = false;
            if (
              !discreateIndexes.includes(source) &&
              !discreateIndexes.includes(target)
            )
              _this.drawContinuousChart(item, source, target, svg, x, y);
            //condition 2: all discrete variables
            else if (
              discreateIndexes.includes(source) &&
              discreateIndexes.includes(target)
            ) {
              flag = _this.drawDiscreteChart(item, source, target, svg, x, y);
            } //condition 3: X axis represents discrete variables while Y axis does not
            else if (discreateIndexes.includes(source)) {
              let histogram = d3
                .histogram()
                .domain(y.domain())
                .thresholds(y.ticks(yTick)) // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                .value((d) => d);
              let disKinds = [];
              item.forEach((row) => {
                if (!disKinds.includes(row[source])) disKinds.push(row[source]);
              });
              let disAxis = d3
                .scaleBand()
                .range([0, width])
                .domain(disKinds)
                .padding(0.05);

              _this.drawMixedChartX(
                item,
                source,
                target,
                svg,
                histogram,
                disAxis,
                y
              );
            } //condition 4: Y axis represents discrete variables while X axis does not
            else {
              let histogram = d3
                .histogram()
                .domain(x.domain())
                .thresholds(x.ticks(xTick)) // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                .value((d) => d);
              let disKinds = [];
              item.forEach((row) => {
                if (!disKinds.includes(row[target])) disKinds.push(row[target]);
              });
              let disAxis = d3
                .scaleBand()
                .range([height, 0])
                .domain(disKinds)
                .padding(0.05);

              _this.drawMixedChartY(
                item,
                target,
                source,
                svg,
                histogram,
                disAxis,
                x
              );
            }
            if (flag) {
              svg.append("g").attr("transform", `translate(0, ${height})`);
            } else
              svg
                .append("g")
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(x).ticks(xTick));
          }
        }
      } catch (error) {
        console.log("请求失败了", error);
      }
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
