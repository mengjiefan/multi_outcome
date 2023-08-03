import * as echarts from "echarts";
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
        xAxis: {
            type: 'category',
            data: ['Male', 'Female']
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
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
    min = min.ceil(min / 10);
    let axis = [];
    let number = [];
    while (min < max) {
        axis.push(min);
        let ans = data.filter(one => one < min + 10 && one >= min);
        number.push(ans.length)
        min = min + 10;
    }
    let more = data.filter(one => one === max);
    number[number.length - 1] = number[number.length - 1] + more.length;
    const option = {
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
    
}