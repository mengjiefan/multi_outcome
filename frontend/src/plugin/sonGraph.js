import * as joint from "jointjs";
import { del, ref } from "vue";
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
const findLink = (links, edge) => {
    let index = links.findIndex(link => {
        if (link.source === edge.source && link.target === edge.target) return true;
        else if (link.source === edge.target && link.target === edge.source) return true;
        else return false;
    })
    return links[index];
}

const handleCellMouseWheel = (paper, x, y, delta) => {
    const oldScale = paper.scale().sx;
    const newScale = oldScale + delta * .1;
    scaleToPoint(newScale, x, y, paper);
};
let targetSvg = null;
let originalX = NaN;
let originalY = NaN;
const handleMouseMove = (paper, e, x, y) => {
    const translate = paper.translate();
    const nextTx = translate.tx + e.clientX - originalX;
    const nextTy = translate.ty + e.clientY - originalY;


    originalX = e.clientX;
    originalY = e.clientY;

    if (!targetSvg) targetSvg = e.target;
    if (targetSvg !== e.target) {
        return;
    }
    if (!isNaN(nextTx)) {
        paper.translate(nextTx, nextTy);
    }

}
const handleMouseUp = () => {
    originalX = NaN;
    originalY = NaN;
    targetSvg = null;
};
const scaleToPoint = (nextScale, x, y, paper) => {
    if (nextScale >= 0.3 && nextScale <= 5) {
        const currentScale = paper.scale().sx;

        const beta = currentScale / nextScale;

        const ax = x - (x * beta);
        const ay = y - (y * beta);

        const translate = paper.translate();

        const nextTx = translate.tx - ax * nextScale;
        const nextTy = translate.ty - ay * nextScale;

        paper.translate(nextTx, nextTy);

        const ctm = paper.matrix();

        ctm.a = nextScale;
        ctm.d = nextScale;

        paper.matrix(ctm);
    }
};


let gap = 72;
const countXPos = (x) => {
    return x * gap;
};
const countYPos = (y) => {
    return y * gap;
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
    /*
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
    );*/
    if (elementView.model.attributes.attrs.label.fontWeight !== 'bold') {
        elementView.model.attr('label/fontWeight', 'bold');
        elementView.model.attr('label/fontSize', elementView.model.attributes.attrs.label.fontSize + 1);
    }
}
export const removeHighLight = (elementView) => {
    /*
    const highlighter = joint.dia.HighlighterView.get(
        elementView,
        "my-element-highlight"
    );
    if (highlighter)
        highlighter.remove();
        */
    elementView.model.attr('label/fontWeight', 'normal');
    elementView.model.attr('label/fontSize', elementView.model.attributes.attrs.label.fontSize - 1);
}
export const drawSonCharts = (dom, nodesList, links, scale, sonindex, linksPos) => {
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
    let paperScale = scale.gap / gap;

    let startX = scale.startX;
    let startY = scale.startY;
    let graph = new joint.dia.Graph({});

    let paper = new joint.dia.Paper({
        el: dom,
        model: graph,
        width: "100%",
        height: "100%",
        drawGrid: true,
        gridSize: 12,
        interactive: function (cellView, method) {
            return null
        }
    });
    for (let nodeI = 0; nodeI < nodesList.length; nodeI++) {
        let faRect = new joint.shapes.standard.Rectangle();

        faRect.resize(32, 32);
        faRect.position(
            countXPos(nodesList[nodeI].x) - 16,
            countYPos(nodesList[nodeI].y) - 16
        );
        let indexes = nodesList[nodeI].indexes;
        faRect.attr({
            body: {
                strokeWidth: 0,
                rx: 20,
                ry: 20,
                fill: 'transparent'
            },
            label: {
                text: nodesList[nodeI].id,
                fill: "black",
                y: 0,
                fontSize: 10,
            },
            title: nodesList[nodeI].id
        });
        for (let i = 0; i < indexes.length; i++) {
            let circle = new joint.shapes.standard.Circle();
            let offset = 360 / indexes.length;
            circle.attr({
                body: {
                    strokeDasharray: 16 * 3.1415926,
                    strokeDashoffset: 16 * 3.1415926 / 360 * (offset * i),
                    fill: "transparent",
                    stroke: cmap[indexes[i]],
                    strokeWidth: 16
                }
            })
            circle.resize(16, 16);
            circle.position(
                countXPos(nodesList[nodeI].x) - 8,
                countYPos(nodesList[nodeI].y) - 8
            );
            circle.addTo(graph);
        }

        nodesList[nodeI]["node"] = faRect;

        faRect.addTo(graph);
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
        path.vertices(vertices);
        path.connector("rounded");
    })
    paper.scale(paperScale);
    paper.translate(startX, startY)

    paper.on('cell:mousewheel', function (cellView, evt, x, y, delta) {
        handleCellMouseWheel(paper, x, y, delta)
    });
    paper.on('link:mousewheel', function (linkView, evt, x, y, delta) {
        handleCellMouseWheel(paper, x, y, delta)
    });
    paper.on('element:mousewheel', function (elementView, evt, x, y, delta) {
        handleCellMouseWheel(paper, x, y, delta)
    });
    paper.on('blank:mousewheel', function (evt, x, y, delta) {
        handleCellMouseWheel(paper, x, y, delta)
    });

    paper.on("blank:pointermove", function (evt, x, y) {
        handleMouseMove(paper, evt, x, y);
    })
    paper.on("cell:pointermove", function (cellView, evt, x, y) {
        handleMouseMove(paper, evt, x, y);
    })

    paper.on("blank:pointerup", function (evt, x, y) {
        handleMouseUp();
    })
    paper.on("link:pointerup", function (linkView, evt, x, y) {
        handleMouseUp();
    })
    paper.on("cell:pointerup", function (cellView, evt, x, y) {
        handleMouseUp();
    })
    paper.on("element:pointerup", function (elementView, evt, x, y) {
        handleMouseUp();
    })
    if (nodesList) {
        //svgZoom(name);
    }
    return paper;
};