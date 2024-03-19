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
  let fixedNodes = nodes.filter((node) => node.fixed);
  console.log(fixedNodes);
  let fixedX = fixedNodes.map((node) => node.order);
  fixedX.sort((a, b) => a - b);
  console.log(fixedX[0] + fixedX[fixedX.length - 1]);

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
  let mid = [];

  let minH = 15000;
  let maxH = 0;
  graphs.forEach((graph) => {
    let minW = 150000;
    let maxW = 0;
    graph.nodesList.forEach((node) => {
      if (node.x > maxW) maxW = node.x;
      if (node.x < minW) minW = node.x;
      if (node.y > maxH) maxH = node.y;
      if (node.y < minH) minH = node.y;
    });

    let gap = (clientWidth - 50) / (maxW - minW + 1);

    if (!gap || isNaN(gap)) gap = 1;
    if (gap < minGap) minGap = gap;
    mid.push({
      x: (maxW + minW) / 2,
      maxH,
      minH,
    });
  });
  if ((clientHeight - 120) / (maxH - minH) < minGap)
    minGap = (clientHeight - 120) / (maxH - minH);

  let startY = (clientHeight + 40 - minGap * (maxH - minH)) / 2;
  for (let i = 0; i < sonNum; i++) {
    let startX = clientWidth / 2 - minGap * mid[i].x;

    scales.push({
      startX,
      startY,
      gap: minGap,
      mid: mid[i],
    });
  }
  return scales;
};
const getRegionIndex = (mid, node) => {
  if (node.x <= mid.x && node.y < mid.y) return 1;
  else if (node.x > mid.x && node.y < mid.y) return 2;
  else if (node.x <= mid.x) return 4;
  else return 3;
};
const getSinglePoint = (source, target, direction) => {
  let point = {
    x: (source.x + target.x) / 2,
    y: (source.y + target.y) / 2,
  };
  if (direction === "left") {
    if (source.x < target.x) {
      point.x = source.x + 0.1;
      if (target.y < source.y) point.y = target.y + 0.2;
      else point.y = target.y - 0.2;
    } else if (source.x > target.x) {
      point.x = target.x + 0.1;
      if (target.y < source.y) point.y = source.y - 0.2;
      else point.y = source.y + 0.2;
    } //相等时直线连接
  } else {
    if (source.x > target.x) {
      point.x = source.x - 0.1;
      if (target.y < source.y) point.y = target.y + 0.2;
      else point.y = target.y - 0.2;
    } else if (source.x < target.x) {
      point.x = target.x - 0.1;
      if (target.y < source.y) point.y = source.y - 0.2;
      else point.y = source.y + 0.2;
    } //相等时直线连接
  }
  return [point];
};
export const countControl = (source, target, mid) => {
  let sIndex = getRegionIndex(mid, source);
  let tIndex = getRegionIndex(mid, target);
  let point = {
    x: (source.x + target.x) / 2,
    y: (source.y + target.y) / 2,
  };
  if (sIndex === tIndex || sIndex + tIndex === 5) {
    if (sIndex === 1 || sIndex === 4)
      return getSinglePoint(source, target, "left");
    else return getSinglePoint(source, target, "right");
  } else if (source.y === target.y) {
    //
  } else if (sIndex === 2 || tIndex === 2) {
    let point1 = {
      x: source.x,
      y: source.y,
    };
    let point2 = {
      x: target.x,
      y: target.y,
    };
    let a = (target.y - source.y) / (target.x - source.x);
    let b = target.y - a * target.x;
    if (source.id.includes("Education") && target.id.includes("meat"))
      console.log(
        mid.x * a + b - mid.y,
        Math.abs(target.x - source.x) + Math.abs(source.y - target.y)
      );
    if (mid.x * a + b <= mid.y)
      if (Math.abs(target.x - source.x) + Math.abs(source.y - target.y) <= 3)
        return getSinglePoint(source, target, "left");
      else if (target.y > source.y) {
        point1.y = point1.y + 0.2;
        point2.y = point2.y - 0.2;
        point2.x = point2.x + (point1.x - mid.x - (mid.x - point2.x)) * 0.2;
        point1.x = point2.x;
      } else {
        point1.y = point1.y - 0.2;
        point2.y = point2.y + 0.2;
        point1.x = point1.x + (point2.x - mid.x - (mid.x - point1.x)) * 0.2;
        point2.x = point1.x;
      }
    else if (Math.abs(target.x - source.x) + Math.abs(source.y - target.y) <= 3)
      return getSinglePoint(source, target, "right");
    else if (target.y > source.y) {
      point1.y = point1.y + 0.2;
      point2.y = point2.y - 0.2;
      point1.x = point1.x + (point1.x - mid.x - (mid.x - point2.x)) * 0.2;
      point2.x = point1.x;
    } else {
      point1.y = point1.y - 0.2;
      point2.y = point2.y + 0.2;
      point2.x = point2.x + (point2.x - mid.x - (mid.x - point1.x)) * 0.2;
      point1.x = point2.x;
    }

    return [point1, point2];
  } else if (sIndex === 1 || tIndex === 1) {
    let point1 = {
      x: source.x,
      y: source.y,
    };
    let point2 = {
      x: target.x,
      y: target.y,
    };
    let a = (target.y - source.y) / (target.x - source.x);
    let b = target.y - a * target.x;

    if (mid.x * a + b <= mid.y)
      if (Math.abs(target.x - source.x) + Math.abs(source.y - target.y) <= 3)
        return getSinglePoint(source, target, "right");
      else if (target.y > source.y) {
        point1.y = point1.y + 0.2;
        point2.y = point2.y - 0.2;
        point2.x = point2.x + (point2.x - mid.x - (mid.x - point1.x)) * 0.2;
        point1.x = point2.x;
      } else {
        point1.y = point1.y - 0.2;
        point2.y = point2.y + 0.2;
        point1.x = point1.x + (point1.x - mid.x - (mid.x - point2.x)) * 0.2;
        point2.x = point1.x;
      }
    else if (Math.abs(target.x - source.x) + Math.abs(source.y - target.y) <= 3)
      return getSinglePoint(source, target, "left");
    else if (target.y > source.y) {
      point1.y = point1.y + 0.2;
      point2.y = point2.y - 0.2;
      point1.x = point1.x + (point2.x - mid.x - (mid.x - point1.x)) * 0.2;
      point2.x = point1.x;
    } else {
      point1.y = point1.y - 0.2;
      point2.y = point2.y + 0.2;
      point2.x = point2.x + (point1.x - mid.x - (mid.x - point2.x)) * 0.2;
      point1.x = point2.x;
    }

    return [point1, point2];
  } else {
    if (source.y < target.y) {
      point.y = target.y - 0.2;
      if (source.x < target.x) point.x = source.x + 0.2;
      else point.x = source.x - 0.2;
    } else {
      point.y = source.y - 0.2;
      if (source.x < target.x) point.x = target.x - 0.2;
      else point.x = target.x + 0.2;
    }
  }
  return [point];
};
