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
};
export const countRelativeSonPos = (all, son, sonNum) => {
  let nodes = [];
  let x = [];
  let y = [];
  all.nodesList.forEach((node) => {
    traversal(x, node.x);
    traversal(y, node.y);
  });
  all.nodesList.forEach((node) => {
    nodes.push({
      id: node.id,
      rank: y.indexOf(node.y),
      order: x.indexOf(node.x),
      indexes: node.indexes,
      type: node.type,
    });
  });

  nodes.sort((node1, node2) => node1.order - node2.order);
  let fixedNodes = nodes.filter((node) => node.indexes.length > 1);
  console.log(fixedNodes);
  let origin_fixed_center =
    (fixedNodes[0].order + fixedNodes[fixedNodes.length - 1].order) / 2;

  let length = [];
  let mid = [];
  for (let i = 0; i < sonNum; i++) {
    mid.push(0);
    length.push(0);
  }
  nodes.forEach((node) => {
    if (node.indexes.length > 1) {
      for (let i = 0; i < node.indexes.length; i++) {
        let index = node.indexes[i];
        length[index] += Math.ceil((mid[index] + 1) / 3);
        mid[index] = 0;
      }
      let max = 0;
      for (let i = 0; i < sonNum; i++) {
        if (length[i] > max) max = length[i];
      }
      for (let i = 0; i < node.indexes.length; i++)
        length[node.indexes[i]] = max;
      node.new_order = max;
    } else mid[node.indexes[0]]++;
  });
  let newMid =
    (fixedNodes[0].new_order + fixedNodes[fixedNodes.length - 1].new_order) / 2;

  fixedNodes.forEach((node) => {
    node.new_order = origin_fixed_center - (newMid - node.new_order);
  });

  x = [];
  let sonNodes = [];
  let sonVar = son.variable.concat([son.outcome]);
  sonVar.forEach((node) => {
    let index = nodes.findIndex((item) => item.id === node);
    traversal(x, nodes[index].order);
  });
  sonVar.forEach((node) => {
    let index = nodes.findIndex((item) => item.id === node);
    sonNodes.push({
      ...nodes[index],
      son_order: x.indexOf(nodes[index].order),
    });
  });
  console.log(sonNodes)
  sonNodes.sort((node1, node2) => node1.order - node2.order);
  let sonFixedNodes = sonNodes.filter((node) => node.indexes.length > 1);

  for (let i = 0; i < sonNodes.length; i++) {
    let node = sonNodes[i];
    if (node.indexes.length === 1) {
      if (node.order < sonFixedNodes[0].order)
        node.new_order =
          sonFixedNodes[0].new_order -
          (sonFixedNodes[0].son_order - node.son_order);
      else if (node.order > sonFixedNodes[sonFixedNodes.length - 1].order)
        node.new_order =
          sonFixedNodes[sonFixedNodes.length - 1].new_order -
          (sonFixedNodes[sonFixedNodes.length - 1].son_order - node.son_order);
      else {
        for (let index = 0; index < sonFixedNodes.length; index++) {
          if (sonFixedNodes[index].order === node.order) {
            node.new_order = sonFixedNodes[index].order;
            break;
          } else if (sonFixedNodes[index].order > node.order) {
            node.new_order =
              ((node.son_order - sonFixedNodes[index - 1].son_order) /
                (sonFixedNodes[index].son_order -
                  sonFixedNodes[index - 1].son_order)) *
                (sonFixedNodes[index].new_order -
                  sonFixedNodes[index - 1].new_order) +
              sonFixedNodes[index - 1].new_order;
            break;
          }
        }
      }
    }
  }
  return sonNodes.map((node) => {
    return {
      id: node.id,
      offset: node.new_order - node.order,
      x: node.new_order,
      y: node.rank,
      indexes: node.indexes,
      type: node.type,
    };
  });
};
