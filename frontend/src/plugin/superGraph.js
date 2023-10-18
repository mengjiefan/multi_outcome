import * as joint from "jointjs";
import "/node_modules/jointjs/dist/joint.css";
import { g } from "jointjs";
import * as d3 from "d3";
import svgPanZoom from "svg-pan-zoom";
//import { getAnchoredGraph } from "@/plugin/super/anchor.js";
import { LinksManagement } from "@/plugin/joint/linkAndNode.js";
import dagre from "dagre";

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
]
let gap = 1;
let startX;
let startY;
const countXPos = (x) => {
    return startX + x * gap;
};
const countYPos = (y) => {
    return startY + y * gap;
};
const countAnchor = (last, center, radius) => {
    let distance = Math.sqrt((center.x - last.x) * (center.x - last.x) + (center.y - last.y) * (center.y - last.y));
    let x = center.x + (last.x - center.x) * radius / distance;
    let y = center.y + (last.y - center.y) * radius / distance;
    return { x, y }
}
const addTool = (element, paper) => {
    function getMarkup(angle = 0) {
        return [
            {
                title: element.attr('title'),
                tagName: "circle",
                selector: "button",
                attributes: {
                    r: 5,
                    fill: 'transparent',
                    stroke: "transparent",
                    cursor: "pointer"
                }
            },
            {
                title: element.attr('title'),
                tagName: "path",
                selector: "icon",
                attributes: {
                    transform: `rotate(${angle})`,
                    d: "M -2 -1 L 0 -1 L 0 -2 L 2 0 L 0 2 0 1 -2 1 z",
                    fill: "#4666E5",
                    stroke: "none",
                    "stroke-width": 2,
                    "pointer-events": "none"
                }
            }
        ];
    }


    const connectBottom = new joint.elementTools.Connect({
        x: "50%",
        y: "100%",
        markup: getMarkup(90),
        magnet: 'body'
    });
    const connectTop = new joint.elementTools.Connect({
        x: "50%",
        y: "0%",
        markup: getMarkup(270),
        magnet: 'body'
    });
    const hoverButton = new joint.elementTools.HoverConnect({
        useModelGeometry: true,
        trackPath: (view) => {
            view.model.attr(['body', 'd'])
        }
    });

    const tools = new joint.dia.ToolsView({
        tools: [connectTop, connectBottom, hoverButton]
    });
    element.findView(paper).addTools(tools);
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
export const showHiddenEdge = (paper, orlink, scale, data) => {
    console.log(orlink)
    let link = orlink;
    if (link.reverse) {
        link = {
            source: link.target,
            target: link.source,
            value: link.value,
            points: link.points,
            reverse: true
        }
    }
    let path = new joint.shapes.standard.Link({});
    let vertices = [];
    for (let i = 0; i < link.points.length; i++) {
        let point = link.points[i];
        startX = scale.startX;
        startY = scale.startY;
        gap = scale.gap;
        vertices.push(
            new g.Point(countXPos(point.x), countYPos(point.y))
        );
    }
    if (link.reverse) vertices.reverse();
    let sindex = data.nodesList.findIndex((item) => {
        if (item.id === link.source) return true;
        else return false;
    });
    let tindex = data.nodesList.findIndex((item) => {
        if (item.id === link.target) return true;
        else return false;
    });
    let value = Math.abs(link.value);
    if (value > 1.2) value = 1.2;
    path.attr({
        id: "(" + link.source + ", " + link.target + ")",
        line: {
            strokeWidth: value * 8 + "",
            targetMarker: {
                // minute hand
                type: "path",
                stroke: "black",
                "stroke-width": value * 8,
                fill: "transparent",
                d: "M 10 -5 0 0 10 5 ",
            },
        },
    });
    if (link.value < 0) {
        path.attr("line/strokeDasharray", "4 4");
    }
    let realLink = LinksManagement.getNodeByName(paper, link);
    if (LinksManagement.isLinkDown(paper, link))
        path.attr("line/targetMarker", null);
    path.source(realLink.source);
    path.target(realLink.target);
    path.addTo(paper.model.attributes.cells.graph);
}
export const setSuperGraph = (g, data) => {
    var states = data.nodesList;
    var edges = data.linksList.filter(edge => !edge.add);
    states.forEach(function (state) {
        let node = {
            label: "",
            type: state.type,
            shape: "circle", // 设置节点形状为圆形
            width: 10,
            height: 10,
        };
        if (node.type === 0) node["index"] = state.index;
        g.setNode(state.id, node);
    });

    edges.forEach(function (edge) {
        let edgeValue = edge.value > 0 ? edge.value * 10 : -edge.value * 10;
        var valString = edgeValue.toString() + "px";
        var widthStr = "stroke-width: " + valString;
        var edgeColor = "stroke: black";
        let completeStyle =
            edgeColor + ";" + widthStr + ";" + "fill: transparent;";
        if (edge.hidden) {
            g.setEdge(edge.source, edge.target, {
                style:
                    "stroke: transparent; fill: transparent; opacity: 0;stroke-width:0",
            });
        } else {
            if (edge.value < 0) {
                completeStyle = completeStyle + "stroke-dasharray:4 4";
            }
            g.setEdge(edge.source, edge.target, {
                style: completeStyle,
                arrowhead: "undirected",
            });
        }
    });

    // Set some general styles
    g.nodes().forEach(function (v) {
        var node = g.node(v);
        node.style = "fill:" + cmap[0];
    });
    dagre.layout(g);
    //getAnchoredGraph(g, data);
}
export const drawSuperGraph = (dom, nodesList, links, scale) => {
    let name = "paper";
    startX = scale.startX;
    startY = scale.startY;
    gap = scale.gap;
    let linksList = links.filter(link => !link.hidden);
    linksList = linksList.map(link => {
        let points = link.points.concat([]);
        if (link.reverse) return {
            source: link.target,
            target: link.source,
            value: link.value,
            points: points.reverse(),
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
        async: true,
        linkPinning: false,
        sorting: joint.dia.Paper.sorting.APPROX,
        defaultLink: () => new joint.shapes.standard.Link(),
        connectionStrategy: joint.connectionStrategies.pinAbsolute,
        interactive: function (cellView, method) {
            return null
        },
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
                stroke: 'white',
                strokeDasharray: 2,
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
        if (nodesList[nodeI].type === 0) faRect.attr('body/strokeWidth', 3)
        console.log(indexes)
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
        addTool(faRect, paper)
    }
    var Gen = d3
        .line()
        .x((p) => p.x)
        .y((p) => p.y)
        .curve(d3.curveBasis);
    joint.connectors.curveBasis = function (sourcePoint, targetPoint, vertices, args) {
        let points = args.points.concat([]);
        if (points.length > 1) {
            points[0] = countAnchor(points[1], points[0], 6 * gap);
            points[points.length - 1] = countAnchor(points[points.length - 2], points[points.length - 1], 6 * gap)
        }

        return Gen(points);
    };
    linksList.forEach(link => {
        let path = new joint.shapes.standard.Link({
        });

        let sindex = nodesList.findIndex(item => {
            if (item.id === link.source) return true;
            else return false;
        })
        let tindex = nodesList.findIndex(item => {
            if (item.id === link.target) return true;
            else return false;
        })
        let value = Math.abs(link.value);
        if (value > 1.2) value = 1.2
        path.attr({
            id: '(' + link.source + ', ' + link.target + ')',
            line: {
                strokeWidth: (value * 8) + '',
                targetMarker: { // minute hand
                    'type': 'path',
                    'stroke': 'black',
                    'stroke-width': value * 8,
                    'fill': 'transparent',
                    'd': 'M 10 -5 0 0 10 5 '
                }
            }
        })
        if (link.value < 0) {
            path.attr('line/strokeDasharray', "4 4")
        }
        if (link.source === 'BMI' && link.target === 'Sex') console.log(link)
        if (nodesList[sindex].node.attributes.position.y < nodesList[tindex].node.attributes.position.y)
            path.attr('line/targetMarker', null)

        path.source(nodesList[sindex].node, {
            anchor: {
                name: 'center',
                args: {
                    rotate: true,
                    padding: 0
                }
            }
        });
        path.target(nodesList[tindex].node);
        path.addTo(graph);

        path.connector("curveBasis", {
            points: link.points.map(point => {
                return {
                    x: countXPos(point.x),
                    y: countYPos(point.y)
                }
            })
        });
    })

    if (nodesList) {
        svgZoom(name);
    }
    return paper;
};
export const drawExtractedGraph = (dom, nodesList, links, scale, sonindex) => {
    let name = "paper" + (sonindex + 1);
    let linksList = links.filter(link => !link.hidden);
    linksList = linksList.map(link => {
        if (!link.points)
            link.points = [];
        let points = link.points.concat([]);
        if (link.reverse) return {
            source: link.target,
            target: link.source,
            value: link.value,
            points: points.reverse()
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
        async: true,
        linkPinning: false,
        sorting: joint.dia.Paper.sorting.APPROX,
        defaultLink: () => new joint.shapes.standard.Link(),
        connectionStrategy: joint.connectionStrategies.pinAbsolute,
        interactive: function (cellView, method) {
            return null
        }
    });

    for (let nodeI = 0; nodeI < nodesList.length; nodeI++) {
        let faRect = new joint.shapes.standard.Rectangle();

        faRect.resize(24, 24);
        faRect.position(
            countXPos(nodesList[nodeI].x) - 12,
            countYPos(nodesList[nodeI].y) - 12
        );
        let indexes = nodesList[nodeI].indexes;
        faRect.attr({
            body: {
                strokeWidth: 0,
                stroke: 'white',
                strokeDasharray: 2,
                rx: 20,
                ry: 20,
                fill: 'transparent'
            },
            label: {
                text: nodesList[nodeI].id,
                fill: "black",
                y: 0,
                fontSize: 6,
            },
            title: nodesList[nodeI].id
        });
        if (nodesList[nodeI].type === 0) faRect.attr('body/strokeWidth', 3)
        for (let i = 0; i < indexes.length; i++) {
            let circle = new joint.shapes.standard.Circle();
            let offset = 360 / indexes.length;
            circle.attr({
                body: {
                    strokeDasharray: 12 * 3.1415926,
                    strokeDashoffset: 12 * 3.1415926 / 360 * (offset * i),
                    fill: "transparent",
                    stroke: cmap[indexes[i]],
                    strokeWidth: 12
                }
            })
            circle.resize(12, 12);
            circle.position(
                countXPos(nodesList[nodeI].x) - 6,
                countYPos(nodesList[nodeI].y) - 6,
            );
            circle.addTo(graph);
        }
        nodesList[nodeI]["node"] = faRect;
        faRect.addTo(graph);
        addTool(faRect, paper)
    }
    var Gen = d3
        .line()
        .x((p) => p.x)
        .y((p) => p.y)
        .curve(d3.curveBasis);
    joint.connectors.curveBasis = function (sourcePoint, targetPoint, vertices, args) {
        let points = args.points.concat([]);
        if (points.length > 1) {
            points[0] = countAnchor(points[1], points[0], 10);
            points[points.length - 1] = countAnchor(points[points.length - 2], points[points.length - 1], 10)
        }
        return Gen(points);
    };
    linksList.forEach(link => {
        let path = new joint.shapes.standard.Link({
        });
        let sindex = nodesList.findIndex(item => {
            if (item.id === link.source) return true;
            else return false;
        })
        let tindex = nodesList.findIndex(item => {
            if (item.id === link.target) return true;
            else return false;
        })
        let value = Math.abs(link.value);
        if (value > 1) value = 1;
        path.attr({
            id: '(' + link.source + ', ' + link.target + ')',
            line: {
                stroke: 'black',
                strokeWidth: (value * 8) + '',
                targetMarker: { // minute hand
                    'type': 'path',
                    'stroke': 'black',
                    'stroke-width': value * 7,
                    'fill': 'transparent',
                    'd': 'M 10 -5 0 0 10 5 '
                }
            }
        })
        if (link.value < 0) {
            path.attr('line/strokeDasharray', "4 4")
        }
        if (nodesList[sindex].node.attributes.position.y < nodesList[tindex].node.attributes.position.y)
            path.attr('line/targetMarker', null)
        path.source(nodesList[sindex].node);
        path.target(nodesList[tindex].node);
        path.addTo(graph);
        let points = link.points.map(point => {
            return {
                x: countXPos(point.x),
                y: countYPos(point.y)
            }
        });
        if (isNaN(points[0].y)) points[0] = {
            x: countXPos(nodesList[sindex].x),
            y: countYPos(nodesList[sindex].y)
        }
        if (isNaN(points[points.length - 1].y)) points[points.length - 1] = {
            x: countXPos(nodesList[tindex].x),
            y: countYPos(nodesList[tindex].y)
        }
        path.connector("curveBasis", {
            points
        });
    })

    if (nodesList) {
        svgZoom(name);
    }
    return paper;
};

