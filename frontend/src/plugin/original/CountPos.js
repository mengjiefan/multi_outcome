import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import dagre from "dagre-d3/lib/dagre";
import { countSimplePos } from "@/plugin/extracted/CountPos";
export const countSonPos = (outcome, variables, linksList) => {
    let g = new dagreD3.graphlib.Graph({ compound: true }).setGraph({
        ranker: "tight-tree",
    });
    let nodesList = [{
        type: 0,
        id: outcome
    }];

    g.setNode(outcome, { label: '', type: 0 })
    variables.forEach(function (state) {
        let node = {
            label: "",
            type: 1
        };
        nodesList.push({
            type: 1,
            id: state
        })
        g.setNode(state, node);
    });
    var edges = linksList;
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
                curve: d3.curveBasis,
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
        node.rx = node.ry = 20;
        node.style = "fill:black";
    });
    dagre.layout(g);

    let simplePos = countSimplePos(
        g,
        nodesList,
        linksList
    );
    linksList.forEach((link => {
        if (link.source === 'Sex' && link.target === 'Smoke')
            console.log(link)
        else if (link.source === 'Smoke' && link.target === 'Sex')
            console.log(link)
    }))
    return simplePos;
}