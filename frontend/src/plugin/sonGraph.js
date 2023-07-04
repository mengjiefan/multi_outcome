import * as joint from "jointjs";
const countXPos = (x) => {
    let gap = 40;
    let start = 10;
    return start + x * gap;
};
const countYPos = (y) => {
    let gap = 45;
    let start = 10;
    return start + y * gap;
};
const getAllLinks = (nodes, links) => {
    let linksList = [];
    links.forEach((link) => {
        if (nodes.includes(link.source) && nodes.includes(link.target)) {
            linksList.push(link);
        }
    });
    return linksList;
};
export const drawSonCharts = (dom, nodesList, links) => {
    let graph = new joint.dia.Graph({});
    let paper = new joint.dia.Paper({
        el: dom,
        model: graph,
        width: "100%",
        height: "100%",
        gridSize: 1,
    });
    let linksList = getAllLinks(
        nodesList.map((item) => {
            return item.id;
        }), links
    );
    let outRect = new joint.shapes.standard.Rectangle();
    outRect.position(
        countXPos(nodesList[0].x),
        countYPos(nodesList[0].y)
    );
    outRect.resize(24, 24);
    outRect.attr({
        body: {
            fill: "#f77",
            strokeWidth: 0,
            rx: 24,
            ry: 24,
        },
        /*
        label: {
          text: nodesList[0].id,
          fontSize: 10,
          fill: "white",
        },*/
    });
    outRect.addTo(graph);
    nodesList[0]["node"] = outRect;
    for (let nodeI = 1; nodeI < nodesList.length; nodeI++) {
        let faRect = new joint.shapes.standard.Rectangle();
        faRect.position(
            countXPos(nodesList[nodeI].x),
            countYPos(nodesList[nodeI].y)
        );
        faRect.resize(24, 24);
        faRect.attr({
            body: {
                fill: nodesList[nodeI].type === -1 ? "#1f77b4" : "black",
                strokeWidth: 0,
                rx: 24,
                ry: 24,
            },
        });
        faRect.addTo(graph);
        nodesList[nodeI]["node"] = faRect;
    }
    linksList.forEach(link => {
        var path = new joint.shapes.standard.Link();
        let sindex = nodesList.findIndex(item => {
            if(item.id === link.source) return true;
            else return false;
        })
        console.log(sindex)
        path.source(nodesList[sindex].node);
        let tindex = nodesList.findIndex(item => {
            if(item.id === link.target) return true;
            else return false;
        })
        path.target(nodesList[tindex].node);
        path.addTo(graph);
    })

};