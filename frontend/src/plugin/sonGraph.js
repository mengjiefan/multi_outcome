import * as joint from "jointjs";
import { ref } from "vue";
import "/node_modules/jointjs/dist/joint.css";
import * as d3 from "d3";
import svgPanZoom from "svg-pan-zoom";
import { g } from "jointjs";

let xGap = 50;
let yGap = 45;

const countXPos = (x) => {
    let start = 50;
    return start + x * xGap;
};

const countYPos = (y) => {
    let start = 20;
    return start + y * yGap;
};
const tooltip = ref(null);

const tipVisible = (textContent, event) => {
    tooltip.value
        .transition()
        .duration(0)
        .style("opacity", 1)
        .style("display", "block");
    tooltip.value
        .html(textContent)
        .style("left", `${event.pageX}px`)
        .style("top", `${event.pageY}px`);
};
const tipHidden = () => {
    tooltip.value
        .transition()
        .duration(100)
        .style("opacity", 0)
        .style("display", "none");
}
const createTooltip = () => {
    return d3
        .select("body")
        .append("div")
        .classed("tooltip", true)
        .style("opacity", 0)
        .style("display", "none")
        .style("background", "rgba(0, 0, 0, 0.85)")
        .style("color", "white")
        .style("padding", "4px 16px 4px 16px");
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
export const extractSonCharts = () => {

}
export const drawSonCharts = (dom, nodesList, linksList, gap, name) => {
    linksList = linksList.filter(link => !link.hidden);
    linksList = linksList.map(link => {
        if (link.reverse) return {
            source: link.target,
            target: link.source,
            value: link.value
        };
        else return link;
    })
    xGap = gap.xGap;
    yGap = gap.yGap;
    tooltip.value = createTooltip();
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
        countXPos(nodesList[0].x),
        countYPos(nodesList[0].y)
    );
    outRect.resize(nodesList[0].id.length * 10, 28);
    outRect.attr({
        body: {
            fill: "#f77",
            strokeWidth: 0,
            rx: 5,
            ry: 5,
        },
        label: {
            text: nodesList[0].id,
            fill: "white",
        },
        title: nodesList[0].id
    });
    outRect.addTo(graph);
    nodesList[0]["node"] = outRect;
    for (let nodeI = 1; nodeI < nodesList.length; nodeI++) {
        let faRect = new joint.shapes.standard.Rectangle();
        faRect.position(
            countXPos(nodesList[nodeI].x),
            countYPos(nodesList[nodeI].y)
        );
        faRect.resize(nodesList[nodeI].id.length * 10, 28);
        faRect.attr({
            body: {
                fill: nodesList[nodeI].type === -1 ? "#1f77b4" : "black",
                strokeWidth: 0,
                rx: 5,
                ry: 5,
            },
            label: {
                text: nodesList[nodeI].id,
                fill: "white",
            },
            title: nodesList[nodeI].id
        });
        faRect.addTo(graph);
        nodesList[nodeI]["node"] = faRect;
    }
    linksList.forEach(link => {
        var path = new joint.shapes.standard.Link({
        });
        if (link.value < 0)
            path.attr({
                id: '(' + link.source + ', ' + link.target + ')',
                line: {
                    strokeWidth: (-link.value * 10) + '',
                    strokeDasharray: "4 4",
                }
            })
        else {
            path.attr({
                id: '(' + link.source + ', ' + link.target + ')',
                line: {
                    strokeWidth: (link.value * 10) + '',
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
        //path.connector("curve");

        //path.router('metro')
        //path.connector("rounded");
    })
    /*
    let removeButton = new joint.linkTools.Remove();
    let toolsView = new joint.dia.ToolsView({
        tools: [
            removeButton
        ]
    })
    paper.on('link:mouseenter', function(linkView) {
        linkView.addTools(toolsView);
    });
    */
    paper.on('link:mouseleave', function (linkView) {
        linkView.removeTools();
    });
    paper.on('element:mouseover', function (elementView, evt) {
        //tipHidden();
        joint.highlighters.mask.add(elementView, { selector: 'root' }, 'my-element-highlight', {
            padding: 0,
            deep: true,
            attrs: {
                'stroke': '#FF4365',
                'stroke-width': 3
            }
        });
        //var currentElement = elementView.model;
        //let name = currentElement.attributes.attrs.title;
        //tipVisible(name, evt)
    });
    paper.on('element:mouseout', function (elementView, evt) {
        const highlighter = joint.dia.HighlighterView.get(elementView, 'my-element-highlight');
        highlighter.remove();
        //tipHidden();
    });
    if (nodesList) {
        svgZoom(name);
    }
    return paper;
};