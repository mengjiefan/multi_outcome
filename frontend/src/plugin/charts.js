import * as echarts from "echarts";
//import { nodeRequest } from "@/plugin/request/node";
const tooltip = {
  trigger: "axis",
  axisPointer: {
    type: "shadow",
  },
};
const grid = {
  left: "0%",
  right: "12%",
  bottom: "3%",
  top: "6%",
  containLabel: true,
};
export const createChart = (dom, values) => {
  echarts.dispose(dom);
  var myChart = echarts.init(dom);

  let axis = values.map((value) => value.id);
  let data = values.map((value) => value.value);
  let option = {
    grid,
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: axis,
    },
    yAxis: {
      type: "value",
    },
    visualMap: {
      type: "piecewise",
      show: false,
      dimension: 0,
      seriesIndex: 0,
      pieces: [
        {
          gt: 1,
          lt: 3,
          color: "rgba(0, 0, 180, 0.4)",
        },
        {
          gt: 5,
          lt: 7,
          color: "rgba(0, 0, 180, 0.4)",
        },
      ],
    },
    series: [
      {
        type: "line",
        smooth: 0.6,
        symbol: "none",
        lineStyle: {
          color: "#5470C6",
          width: 5,
        },
        areaStyle: {},
        data,
      },
    ],
  };
  myChart.setOption(option);
};
export const creatAllChart = (dom, data) => {
  echarts.dispose(dom);
  var myChart = echarts.init(dom);
  let option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        let str =
          "<b>" +
          params[0].marker +
          data.axis[params[0].dataIndex] +
          "</b>" +
          "<hr/>" +
          data.value[params[0].dataIndex].toFixed(3);

        return str;
      },
    },
    grid,
    xAxis: {
      type: "category",
      data: data.axis,
      axisLabel: {
        show: false,
      },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: data.value.map((value) => Math.abs(value).toFixed(3)),
        type: "bar",
        itemStyle: {
          normal: {
            color: function (params) {
              if (data.value[params.dataIndex] >= 0) return "#3182bd";
              else return "#ffbb78";
            },
          },
        },
      },
    ],
  };
  myChart.setOption(option);
};
export const createCharts = (id, dom, data) => {
  echarts.dispose(dom);
  var myChart = echarts.init(dom);
  if (id === "Sex" || id === "a1_sex")
    createChartOfInter(myChart, data, ["", "male", "female"]);
  else if (id === "Age" || id === "trueage") {
    createAgeRangeChart(myChart, data);
  } else if (id === "Insomnia") {
    createChartOfInter(myChart, data, ["Rarely", "Sometimes", "Usually"]);
  } else if (id === "Sleep duration") {
    createChartWithIBound(myChart, data, [6, 9, 12], false, false, "hour");
  } else if (id === "BMI") createBMIChart(myChart, data);
  else if (id === "BMI_cate")
    createChartOfInter(myChart, data, ["18.5-23.9", "<18.5", "24-27.9", "≥28"]);
  else if (id === "frailty_base_tri")
    createChartOfInter(myChart, data, ["no frailty", "pre-frailty", "frailty"]);
  else if (id === "residenc_byte")
    createChartOfInter(myChart, data, ["", "city", "rural"]);
  else if (id === "f64_sum")
    createChartOfInter(myChart, data, [
      "no",
      "public or urban",
      "new rural",
      "social or commercial",
    ]);
  else if (id === "a51_byte")
    createChartOfInter(myChart, data, ["family or institutes", "live alone"]);
  else if (id === "f31_sum")
    createChartOfInter(myChart, data, [
      "",
      "pension",
      "spouse or child",
      "relatives",
      "work by self",
      "government",
    ]);
  else if (id === "f5_whocaresick")
    createChartOfInter(myChart, data, [
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
    ]);
  else if (id === "g511_sbp")
    createChartWithIBound(
      myChart,
      data,
      [90, 120, 130, 140, 160, 180],
      true,
      true,
      "mmHg"
    );
  else if (id === "g521_dbp")
    createChartWithIBound(
      myChart,
      data,
      [60, 80, 85, 90, 100, 110],
      true,
      true,
      "mmHg"
    );
  else if (id === "g71_hr")
    createChartWithIBound(
      myChart,
      data,
      [55, 67, 74, 80, 88, 100],
      false,
      true,
      "bpm"
    );
  else if (id === "age_group_decade")
    createChartOfInter(myChart, data, ["<65", "65-79", "80-89", "≥90"]);
  /*else if (id === 'follow_dura') {
        let max = 0;
        data.forEach(one => {
            if (one > max) max = one;
        })
        createChartOfIGap(myChart, data, 30, 0, Math.ceil(max / 30));
    }*/ else {
    creatAllRangeChart(myChart, data);
  }
};
const createBMIChart = (myChart, data) => {
  let boundary = [18.5, 23.9, 27.9];
  let number = [0, 0, 0, 0];
  data.forEach((one) => {
    if (one < boundary[0]) number[0]++;
    else if (one <= boundary[1]) number[1]++;
    else if (one <= boundary[2]) number[2]++;
    else number[3]++;
  });
  const option = {
    tooltip,
    grid,
    xAxis: {
      type: "category",
      data: ["<18.5", "18.5-23.9", "24-27.9", ">=28"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: number,
        type: "bar",
      },
    ],
  };
  myChart.setOption(option);
};
const createAgeRangeChart = (myChart, data) => {
  let min = 100;
  let max = 0;

  data.forEach((one) => {
    if (one > max) max = one;
    if (one < min) min = one;
  });
  max = Math.ceil(max / 10);
  min = Math.floor(min / 10);
  min = min * 10;
  max = max * 10;
  let axis = [];
  let number = [];
  while (min < max) {
    axis.push(min + "~" + (min + 9));
    let ans = data.filter((one) => one < min + 10 && one >= min);
    number.push(ans.length);
    min = min + 10;
  }
  let more = data.filter((one) => one === max);
  number[number.length - 1] = number[number.length - 1] + more.length;
  axis[axis.length - 1] = max - 10 + "~" + max;
  const option = {
    tooltip,
    grid,
    xAxis: {
      type: "category",
      data: axis,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: number,
        type: "bar",
      },
    ],
  };
  myChart.setOption(option);
};
const creatAllRangeChart = (myChart, data) => {
  let ifFloat = false;
  let max = -100;
  let min = 1000;
  data.forEach((one) => {
    if (!Number.isInteger(one)) ifFloat = true;
    if (one > max) max = one;
    if (one < min) min = one;
  });
  if (!ifFloat && max === 1 && min === 0)
    createChartOfInter(myChart, data, ["no", "yes"]);
  else if (!ifFloat && max - min < 10) createChart1(myChart, data);
  else if (!ifFloat) {
    createChart2(myChart, data);
  } else if (max - min < 0.15) createChart3(myChart, data);
  else createChart4(myChart, data);
};
const traversal = (list, number, value) => {
  if (list.includes(value)) return;
  let i;
  for (i = 0; i < list.length; i++) {
    if (value < list[i]) {
      if (i === 0) {
        list.unshift(value);
        number.unshift(1);
        break;
      } else {
        list.splice(i, 0, value);
        number.splice(i, 0, 1);
        break;
      }
    }
  }
  if (i === list.length) {
    list.push(value);
    number.push(1);
  }
};
const createChart1 = (myChart, data) => {
  let axis = [];
  let value = [];
  data.forEach((one) => {
    if (!axis.includes(one)) {
      traversal(axis, value, one);
    } else {
      let index = axis.indexOf(one);
      value[index] = value[index] + 1;
    }
  });
  const option = {
    tooltip,
    grid,
    xAxis: {
      type: "category",
      data: axis,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        barWidth: 75 / axis.length,
        data: value,
        type: "bar",
      },
    ],
  };
  myChart.setOption(option);
};
const createChart2 = (myChart, data) => {
  let max = -100;
  let min = 1000;
  data.forEach((one) => {
    if (one > max) max = one;
    if (one < min) min = one;
  });
  max = Math.ceil(max / 5);
  min = Math.floor(min / 5);
  min = min * 5;
  max = max * 5;
  let gap = (max - min) / 5;
  createChartOfIGap(myChart, data, gap, min, max);
};
const createChart3 = (myChart, data) => {
  let max = -100;
  let min = 1000;
  data.forEach((one) => {
    if (one > max) max = one;
    if (one < min) min = one;
  });
  max = Math.ceil(max / 0.02);
  min = Math.floor(min / 0.02);
  max = parseFloat(max.toFixed(2));
  min = parseFloat(min.toFixed(2));
  min = min * 0.02;
  max = max * 0.02;
  createChartOfGap(myChart, data, 0.02, min, max);
};
const createChart4 = (myChart, data) => {
  let max = -100;
  let min = 1000;
  data.forEach((one) => {
    if (one > max) max = one;
    if (one < min) min = one;
  });
  let gap = (max - min) / 10;
  createChartOfGap(myChart, data, gap, min, max);
};
const createChartOfGap = (myChart, data, gap, min, max) => {
  let axis = [];
  let number = [];
  while (min < max) {
    let high = min + gap - 0.01;
    high = high.toFixed(2);
    axis.push(min + "~" + high);
    let ans = data.filter((one) => one < min + gap && one >= min);
    number.push(ans.length);
    min = min + gap;
    min = parseFloat(min.toFixed(2));
  }
  let more = data.filter((one) => one === max);
  number[number.length - 1] = number[number.length - 1] + more.length;
  axis[axis.length - 1] = (max - gap).toFixed(2) + "~" + max;
  const option = {
    tooltip,
    grid,
    xAxis: {
      type: "category",
      data: axis,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        barCategoryGap: 0,
        data: number,
        type: "bar",
      },
    ],
  };
  myChart.setOption(option);
};
const createChartOfIGap = (myChart, data, gap, min, max) => {
  let axis = [];
  let number = [];
  while (min < max) {
    let high = min + gap - 1;
    axis.push(min + "~" + high);
    let ans = data.filter((one) => one < min + gap && one >= min);
    number.push(ans.length);
    min = min + gap;
  }
  let more = data.filter((one) => one === max);
  number[number.length - 1] = number[number.length - 1] + more.length;
  axis[axis.length - 1] = (max - gap).toFixed(2) + "~" + max;
  const option = {
    tooltip,
    grid,
    xAxis: {
      type: "category",
      data: axis,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        barWidth: 75 / axis.length,
        data: number,
        type: "bar",
      },
    ],
  };
  myChart.setOption(option);
};
const createChartOfInter = (myChart, data, labels) => {
  let values = [];
  for (let i = 0; i < labels.length; i++) {
    if (labels[i]) {
      values.push({
        label: labels[i],
        number: i,
        count: 0,
      });
    }
  }
  console.log(values);
  data.forEach((one) => {
    let index = values.findIndex((value) => {
      if (value.number === one) return true;
      else return false;
    });
    if (index < 0) console.log(one);
    values[index].count++;
  });
  const option = {
    tooltip,
    grid,
    xAxis: {
      type: "category",
      data: values.map((value) => {
        return value.label;
      }),
      axisLabel: {
        fontSize: 9, // 设置字体大小
      }
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        barWidth: 75 / values.length,
        data: values.map((value) => {
          return value.count;
        }),
        type: "bar",
      },
    ],
  };
  myChart.setOption(option);
};
const createChartWithIBound = (
  myChart,
  data,
  boundaries,
  ifEqul,
  nogap,
  name
) => {
  let number = [];
  let axis = [];
  axis.push("<" + boundaries[0]);
  for (let i = 1; i < boundaries.length; i++)
    axis.push(boundaries[i - 1] + "~" + (boundaries[i] - 1));
  if (ifEqul) axis.push("≥" + boundaries[boundaries.length - 1]);
  else {
    axis[axis.length - 1] =
      boundaries[boundaries.length - 2] +
      "~" +
      boundaries[boundaries.length - 1];
    axis.push(">" + boundaries[boundaries.length - 1]);
  }
  for (let i = 0; i <= boundaries.length; i++) number.push(0);

  data.forEach((one) => {
    let i;
    for (i = 0; i < boundaries.length; i++) {
      if (one < boundaries[i]) break;
    }
    if (one === boundaries[boundaries.length - 1] && !ifEqul) {
      number[boundaries.length - 1]++;
    } else number[i]++;
  });
  let option = {
    tooltip,
    grid,
    xAxis: {
      type: "category",
      data: axis,
    },
    yAxis: {
      type: "value",
      name: name,
    },
    series: [
      {
        data: number,
        type: "bar",
      },
    ],
  };
  if (nogap) option.series[0]["barCategoryGap"] = 0;
  else option.series["barWidth"] = 75 / axis.length;
  myChart.setOption(option);
};
