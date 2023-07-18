export const countSonPos = (sonPos) => {
    let x = [];
    let y = [];
    sonPos.forEach(node => {
        if (!x.includes(node.x))
            traversal(x, node.x)
        if (!y.includes(node.y))
            traversal(y, node.y)
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
        sonPos
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