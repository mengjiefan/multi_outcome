import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import dagre from "dagre-d3/lib/dagre";
import { ref } from 'vue'
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

const exist = (links, link) => {
    let index = links.findIndex(path => {
        if (path.source === link.source && link.target === path.target && !path.hidden) return true;
        else if (path.source === link.target && path.target === link.source && !path.hidden) return true;
        else return false;
    })
    return index;
}
const getNodeIndex = (id, selections) => {
    let indexes = [];
    for (let i = 0; i < selections.length; i++) {
        let selection = selections[i];
        if (selection.outcome === id) indexes.push(i);
        else if (selection.variable.includes(id)) indexes.push(i);
    }
    return indexes;
}

const sonGraph = ref(null);
export default {
    checkDirection(position, source, target) {
        let sIndex = position.findIndex((node) => {
            if (node.id === source) return true;
            else return false;
        });
        let tIndex = position.findIndex((node) => {
            if (node.id === target) return true;
            else return false;
        });
        if (sIndex < 0 || tIndex < 0) return "DOWN";
        if (position[sIndex].y <= position[tIndex].y) return "DOWN";
        else return "UP";
    },
    linksList: [],
    setSingleGraph(svg, multipleSearchValue, selection, size, transform, sonPos) {
        this.addArrowType(svg)
        sonGraph.value = this;
        var data = multipleSearchValue;
        var states = data.nodesList;
        svg.select("g").selectAll("*").remove();
        // {
        let g = new dagreD3.graphlib.Graph({ compound: true }).setGraph({
            ranker: "tight-tree",
        });
        console.log('pos', sonPos)
        // Automatically label each of the nodes
        states.forEach(function (state) {
            let node = {
                label: '',
                type: state.type,
            };
            if (node.type === 0) node["index"] = state.index;
            g.setNode(state.id, node);
        });
        /*
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
        */
        var edges = data.linksList;
        let that = this;
        edges.forEach(function (edge) {
            let edgeValue = edge.value > 0 ? edge.value * 10 : (-edge.value) * 10
            var valString = edgeValue.toString() + "px";
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
                let direction = '';
                edge = selection.linksList[index];
                if (edge.reverse) {
                    direction = that.checkDirection(sonPos, edge.target, edge.source);
                    completeStyle = completeStyle + "marker-start:url(#normals);";
                } else {
                    direction = that.checkDirection(sonPos, edge.source, edge.target);
                    completeStyle = completeStyle + "marker-end:url(#normale);";
                }
                if (edge.value < 0) {
                    completeStyle = completeStyle + "stroke-dasharray:4 4";
                }
                if (direction === "DOWN") {
                    g.setEdge(edge.source, edge.target, {
                        style: completeStyle,
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
            node.rx = node.ry = 20;
            let indexes = getNodeIndex(v, multipleSearchValue.selections);

            if (v !== selection.outcome && !selection.variable.includes(v)) node.style = "fill: transparent";
            else if (indexes.length === 1) node.style = "fill:" + cmap[indexes[0]];
            else
                node.style = "fill:url(#" + v.replaceAll("_", "") + ")";
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
        if (transform) {
            inner.attr("transform", transform);
        } else {
            var initialScale = size.scale;
            console.log(size)
            let xOffset = (size.width - g.graph().width * initialScale) / 2;
            let yOffset = 10;

            svg.call(
                zoom.transform,
                d3.zoomIdentity.translate(xOffset, yOffset).scale(initialScale)
            );
            svg.attr("height", g.graph().height * initialScale + 40);
        }
        g.nodes().forEach(function (v) {

            var node = g.node(v);
            if (v === selection.outcome || selection.variable.includes(v))
                inner
                    .append("text")
                    .attr("x", node.x - v.length * 2)
                    .attr("y", node.y)
                    .style("font-weight", 500)
                    .style("font-size", 8)
                    .style("font-family", "Arial")
                    .style("fill", "black")
                    .text(v);
        });
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
            .style("stroke", "#1f77b4")
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
            .style("stroke", "#1f77b4")
            .style("opacity", "1");
    },

}