
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

