import * as joint from "jointjs";
import { ref } from "vue";
import "/node_modules/jointjs/dist/joint.css";
import * as d3 from "d3";
import svgPanZoom from "svg-pan-zoom";
import { g } from "jointjs";
const cmap = [
    "#FF595E",
    "#FF924C",
    "#FFCA3A",
    "#C5CA30",
    "#8AC926",
    "#36949D",
    "#1982C4",
    "#4267AC",
    "#565AA0",
    "#6A4C93",
];
let xGap = 40;
let yGap = 45;
const findLink = (links, edge) => {
    let index = links.findIndex(link => {
        if (link.source === edge.source && link.target === edge.target) return true;
        else if (link.source === edge.target && link.target === edge.source) return true;
        else return false;
    })
    return links[index];
}
const countXPos = (x) => {
    let start = 0;
    return start + x * xGap;
};

const countYPos = (y) => {
    let start = 20;
    return start + y * yGap;
};

const svgZoom = (name) => {
    /** 判断是否有节点需要渲染，否则svg-pan-zoom会报错。 */
    let svgZoom = svgPanZoom("#" + name + " svg", {
        /** 判断是否是节点的拖拽 */
        /** 是否可拖拽 */
        panEnabled: true,
        /** 是否可缩放 */
        zoomEnabled: true,
        /** 双击放大 */
        dblClickZoomEnabled: false,
        /** 可缩小至的最小倍数 */
        minZoom: 0.3,
        /** 可放大至的最大倍数 */
        maxZoom: 5,
        /** 是否自适应画布尺寸 */
        fit: false,
        /** 图是否居中 */
        center: false,
    });
    /** 手动设置缩放敏感度 */
    svgZoom.setZoomScaleSensitivity(0.5);

};
export const checkDirection = (source, target) => {
    if (source.y <= target.y) return "DOWN";
    else return "UP";
}
export const addHighLight = (elementView) => {
    joint.highlighters.mask.add(
        elementView,
        { selector: "root" },
        "my-element-highlight",
        {
            padding: 0,
            deep: true,
            attrs: {
                stroke: "#FF4365",
                "stroke-width": 3,
            },
        }
    );
}
export const removeHighLight = (elementView) => {
    const highlighter = joint.dia.HighlighterView.get(
        elementView,
        "my-element-highlight"
    );
    highlighter.remove();
}
export const drawSonCharts = (dom, nodesList, links, gap, sonindex, linksPos) => {
    let name = "paper" + (sonindex + 1);
    let linksList = links.filter(link => !link.hidden);
    linksList = linksList.map(link => {
        if (link.reverse) return {
            source: link.target,
            target: link.source,
            value: link.value,
            reverse: true
        };
        else return link;
    })
    xGap = gap.xGap;
    yGap = gap.yGap;
    let graph = new joint.dia.Graph({});

    let paper = new joint.dia.Paper({
        el: dom,
        model: graph,
        width: "100%",
        height: "100%",
        gridSize: 1,
        interactive: function (cellView, method) {
            return null
        }
    });
    let outRect = new joint.shapes.standard.Rectangle();
    outRect.position(
        countXPos(nodesList[0].x) - 16,
        countYPos(nodesList[0].y) - 16
    );
    outRect.resize(32, 32);
    outRect.attr({
        body: {
            fill: cmap[sonindex],
            strokeWidth: 0,
            rx: 20,
            ry: 20,
        },
        label: {
            text: nodesList[0].id,
            fill: "black",
            fontSize: 8,
            y: 0
        },
        title: nodesList[0].id
    });
    outRect.addTo(graph);
    nodesList[0]["node"] = outRect;
    for (let nodeI = 1; nodeI < nodesList.length; nodeI++) {
        let faRect = new joint.shapes.standard.Rectangle();

        faRect.resize(32, 32);
        faRect.position(
            countXPos(nodesList[nodeI].x) - 16,
            countYPos(nodesList[nodeI].y) - 16
        );
        let indexes = nodesList[nodeI].indexes;
        faRect.attr({
            body: {
                fill: indexes.length === 1 ? cmap[sonindex] : "url(#" + nodesList[nodeI].id.replaceAll("_", "") + ")",
                strokeWidth: 0,
                rx: 20,
                ry: 20,
            },
            label: {
                text: nodesList[nodeI].id,
                fill: "black",
                y: 0,
                fontSize: 8,
            },
            title: nodesList[nodeI].id
        });
        faRect.addTo(graph);
        nodesList[nodeI]["node"] = faRect;
    }
    linksList.forEach(link => {
        let points = findLink(linksPos, link);
        let path = new joint.shapes.standard.Link({
        });
        let vertices = [];
        for (let i = 0; i < points.points.length; i++) {
            let point = points.points[i];
            vertices.push(new g.Point(countXPos(point.x), countYPos(point.y)));
        }
        if (link.reverse) vertices.reverse();
        if (link.source.includes('fra') && link.target.includes('hear')) {
            console.log('draw', points.points)
        }
        if (link.value < 0)
            path.attr({
                id: '(' + link.source + ', ' + link.target + ')',
                line: {
                    strokeWidth: (-link.value * 10) + '',
                    strokeDasharray: "4 4",
                    targetMarker: { // minute hand
                        'type': 'path',
                        'stroke': 'black',
                        'stroke-width': 2,
                        'fill': 'transparent',
                        'd': 'M 10 -5 0 0 10 5 '
                    }
                }
            });
        else {
            path.attr({
                id: '(' + link.source + ', ' + link.target + ')',
                line: {
                    strokeWidth: (link.value * 10) + '',
                    targetMarker: { // minute hand
                        'type': 'path',
                        'stroke': 'black',
                        'stroke-width': 2,
                        'fill': 'transparent',
                        'd': 'M 10 -5 0 0 10 5 '
                    }
                }
            })
        }
        let sindex = nodesList.findIndex(item => {
            if (item.id === link.source) return true;
            else return false;
        })
        path.source(nodesList[sindex].node);
        let tindex = nodesList.findIndex(item => {
            if (item.id === link.target) return true;
            else return false;
        })
        path.target(nodesList[tindex].node);
        path.addTo(graph);
        if (nodesList[sindex].id.includes('fra') && nodesList[tindex].id.includes('base_by')) {
            path.vertices(vertices);
        }
        path.vertices(vertices);
        if (checkDirection(nodesList[sindex], nodesList[tindex]) === 'UP') {
            path.connector("rounded");
        } else {
            /*
            path.router('manhattan', {
                maxAllowedDirectionChange: 20,
                isPointObstacle: function (point) {
                }
            });
            path.connector("rounded");*/
        }
    })
    paper.on('link:mouseover', function (linkView) {

    });

    if (nodesList) {
        svgZoom(name);
    }
    return paper;
};