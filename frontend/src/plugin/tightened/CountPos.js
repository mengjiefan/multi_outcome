export const countPos = (g, childNodes) => {
    let y = [];
    let x = [];
    let edges = [];
    let commonNode = [];
    let finalPos = [];
    g.nodes().forEach((v) => {
        let pos = g.node(v);
        if (v !== 'group') {
            traversal(y, pos.y)
            traversal(x, pos.x);
        }
        if (pos.type === -1) commonNode.push(v);
    });
    g.edges().forEach((v) => {
        let pos = g.edge(v);
        let points = pos.points;
        points.splice(0, 1);
        points.splice(points.length - 1, 1);
        edges.push({
            source: v.v,
            target: v.w,
            points: points
        })
    })
    let cnodesList = [];
    commonNode.forEach(node => {
        let pos = g.node(node);
        cnodesList.push({
            id: node,
            type: -1,
            x: x.indexOf(pos.x),
            y: y.indexOf(pos.y),
        });
    })
    finalPos.push({
        nodesList: cnodesList
    });
    childNodes.forEach(child => {
        let nodesList = [];
        let linksList = [];
        let pos = g.node(child.outcome);

        nodesList.push({
            id: child.outcome,
            type: 0,
            x: x.indexOf(pos.x),
            y: y.indexOf(pos.y),
        });
        child.variable.forEach(factor => {
            pos = g.node(factor);
            nodesList.push({
                id: factor,
                type: commonNode.includes(factor) ? -1 : 1,
                x: x.indexOf(pos.x),
                y: y.indexOf(pos.y),
            });
            if (factor.includes('hear')) {
                console.log('end', {
                    origin: pos.x,
                    x: x.indexOf(pos.x),
                    y: y.indexOf(pos.y),
                })
            }
        })
        child.linksList.forEach(link => {
            let path = findLink(edges, link);
            let points = [];
            path.points.forEach(point => {
                points.push({
                    x: evenValue(x, point.x),
                    y: evenValue(y, point.y)
                })
            })

            if (link.source.includes('fra') && link.target.includes('death')) {
                console.log(path.points);
                console.log('try', points)
            }
            linksList.push({
                source: link.source,
                target: link.target,
                points: points
            })

        })
        finalPos.push({
            nodesList,
            linksList
        })
    })
    return finalPos;
}
const evenValue = (values, value) => {
    if (values.length === 0 || !values) return value;
    if (value < values[0]) {
        if (values.length === 1)
            return -0.5;
        else {
            let cha = (values[0] - value) / (values[1] - values[0]);
            while (cha > 1) cha = cha / 2;
            return 0 - cha;
        }
    } else if (value > values[values.length - 1]) {
        if (values.length === 1)
            return values.length - 0.5;
        else {
            let cha = (value - values[values.length - 1]) / (values[1] - values[0]);
            while (cha > 1) cha = cha / 2;
            return values.length - 1 + cha;
        }
    }
    let index = values.length - 1;
    for (index = values.length - 1; index >= 0; index--) {
        let now = values[index];
        if (now <= value) break;
    }
    if (values[index] === value) return index;
    else {
        let cha = (value - values[index]) / (values[index + 1] - values[index]);
        while (cha > 1) cha = cha / 2;
        return cha + index;
    }
}
const findLink = (links, edge) => {
    let index = links.findIndex(link => {
        if (link.source === edge.source && link.target === edge.target) return true;
        else if (link.source === edge.target && link.target === edge.source) return true;
        else return false;
    })
    return links[index];
}
export const countSimplePos = (g, nodes) => {
    let y = [];
    let x = [];
    g.nodes().forEach((v) => {
        let pos = g.node(v);
        if (v !== 'group') {
            traversal(y, pos.y)
            traversal(x, pos.x);
        }
    });

    let nodesList = [];
    nodes.forEach(factor => {
        let pos = g.node(factor.id);
        nodesList.push({
            id: factor.id,
            x: x.indexOf(pos.x),
            y: y.indexOf(pos.y),
        })
    })
    return nodesList;
}
const traversal = (list, value) => {
    if (list.includes(value)) return list;
    let i;
    for (i = 0; i < list.length; i++) {
        if (value < list[i]) {
            if (i === 0) {
                list.unshift(value);
                break;
            } else {
                list.splice(i, 0, value);
                break;
            }
        }
    }
    if (i === list.length) {
        list.push(value);
    }
    return list;
}
export const countSonPos = (son, commonPos, linksList) => {
    let sonPos = son.nodesList;
    let verticePos = son.linksList;
    let minPosX = -1;
    let maxPosX = 0;
    let minPosY = -1;
    let maxPosY = 0;
    commonPos.forEach((pos) => {
        if (minPosX === -1 || pos.x < minPosX) minPosX = pos.x;
        if (pos.x > maxPosX) maxPosX = pos.x;
        if (minPosY === -1 || pos.y < minPosY) minPosY = pos.y;
        if (pos.y > maxPosY) maxPosY = pos.y;
    });
    let lX = [];

    let lY = [];

    let rX = [];

    let rY = [];

    sonPos.forEach((pos) => {
        if (pos.x < minPosX) {
            traversal(lX, pos.x)
        }
        else if (pos.x > maxPosX) {
            traversal(rX, pos.x)
        }
        if (pos.y < minPosY) {
            traversal(lY, pos.y);
        } else if (pos.y > maxPosY) {
            traversal(rY, pos.y);
        }
    });
    let minX = minPosX - lX.length;
    let minY = minPosY - lY.length;
    let linksPos = [];
    linksList.forEach(link => {
        let vertice = findLink(verticePos, link);
        let points = [];
        vertice.points.forEach(pos => {
            let point = {
                x: pos.x,
                y: pos.y
            }
            if (pos.x < minPosX) {
                point.x = minX + evenValue(lX, pos.x);
            } else if (pos.x > maxPosX) {
                point.x = evenValue(rX, pos.x) + maxPosX + 1;
            }
            if (pos.y < minPosY) {
                point.y = minY + evenValue(lY, pos.y);
            } else if (pos.y > maxPosY) {
                point.y = evenValue(rY, pos.y) + maxPosY + 1;
            }
            points.push(point);
        })

        linksPos.push({
            source: link.source,
            target: link.target,
            points
        })
    })
    //maxPosX = maxPosX - minPosX + lX.length;
    //maxPosY = maxPosY - minPosY + lY.length;
    sonPos = sonPos.map((pos) => {
        let newPos = {
            x: pos.x,
            y: pos.y,
            type: pos.type,
            id: pos.id
        }
        if (lX.includes(pos.x)) {
            newPos.x = minX + lX.indexOf(newPos.x);
        } else if (rX.includes(pos.x)) {
            newPos.x = rX.indexOf(newPos.x) + maxPosX + 1;
        }
        if (lY.includes(pos.y)) {
            newPos.y = minY + lY.indexOf(newPos.y);
        } else if (rY.includes(pos.y)) {
            newPos.y = rY.indexOf(newPos.y) + maxPosY + 1;
        }
        return newPos;
    });
    let gap = {
        xGap: 50,
        yGap: 50,
    }
    if (maxPosX + rX.length > 0) {
        gap.xGap = 1500 / (maxPosX + rX.length);
    }
    if (maxPosY + rY.length > 0) {
        gap.yGap = 920 / (maxPosY + rX.length);
    }
    return {
        gap: gap,
        sonPos: sonPos.concat(commonPos),
        linksPos
    };
};