import axios from "axios";
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
export const countCurveSonPos = async (all, name) => {
  let nodes = [];
  let x = [];
  let y = [];
  all.nodesList.forEach((node) => {
    traversal(x, node.x);
    traversal(y, node.y);
  });

  all.nodesList.forEach((node) => {
    nodes.push({
      node: node.id,
      rank: y.indexOf(node.y),
      order: x.indexOf(node.x),
      fixed: node.indexes.length > 1,
      group: node.indexes,
      outcome: node.type === 0,
    });
  });

  let links = all.linksList;
  let response = await axios({
    method: "post",
    url: "http://localhost:8000/api/calculate_" + name + "_layout",
    //参数
    data: {
      nodesList: nodes,
      linksList: links,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data.graph;
};
export const countCurveScale = (graphs, clientHeight, clientWidth, sonNum) => {
  let minGap = 100000;
  let scales = [];
  let midX = [];

  let minH = 15000;
  let maxH = 0;
  graphs.forEach((graph) => {
    let minW = 150000;
    let maxW = 0;
    graph.nodesList.forEach((node) => {
      if (node.new_order > maxW) maxW = node.new_order;
      if (node.new_order < minW) minW = node.new_order;
      if (node.rank > maxH) maxH = node.rank;
      if (node.rank < minH) minH = node.rank;
    });

    let gap = (clientWidth - 50) / (maxW - minW);

    if (!gap || isNaN(gap)) gap = 1;
    if (gap < minGap) minGap = gap;
    midX.push(maxW + minW);
  });
  if ((clientHeight - 120) / (maxH - minH) < minGap)
    minGap = (clientHeight - 120) / (maxH - minH);

  let startY = (clientHeight - 70 - minGap * (maxH + minH)) / 2;
  for (let i = 0; i < sonNum; i++) {
    let startX = (clientWidth - minGap * midX[i]) / 2;

    scales.push({
      mid: { x: midX[i] / 2, y: (maxH + minH) / 2 },
      startX,
      startY,
      gap: minGap,
    });
  }
  return scales;
};
