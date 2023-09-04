
export const countSonPos = (all, son) => {
    let x = [];
    let y = [];
    let nodesList = [];
    all.nodesList.forEach(node => {
        if (!x.includes(node.x))
            traversal(x, node.x)
        if (!y.includes(node.y))
            traversal(y, node.y)
    })
    let index = all.nodesList.findIndex(item => {
        if (item.id === son.outcome) return true;
        else return false;
    });
    let node = all.nodesList[index]
    nodesList.push({
        id: node.id,
        type: node.type,
        indexes: node.indexes,
        rank: y.indexOf(node.y) + 1,
        order: x.indexOf(node.x) + 1
    });
    son.variable.forEach(one => {
        let index = all.nodesList.findIndex(item => {
            if (item.id === one) return true;
            else return false;
        });
        let node = all.nodesList[index]
        nodesList.push({
            id: node.id,
            type: node.type,
            indexes: node.indexes,
            rank: y.indexOf(node.y) + 1,
            order: x.indexOf(node.x) + 1
        });
    })

    return nodesList;
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