import * as joint from "jointjs";
import "/node_modules/jointjs/dist/joint.css";
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
let gap = 1;
let startX;
let startY;
const countXPos = (x) => {
    return startX + x * gap;
};
const countYPos = (y) => {
    return startY + y * gap;
};

const checkDirection = (source, target) => {
    if (source.y <= target.y) return "DOWN";
    else return "UP";
}
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
export const drawSuperGraph = (dom, nodesList, links, scale) => {
    let name = "paper";
    startX = scale.startX;
    startY = scale.startY;
    gap = scale.gap;
    let linksList = links.filter(link => !link.hidden);
    linksList = linksList.map(link => {
        if (link.reverse) return {
            source: link.target,
            target: link.source,
            value: link.value,
            points: link.points,
            reverse: true
        };
        else return link;
    })
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

    for (let nodeI = 0; nodeI < nodesList.length; nodeI++) {
        let faRect = new joint.shapes.standard.Rectangle();

        faRect.resize(24 * gap, 24 * gap);
        faRect.position(
            countXPos(nodesList[nodeI].x) - 12 * gap,
            countYPos(nodesList[nodeI].y) - 12 * gap
        );
        let indexes = nodesList[nodeI].indexes;
        faRect.attr({
            body: {
                strokeWidth: 0,
                rx: 20 * gap,
                ry: 20 * gap,
                fill: 'transparent'
            },
            label: {
                text: nodesList[nodeI].id,
                fill: "black",
                y: 0,
                fontSize: 6 * gap,
            },
            title: nodesList[nodeI].id
        });
        for (let i = 0; i < indexes.length; i++) {
            let circle = new joint.shapes.standard.Circle();
            let offset = 360 / indexes.length;
            circle.attr({
                body: {
                    strokeDasharray: 12 * gap * 3.1415926,
                    strokeDashoffset: 12 * gap * 3.1415926 / 360 * (offset * i),
                    fill: "transparent",
                    stroke: cmap[indexes[i]],
                    strokeWidth: 12 * gap
                }
            })
            circle.resize(12 * gap, 12 * gap);
            circle.position(
                countXPos(nodesList[nodeI].x) - 6 * gap,
                countYPos(nodesList[nodeI].y) - 6 * gap
            );
            circle.addTo(graph);
        }
        nodesList[nodeI]["node"] = faRect;
        faRect.addTo(graph);
    }
    linksList.forEach(link => {
        let path = new joint.shapes.standard.Link({
        });
        let vertices = [];
        for (let i = 0; i < link.points.length; i++) {
            let point = link.points[i];
            vertices.push(new g.Point(countXPos(point.x), countYPos(point.y)));
        }
        if (link.reverse) vertices.reverse();
        let sindex = nodesList.findIndex(item => {
            if (item.id === link.source) return true;
            else return false;
        })
        let tindex = nodesList.findIndex(item => {
            if (item.id === link.target) return true;
            else return false;
        })
        path.attr({
            id: '(' + link.source + ', ' + link.target + ')',
            line: {
                strokeWidth: (link.value * 8) + '',
                targetMarker: { // minute hand
                    'type': 'path',
                    'stroke': 'black',
                    'stroke-width': 2,
                    'fill': 'transparent',
                    'd': 'M 10 -5 0 0 10 5 '
                }
            }
        })
        if (link.value < 0) {
            path.attr('line/strokeWidth', (-link.value * 8) + '')
            path.attr('line/strokeDasharray', "4 4")
        }
        if (nodesList[sindex].node.attributes.position.y < nodesList[tindex].node.attributes.position.y)
            path.attr('line/targetMarker', null)

        path.source(nodesList[sindex].node);
        path.target(nodesList[tindex].node);
        path.addTo(graph);
        path.vertices(vertices);
        if (checkDirection(nodesList[sindex], nodesList[tindex]) === 'UP') {
            path.connector("rounded");
        }
    })

    if (nodesList) {
        svgZoom(name);
    }
    return paper;
};
export const drawExtractedGraph = (dom, nodesList, links, scale, sonindex) => {
    let name = "paper" + (sonindex + 1);
    let linksList = links.map(link => {
        if (link.reverse) return {
            source: link.target,
            target: link.source,
            value: link.value,
            points: link.points,
            reverse: true
        };
        else return link;
    })
    let graph = new joint.dia.Graph({});
    gap = scale.gap;
    startX = scale.startX;
    startY = scale.startY;
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

    for (let nodeI = 0; nodeI < nodesList.length; nodeI++) {
        let faRect = new joint.shapes.standard.Rectangle();

        faRect.resize(24 * gap, 24 * gap);
        faRect.position(
            countXPos(nodesList[nodeI].x) - 12 * gap,
            countYPos(nodesList[nodeI].y) - 12 * gap
        );
        let indexes = nodesList[nodeI].indexes;
        faRect.attr({
            body: {
                strokeWidth: 0,
                rx: 20 * gap,
                ry: 20 * gap,
                fill: 'transparent'
            },
            label: {
                text: nodesList[nodeI].id,
                fill: "black",
                y: 0,
                fontSize: 6 * gap,
            },
            title: nodesList[nodeI].id
        });
        for (let i = 0; i < indexes.length; i++) {
            let circle = new joint.shapes.standard.Circle();
            let offset = 360 / indexes.length;
            circle.attr({
                body: {
                    strokeDasharray: 12 * gap * 3.1415926,
                    strokeDashoffset: 12 * gap * 3.1415926 / 360 * (offset * i),
                    fill: "transparent",
                    stroke: cmap[indexes[i]],
                    strokeWidth: 12 * gap
                }
            })
            circle.resize(12 * gap, 12 * gap);
            circle.position(
                countXPos(nodesList[nodeI].x) - 6 * gap,
                countYPos(nodesList[nodeI].y) - 6 * gap,
            );
            circle.addTo(graph);
        }
        if (sonindex === 0)
            console.log(faRect)
        nodesList[nodeI]["node"] = faRect;

        faRect.addTo(graph);
    }
    linksList.forEach(link => {
        let points = link.points;
        let path = new joint.shapes.standard.Link({
        });
        let vertices = [];
        for (let i = 0; i < points.length; i++) {
            let point = points[i];
            vertices.push(new g.Point(countXPos(point.x), countYPos(point.y)));
        }
        if (link.reverse) vertices.reverse();
        let sindex = nodesList.findIndex(item => {
            if (item.id === link.source) return true;
            else return false;
        })
        let tindex = nodesList.findIndex(item => {
            if (item.id === link.target) return true;
            else return false;
        })
        path.attr({
            id: '(' + link.source + ', ' + link.target + ')',
            line: {
                stroke: 'black',
                strokeWidth: (link.value * 8 * gap) + '',
                targetMarker: { // minute hand
                    'type': 'path',
                    'stroke': 'black',
                    'stroke-width': Math.abs(link.value) * 7 * gap,
                    'fill': 'transparent',
                    'd': 'M 10 -5 0 0 10 5 '
                }
            }
        })
        if (link.value < 0) {
            path.attr('line/strokeWidth', (-link.value * 8 * gap) + '')
            path.attr('line/strokeDasharray', "4 4")
        }
        if (nodesList[sindex].node.attributes.position.y < nodesList[tindex].node.attributes.position.y)
            path.attr('line/targetMarker', null)

        path.source(nodesList[sindex].node);
        path.target(nodesList[tindex].node);
        path.addTo(graph);
        path.vertices(vertices);
        if (checkDirection(nodesList[sindex], nodesList[tindex]) === 'UP') {
            path.connector("rounded");
        }
    })

    if (nodesList) {
        svgZoom(name);
    }
    return paper;
};
