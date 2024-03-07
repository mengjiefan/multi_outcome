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
import { ukb_index, default_index, clhls_index } from "@/plugin/variable";
import { ref } from "vue";
export default {
  name: "AppMainCharacter",
  data() {
    return {
      nodes: ref(),
    };
  },
  methods: {
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
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          if (sum[i][j] > 0)
            realData.push({
              x: i,
              y: j,
              value: sum[i][j],
            });
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
        .style("fill", "#69b3a2")
        .style("opacity", "0.7")
        .attr("stroke", "black");
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
        .style("fill", "#69b3a2");
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
        .attr("fill", "#69b3a2")
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
        .attr("fill", "#69b3a2")
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
        .range(["white", "#69b3a2"]);

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
        .style("fill", "#69b3a2");
    },
    drawMatrix() {
      let dataset = localStorage.getItem("DATATYPE");
      let discreateIndexes = clhls_index;
      if (dataset === "ukb") discreateIndexes = ukb_index;
      else if (dataset === "default") discreateIndexes = default_index;
      // set the dimensions and margins of the graph
      const margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 200 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

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
            let source = _this.nodes[i];
            let target = _this.nodes[j];
            let svg = d3
              .select("#chart" + (i * _this.nodes.length + j))
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", `translate(${margin.left}, ${margin.top})`);
            let xAxis = item.map((row) => row[source]);
            let yAxis = item.map((row) => row[target]);

            let xMin = d3.min(xAxis) - 0.5;
            let xMax = d3.max(xAxis) + 0.5;
            let yMin = d3.min(yAxis) - 0.5;
            let yMax = d3.max(yAxis) + 0.5;

            const x = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);
            let xTick = Math.ceil(xMax - xMin);
            let yTick = Math.ceil(yMax - yMin);
            if (xTick > 5) xTick = 5;
            if (yTick > 5) yTick = 5;

            // Add Y axis
            const y = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

            if (i === j) {
              xMin = d3.min(xAxis) - 1;
              xMax = d3.max(xAxis) + 1;
              xTick = Math.ceil(xMax - xMin);
              while (xTick > 10) xTick = xTick / 2;
              let strictX = d3
                .scaleLinear()
                .domain([xMin, xMax])
                .range([0, width]);
              svg.append("g").attr("transform", `translate(0, ${height})`).call(
                d3.axisBottom(strictX).ticks(xTick) // 设置分段数量为10
              );
              var histogram = d3
                .histogram()
                .value(function (d) {
                  return d[source];
                }) // I need to give the vector of value
                .domain(strictX.domain()) // then the domain of the graphic
                .thresholds(strictX.ticks(xTick)); // then the numbers of bins
              _this.drawHistogram(item, svg, histogram, strictX, y, height);
            } else {
              svg.append("g").attr("transform", `translate(0, ${height})`).call(
                d3.axisBottom(x).ticks(xTick) // 设置分段数量为10
              );
              svg.append("g").call(d3.axisLeft(y).ticks(yTick));
              if (
                !discreateIndexes.includes(source) &&
                !discreateIndexes.includes(target)
              )
                _this.drawContinuousChart(item, source, target, svg, x, y);
              //_this.drawDensityChart(item,source, target, svg, x, y, height, width);
              else if (
                discreateIndexes.includes(source) &&
                discreateIndexes.includes(target)
              ) {
                _this.drawDiscreteChart(item, source, target, svg, x, y);
              } else if (discreateIndexes.includes(source)) {
                let histogram = d3
                  .histogram()
                  .domain(y.domain())
                  .thresholds(y.ticks(yTick)) // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                  .value((d) => d);
                let disKinds = [];
                item.forEach((row) => {
                  if (!disKinds.includes(row[source]))
                    disKinds.push(row[source]);
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
              } else {
                let histogram = d3
                  .histogram()
                  .domain(x.domain())
                  .thresholds(x.ticks(xTick)) // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                  .value((d) => d);
                let disKinds = [];
                item.forEach((row) => {
                  if (!disKinds.includes(row[target]))
                    disKinds.push(row[target]);
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
            }
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