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