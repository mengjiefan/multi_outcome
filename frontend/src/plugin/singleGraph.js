import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import dagre from "dagre-d3/lib/dagre";
import { ref } from 'vue'
const cmap = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
];

const exist = (links, link) => {
    let index = links.findIndex(path => {
        if (path.source === link.source && link.target === path.target && !path.hidden) return true;
        else if (path.source === link.target && path.target === link.source && !path.hidden) return true;
        else return false;
    })
    return index;
}

const sonGraph = ref(null);
export default {
    linksList: [],
    setSingleGraph(svg, multipleSearchValue, selection, size) {
        this.addArrowType(svg)
        sonGraph.value = this;
        var data = multipleSearchValue;
        var states = data.nodesList;
        svg.select("g").selectAll("*").remove();
        // {
        let g = new dagreD3.graphlib.Graph({ compound: true }).setGraph({
            ranker: "tight-tree",
        });

        // Automatically label each of the nodes
        states.forEach(function (state) {
            let node = {
                label: state.id,
                type: state.type,
            };
            if (node.type === 0) node["index"] = state.index;
            g.setNode(state.id, node);
        });
        g.setNode("group", {
            label: "",
            clusterLabelPos: "bottom",
            style:
                "stroke-width:0;stroke:transparent;fill: transparent;opacity: 0;",
        });
        states.forEach(function (state) {
            if (state.type === -1) {
                g.setParent(state.id, "group");
            }
        });
        var edges = data.linksList;
        edges.forEach(function (edge) {
            var valString = (edge.value * 10).toString() + "px";
            var widthStr = "stroke-width: " + valString;
            var edgeColor = "stroke: black";
            let completeStyle =
                edgeColor + ";" + widthStr + ";" + "fill: transparent;";
            let index = exist(selection.linksList, edge)
            if (index < 0) {//子图中不存在或隐藏
                g.setEdge(edge.source, edge.target, {
                    style:
                        "stroke: transparent; fill: transparent; opacity: 0;stroke-width:0",
                    curve: d3.curveBasis,
                    arrowhead: "undirected",
                });
            } else {
                edge = selection.linksList[index];
                if (edge.reverse)
                    completeStyle = completeStyle + "marker-start:url(#normals);";
                else completeStyle = completeStyle + "marker-end:url(#normale);";
                if (edge.value < 0) {
                    g.setEdge(edge.source, edge.target, {
                        style: completeStyle + "stroke-dasharray:4 4",
                        curve: d3.curveBasis,
                        arrowhead: "undirected",
                    });
                } else {
                    g.setEdge(edge.source, edge.target, {
                        style: completeStyle,
                        curve: d3.curveBasis,
                        arrowhead: "undirected",
                    });
                }
            }
        });
        // Set some general styles
        g.nodes().forEach(function (v) {
            var node = g.node(v);
            node.rx = node.ry = 5;
            node.style = "fill: transparent";
            if (v === selection.outcome) node.style = "fill: #f77;";
            else if (node.type < 0) {
                node.style = "fill:" + cmap[0];
            }
            else if (selection.variable.includes(v)) {
                node.style = "fill: black";
            }
        });
        dagre.layout(g);

        let inner = svg.select("g");

        var zoom = d3.zoom().on("zoom", function (event) {
            inner.attr("transform", event.transform);
        });
        svg.call(zoom);

        // Create the renderer
        var render = new dagreD3.render();
        // Run the renderer. This is what draws the final graph.
        render(inner, g);

        // Center the graph
        var initialScale = size.scale;
        console.log(size)
        let xOffset = (size.width - g.graph().width * initialScale) / 2;
        let yOffset = 10;
        svg.call(
            zoom.transform,
            d3.zoomIdentity.translate(xOffset, yOffset).scale(initialScale)
        );
        svg.attr("height", g.graph().height * initialScale + 40);
        this.linksList = selection.linksList;
        this.outcome = selection.outcome;
        this.variables = selection.variable;
    },
    addArrowType(svg) {
        svg
            .append("defs")
            .selectAll("marker")
            .data(["normals", "licensing", "resolved"])
            .enter()
            .append("marker")
            .attr("id", function (d) {
                return d;
            })
            .attr("viewBox", "-10 -5 10 10")
            .attr("refX", -9)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("transform", "rotate(180)")
            .attr("d", "M0,-5L10,0L0,5L10,0L0, -4")
            .style("stroke", "black")
            .style('fill', 'black')
            .style("opacity", "1");

        svg.append("defs").selectAll("marker")
            .data(["normale", "licensing", "resolved"])
            .enter().append("marker")
            .attr("id", function (d) {
                return d;
            })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 9)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
            .style("stroke", "black")
            .style("opacity", "1");

        svg.append("defs").selectAll("marker")
            .data(["activeE", "licensing", "resolved"])
            .enter().append("marker")
            .attr("id", function (d) {
                return d;
            })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 9)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
            .style("stroke", cmap[0])
            .style("opacity", "1");

        svg
            .append("defs")
            .selectAll("marker")
            .data(["activeS", "licensing", "resolved"])
            .enter()
            .append("marker")
            .attr("id", function (d) {
                return d;
            })
            .attr("viewBox", "-10 -5 10 10")
            .attr("refX", -9)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("transform", "rotate(180)")
            .attr("d", "M0,-5L10,0L0,5L10,0L0, -4")
            .style("stroke", cmap[0])
            .style("opacity", "1");
    },

}