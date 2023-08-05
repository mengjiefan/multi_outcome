import * as echarts from "echarts";
const tooltip = {
    trigger: 'axis',
    axisPointer: {
        type: 'shadow'
    }
};
const grid = {
    left: '0%',
    right: '0%',
    bottom: '8%',
    top: '6%',
    containLabel: true
};
export const createChart = (dom, line) => {
    echarts.dispose(dom);
    var myChart = echarts.init(dom);

    let option = {
        xAxis: {
            type: "category",
            boundaryGap: false,
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
                markLine: {
                    symbol: ["none", "none"],
                    label: { show: false },
                    data: [{ xAxis: 1 }, { xAxis: 3 }, { xAxis: 5 }, { xAxis: 7 }],
                },
                areaStyle: {},
                data: [
                    ["1", 200],
                    ["2", 560],
                    ["3", 750],
                    ["4", 580],
                ],
            },
        ],
    };
    myChart.setOption(option);
}
export const createSexRangeChart = (dom, data) => {
    echarts.dispose(dom);
    var myChart = echarts.init(dom);
    let male = 0;
    let female = 0;
    data.forEach(one => {
        if (one === 1) male++;
        else female++;
    })
    const option = {
        tooltip,
        grid,
        xAxis: {
            type: 'category',
            data: ['Male', 'Female']
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                barWidth: 100,
                data: [male, female],
                type: 'bar'
            }
        ]
    };
    myChart.setOption(option);
}
export const createAgeRangeChart = (dom, data) => {
    echarts.dispose(dom);
    var myChart = echarts.init(dom);
    let min = 200;
    let max = 0;

    data.forEach(one => {
        if (one > max) max = one;
        if (one < min) min = one;
    })
    max = Math.ceil(max / 10);
    min = Math.floor(min / 10);
    min = min * 10;
    max = max * 10;
    let axis = [];
    let number = [];
    while (min < max) {
        axis.push(min + '~' + (min + 9));
        let ans = data.filter(one => one < min + 10 && one >= min);
        number.push(ans.length)
        min = min + 10;
    }
    let more = data.filter(one => one === max);
    number[number.length - 1] = number[number.length - 1] + more.length;
    axis[axis.length - 1] = (max - 10) + '~' + max;
    const option = {
        tooltip,
        grid,
        xAxis: {
            type: 'category',
            data: axis
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                data: number,
                type: 'bar'
            }
        ]
    };
    myChart.setOption(option);
}
export const creatAllRangeChart = (dom, data) => {
    echarts.dispose(dom);
    var myChart = echarts.init(dom);
    let ifFloat = false;
    let max = -100;
    let min = 1000;
    data.forEach(one => {
        if (!Number.isInteger(one))
            ifFloat = true;
        if (one > max) max = one;
        if (one < min) min = one;
    })
    if (!ifFloat && max - min < 10)
        createChart1(myChart, data);
    else if (!ifFloat) {
        createChart2(myChart, data);
    } else if (max - min < 0.15)
        createChart3(myChart, data);
    else
        createChart4(myChart, data);
}
const traversal = (list, number, value) => {
    if (list.includes(value)) return list;
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
}
const createChart1 = (myChart, data) => {
    let axis = [];
    let value = [];
    data.forEach(one => {
        if (!axis.includes(one)) {
            traversal(axis, value, one)
        } else {
            let index = axis.indexOf(one);
            value[index] = value[index]++;
        }
    });
    const option = {
        tooltip,
        grid,
        xAxis: {
            type: 'category',
            data: axis
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                barWidth: 200 / (axis.length),
                data: value,
                type: 'bar'
            }
        ]
    };
    myChart.setOption(option);
}
const createChart2 = (myChart, data) => {
    let max = -100;
    let min = 1000;
    data.forEach(one => {
        if (one > max) max = one;
        if (one < min) min = one;
    });
    max = Math.ceil(max / 5);
    min = Math.floor(min / 5);
    min = min * 5;
    max = max * 5;
    let gap = (max - min) / 5;
    let axis = [];
    let number = [];
    while (min < max) {
        axis.push(min + '~' + (min + gap - 1));
        let ans = data.filter(one => one < min + gap && one >= min);
        number.push(ans.length)
        min = min + gap;
    }
    let more = data.filter(one => one === max);
    number[number.length - 1] = number[number.length - 1] + more.length;
    axis[axis.length - 1] = (max - gap) + '~' + max;
    const option = {
        tooltip,
        grid,
        xAxis: {
            type: 'category',
            data: axis
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                barWidth: 200/axis.length,
                data: number,
                type: 'bar'
            }
        ]
    };
    myChart.setOption(option);
}
const createChart3 = (myChart, data) => {
    let max = -100;
    let min = 1000;
    data.forEach(one => {
        if (one > max) max = one;
        if (one < min) min = one;
    });
    max = Math.ceil(max / 0.02);
    min = Math.floor(min / 0.02);
    min = min * 0.02;
    max = max * 0.02;
    let axis = [];
    let number = [];
    while (min < max) {
        axis.push(min + '~' + (min + 0.01));
        let ans = data.filter(one => one < min + 0.02 && one >= min);
        number.push(ans.length)
        min = min + 0.02;
    }
    let more = data.filter(one => one === max);
    number[number.length - 1] = number[number.length - 1] + more.length;
    axis[axis.length - 1] = (max - 0.02) + '~' + max;
    const option = {
        tooltip,
        grid,
        xAxis: {
            type: 'category',
            data: axis
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                data: number,
                type: 'bar'
            }
        ]
    };
    myChart.setOption(option);
}
const createChart4 = (myChart, data) => {
    let max = -100;
    let min = 1000;
    data.forEach(one => {
        if (one > max) max = one;
        if (one < min) min = one;
    });
    max = Math.ceil(max / 0.05);
    min = Math.floor(min / 0.05);
    min = min * 0.05;
    max = max * 0.05;
    let gap = (max - min) / 5;
    let axis = [];
    let number = [];
    while (min < max) {
        axis.push(min + '~' + (min + gap - 0.01));
        let ans = data.filter(one => one < min + gap && one >= min);
        number.push(ans.length)
        min = min + gap;
    }
    let more = data.filter(one => one === max);
    number[number.length - 1] = number[number.length - 1] + more.length;
    axis[axis.length - 1] = (max - gap) + '~' + max;
    const option = {
        tooltip,
        grid,
        xAxis: {
            type: 'category',
            data: axis
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                data: number,
                type: 'bar'
            }
        ]
    };
    myChart.setOption(option);
}