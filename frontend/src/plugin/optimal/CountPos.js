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
export const countSonPos = (son, linksList) => {
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
    linksList.forEach(link => {
        let vertice = findLink(verticePos, link);
        let points = [];
        vertice.points.forEach(pos => {
            let point = {
                x: pos.x,
                y: pos.y
            }
            point.x = evenValue(x, pos.x);
            point.y = evenValue(y, pos.y);
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
    console.log(x, y)
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
    return list;
}