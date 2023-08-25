
export const countSimplePos = (g, nodes, links) => {

    let nodesList = [];
    nodes.forEach(factor => {
        let pos = g.node(factor.id);
        nodesList.push({
            type: factor.type,
            id: factor.id,
            x: pos.x,
            y: pos.y,
        })
    })
    let linksList = [];
    g.edges().forEach((v) => {
        let pos = g.edge(v);
        let points = pos.points;
        points.splice(0, 1);
        points.splice(points.length - 1, 1);
        points.forEach(p => {
            if (isNaN(p.x) || isNaN(p.y))
                console.log(v, 'NaN');
        })
        let index = links.findIndex(link => {
            if (link.source === v.v && link.target === v.w) return true;
            else if (link.target === v.w && link.source === v.v) return true;
            else return false;
        })
        let edge = links[index];
        edge['points'] = points;
        linksList.push(edge)
    })
    return { nodesList, linksList };
}
export const countSonPos = (all, son) => {
    let linksList = [];
    let nodesList = [];
    let links = son.linksList.filter(link => !link.hidden);
    links.forEach(link => {
        let index = all.linksList.findIndex(edge => {
            if (edge.source === link.source && edge.target === link.target) return true;
            else if (edge.source === link.target && edge.target === link.source) return true;
            else return false;
        })

        link['points'] = all.linksList[index].points;

        linksList.push(link);
    })
    let index = all.nodesList.findIndex(item => {
        if (item.id === son.outcome) return true;
        else return false;
    })
    nodesList.push(all.nodesList[index]);
    son.variable.forEach(node => {
        let index = all.nodesList.findIndex(item => {
            if (node === item.id) return true;
            else return false;
        })
        nodesList.push(all.nodesList[index]);
    })
    return { linksList, nodesList }
}

