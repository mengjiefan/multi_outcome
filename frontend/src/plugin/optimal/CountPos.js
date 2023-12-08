const findLink = (links, edge) => {
    let index = links.findIndex(link => {
        if (link.source === edge.source && link.target === edge.target) return true;
        else if (link.source === edge.target && link.target === edge.source) return true;
        else return false;
    })
    return links[index];
}
const evenValue = (values, value) => {
    //求value在values中的坐标
    if (values.length === 0 || !values) return value;
    if (value < values[0]) {
        let cha = (values[0] - value);
        if (values.length !== 1)
            cha = cha / (values[1] - values[0]);

        return 0 - cha;

    } else if (value > values[values.length - 1]) {
        let cha = value - values[values.length - 1];
        if (values.length !== 1)
            cha = cha / (values[1] - values[0]);
        return values.length - 1 + cha;
    }
    let index = values.length - 1;
    for (index = values.length - 1; index >= 0; index--) {
        let now = values[index];
        if (now <= value) break;
    }
    //中间值，求平均
    if (values[index] === value) return index;
    else {
        let cha = (value - values[index]) / (values[index + 1] - values[index]);
        return cha + index;
    }
}

export const countTightenedSonPos = (son, linksList) => {
    let x = [];
    let y = [];
    let sonPos = son.nodesList;
    let verticePos = son.linksList;
    sonPos.forEach(node => {
        if (!x.includes(node.x))
            traversal(x, node.x)
        if (!y.includes(node.y))
            traversal(y, node.y)
    })
    let linksPos = [];
    let xGroups = [];//xGroups[i] cotain nodes whose x < i
    let yGroups = [];
    for (let i = 0; i <= x.length; i++)
        xGroups.push([]);
    for (let i = 0; i <= y.length; i++) {
        yGroups.push([])
    }
    linksList.forEach(link => {
        let vertice = findLink(verticePos, link);
        vertice.points.forEach(pos => {
            let xIndex = Math.ceil(evenValue(x, pos.x));
            let yIndex = Math.ceil(evenValue(y, pos.y));
            if (xIndex < 0)
                traversal(xGroups[0], pos.x)
            else if (xIndex > x.length) {
                traversal(xGroups[x.length], pos.x)
            }
            else
                traversal(xGroups[xIndex], pos.x);
            if (xIndex < 0)
                traversal(yGroups[0], pos.y)
            else if (yIndex > y.length)
                traversal(yGroups[y.length], pos.y);
            else
                traversal(yGroups[yIndex], pos.y)

        })
    })
    linksList.forEach(link => {
        let vertice = findLink(verticePos, link);
        let points = [];
        vertice.points.forEach(pos => {
            let point = {
                x: pos.x,
                y: pos.y
            }
            let xIndex = Math.ceil(evenValue(x, pos.x));
            if (xIndex < 0) xIndex = 0;
            if (xIndex > x.length) xIndex = x.length;
            if (x.includes(pos.x)) {
                point.x = x.indexOf(pos.x)
            } else
                point.x = xIndex - 1 + 1 / (xGroups[xIndex].length + 1) * (xGroups[xIndex].indexOf(pos.x) + 1)

            let yIndex = Math.ceil(evenValue(y, pos.y));
            if (yIndex < 0) yIndex = 0;
            if (yIndex > y.length) yIndex = y.length;
            if (y.includes(pos.y))
                point.y = y.indexOf(pos.y);
            else
                point.y = yIndex - 1 + 1 / (yGroups[yIndex].length + 1) * (yGroups[yIndex].indexOf(pos.y) + 1)

            points.push(point);
        })
        linksPos.push({
            source: link.source,
            target: link.target,
            points
        })
    })
    sonPos = sonPos.map(pos => {
        return {
            x: x.indexOf(pos.x),
            y: y.indexOf(pos.y),
            type: pos.type,
            id: pos.id
        }
    });
    let gap = {
        xGap: 50,
        yGap: 50,

    }
    if (x.length > 0) {
        gap.xGap = 1500 / x.length;
    }
    if (y.length > 0) {
        gap.yGap = 920 / y.length;
    }
    return {
        gap: gap,
        sonPos,
        linksPos
    };
};
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
}