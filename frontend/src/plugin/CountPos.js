export const countPos = (g, childNodes) => {
    let y = [];
    let x = [];
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
            })
        })
        finalPos.push({
            nodesList,
            linksList: child.linksList
        })
    })
    return finalPos;
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
export const countSonPos = (sonPos, commonPos) => {

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
    maxPosX = maxPosX - minPosX + lX.length;
    maxPosY = maxPosY - minPosY + lY.length;
    sonPos = sonPos.map((pos) => {
        let newPos = {
            x: pos.x,
            y: pos.y,
            type: pos.type,
            id: pos.id
        }
        if (lX.includes(pos.x)) {
            newPos.x = lX.indexOf(newPos.x);
        } else if (rX.includes(pos.x)) {
            newPos.x = rX.indexOf(newPos.x) + maxPosX + 1;
        } else {
            newPos.x = (newPos.x - minPosX) + lX.length;
        }
        if (lY.includes(pos.y)) {
            newPos.y = lY.indexOf(newPos.y);
        } else if (rY.includes(pos.y)) {
            newPos.y = rY.indexOf(newPos.y) + maxPosY + 1;
        } else {
            newPos.y = (newPos.y - minPosY) + lY.length;
        }
        return newPos;
    });
    commonPos = commonPos.map((pos) => {
        let newPos = {
            type: pos.type,
            id: pos.id,
            x: (pos.x - minPosX) + lX.length,
            y: (pos.y - minPosY) + lY.length,
        }
        return newPos;
    })
    console.log(commonPos)
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
    console.log(sonPos.concat(commonPos))
    return {
        gap: gap,
        sonPos: sonPos.concat(commonPos)
    };
};