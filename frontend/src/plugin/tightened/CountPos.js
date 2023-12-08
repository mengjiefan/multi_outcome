export const countPos = (g, childNodes, commonNode) => {
  let y = [];
  let x = [];
  let edges = [];
  let finalPos = [];
  g.nodes().forEach((v) => {
    let pos = g.node(v);
    if (!v.includes("group")) {
      traversal(y, pos.y);
      traversal(x, pos.x);
    }
  });
  g.edges().forEach((v) => {
    let pos = g.edge(v);
    let points = pos.points.slice(1, pos.points.length - 1);
    edges.push({
      source: v.v,
      target: v.w,
      points: points,
    });
  });
  let cnodesList = [];
  commonNode.forEach((node) => {
    let pos = g.node(node);
    cnodesList.push({
      id: node,
      type: -1,
      x: x.indexOf(pos.x),
      y: y.indexOf(pos.y),
    });
  });
  finalPos.push({
    nodesList: cnodesList,
  });
  childNodes.forEach((child) => {
    let nodesList = [];
    let linksList = [];
    let pos = g.node(child.outcome);

    nodesList.push({
      id: child.outcome,
      type: 0,
      x: x.indexOf(pos.x),
      y: y.indexOf(pos.y),
    });
    child.variable.forEach((factor) => {
      pos = g.node(factor);
      nodesList.push({
        id: factor,
        type: commonNode.includes(factor) ? -1 : 1,
        x: x.indexOf(pos.x),
        y: y.indexOf(pos.y),
      });
    });
    child.linksList.forEach((link) => {
      let points = [];
      let path = findLink(edges, link);
      if (path) {
        path.points.forEach((point) => {
          points.push({
            x: evenValue(x, point.x),
            y: evenValue(y, point.y),
          });
        });
        if (path.source !== link.source) points.reverse();
      }
      linksList.push({
        source: link.source,
        target: link.target,
        points: points,
      });
    });
    finalPos.push({
      nodesList,
      linksList,
    });
  });
  return finalPos;
};

const evenValue = (values, value) => {
  //求value在values中的坐标
  if (values.length === 0 || !values) return value;
  if (value < values[0]) {
    let cha = values[0] - value;
    if (values.length !== 1) cha = cha / (values[1] - values[0]);
    while (cha > 1) cha = cha / 2;

    return 0 - cha;
  } else if (value > values[values.length - 1]) {
    let cha = value - values[values.length - 1];
    if (values.length !== 1) cha = cha / (values[1] - values[0]);
    while (cha > 1) cha = cha / 2;
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
};
const findLink = (links, edge) => {
  let index = links.findIndex((link) => {
    if (link.source === edge.source && link.target === edge.target) return true;
    else if (link.source === edge.target && link.target === edge.source)
      return true;
    else return false;
  });
  return links[index];
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
};
export const countTightenedSonPos = (son, commonNodes, linksList) => {
  let sonPos = son.nodesList;
  let verticePos = son.linksList;
  let minPosX = -1;
  let maxPosX = 0;
  let minPosY = -1;
  let maxPosY = 0;
  let commonIds = commonNodes.map((node) => {
    return node.id;
  });
  let commonPos = [];
  son.nodesList.forEach((node) => {
    if (commonIds.includes(node.id)) commonPos.push(node);
  });
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
      traversal(lX, pos.x);
    } else if (pos.x > maxPosX) {
      traversal(rX, pos.x);
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

  rX.unshift(maxPosX); //lower bound of rX ;while index = 0
  rY.unshift(maxPosY);
  if (commonPos.length > 0) {
    lX.push(minPosX); // upper bound of lX;
    lY.push(minPosY);
  }

  let lxGroups = []; //xGroups[i] cotain nodes whose x < i
  let lyGroups = [];
  let rxGroups = [];
  let ryGroups = [];
  for (let i = 0; i <= lX.length; i++) lxGroups.push([]);
  for (let i = 0; i <= lY.length; i++) lyGroups.push([]);
  for (let i = 0; i <= rX.length; i++) rxGroups.push([]);
  for (let i = 0; i <= rY.length; i++) ryGroups.push([]);
  linksList.forEach((link) => {
    let vertice = findLink(verticePos, link);
    if (vertice)
      vertice.points.forEach((pos) => {
        if (pos.x < minPosX && lX.length > 1) {
          let xIndex = Math.ceil(evenValue(lX, pos.x));
          if (xIndex < 0) xIndex = 0;
          else if (xIndex > lX.length) xIndex = lX.length;
          traversal(lxGroups[xIndex], pos.x);
        } else if (pos.x > maxPosX && rX.length > 1) {
          let xIndex = Math.ceil(evenValue(rX, pos.x));
          if (xIndex < 0) xIndex = 0;
          else if (xIndex > rX.length) xIndex = rX.length;
          traversal(rxGroups[xIndex], pos.x);
        } else if (pos.x < minPosX) {
          traversal(lxGroups, pos.x);
        } else if (pos.x > maxPosX) {
          traversal(rxGroups, pos.x);
        }

        if (pos.y < minPosY && lY.length > 1) {
          let yIndex = Math.ceil(evenValue(lY, pos.y));
          if (yIndex < 0) yIndex = 0;
          else if (yIndex > lY.length) yIndex = lY.length;
          traversal(lyGroups[yIndex], pos.y);
        } else if (pos.y > maxPosY && rY.length > 1) {
          let yIndex = Math.ceil(evenValue(rY, pos.y));
          if (yIndex < 0) yIndex = 0;
          else if (yIndex > rY.length) yIndex = rY.length;
          traversal(ryGroups[yIndex], pos.y);
        } else if (pos.y < minPosY) {
          traversal(lyGroups, pos.y);
        } else if (pos.y > maxPosY) {
          traversal(ryGroups, pos.y);
        }
      });
  });
  sonPos = sonPos.map((pos) => {
    let newPos = {
      x: pos.x,
      y: pos.y,
      type: pos.type,
      id: pos.id,
    };
    if (lX.includes(pos.x)) {
      newPos.x = minX + lX.indexOf(newPos.x);
    } else if (rX.includes(pos.x)) {
      newPos.x = rX.indexOf(newPos.x) + maxPosX;
    }
    if (lY.includes(pos.y)) {
      newPos.y = minY + lY.indexOf(newPos.y);
    } else if (rY.includes(pos.y)) {
      newPos.y = rY.indexOf(newPos.y) + maxPosY;
    }
    return newPos;
  });

  linksList.forEach((link) => {
    let vertice = findLink(verticePos, link);
    let points = [];
    if (vertice)
      vertice.points.forEach((pos) => {
        let point = {
          x: pos.x,
          y: pos.y,
        };
        if (pos.x < minPosX && lX.length > 1) {
          let xIndex = Math.ceil(evenValue(lX, pos.x));
          if (xIndex < 0) xIndex = 0;
          if (xIndex > lX.length) xIndex = lX.length;
          if (lX.includes(pos.x)) {
            point.x = minX + lX.indexOf(pos.x);
          } else
            point.x =
              minX +
              xIndex -
              1 +
              (1 / (lxGroups[xIndex].length + 1)) *
                (lxGroups[xIndex].indexOf(pos.x) + 1);
        } else if (pos.x > maxPosX && rX.length > 1) {
          let xIndex = Math.ceil(evenValue(rX, pos.x));
          if (xIndex < 0) xIndex = 0;
          if (xIndex > rX.length) xIndex = rX.length;
          if (rX.includes(pos.x)) {
            point.x = maxPosX + rX.indexOf(pos.x);
          } else
            point.x =
              maxPosX +
              xIndex -
              1 +
              (1 / (rxGroups[xIndex].length + 1)) *
                (rxGroups[xIndex].indexOf(pos.x) + 1);
        } else if (pos.x > maxPosX) {
          point.x =
            maxPosX +
            (pos.x - maxPosX) / (rxGroups[rxGroups.length - 1] - maxPosX);
        } else if (pos.x < minPosX) {
          point.x = minPosX - (minPosX - point.x) / (minPosX - lxGroups[0]);
        }
        if (pos.y < minPosY && lY.length > 1) {
          let yIndex = Math.ceil(evenValue(lY, pos.y));
          if (yIndex < 0) yIndex = 0;
          if (yIndex > lY.length) yIndex = lY.length;
          if (lY.includes(pos.y)) {
            point.y = minY + lY.indexOf(pos.y);
          } else
            point.y =
              minY +
              yIndex -
              1 +
              (1 / (lyGroups[yIndex].length + 1)) *
                (lyGroups[yIndex].indexOf(pos.y) + 1);
        } else if (pos.y > maxPosY && rY.length > 1) {
          let yIndex = Math.ceil(evenValue(rY, pos.y));
          if (yIndex < 0) yIndex = 0;
          if (yIndex > rY.length) yIndex = rY.length;
          if (rY.includes(pos.y)) {
            point.y = maxPosY + rY.indexOf(pos.y);
          } else
            point.y =
              maxPosY +
              yIndex -
              1 +
              (1 / (ryGroups[yIndex].length + 1)) *
                (ryGroups[yIndex].indexOf(pos.y) + 1);
        } else if (pos.y > maxPosY) {
          point.y =
            maxPosY +
            (pos.y - maxPosY) / (ryGroups[ryGroups.length - 1] - maxPosY);
        } else if (pos.y < minPosY) {
          point.y = minPosY - (minPosY - pos.y) / (minPosY - lyGroups[0]);
        }
        points.push(point);
      });
    let sindex = sonPos.findIndex((node) => node.id === link.source);
    points.unshift({
      x: sonPos[sindex].x,
      y: sonPos[sindex].y,
    });
    let tindex = sonPos.findIndex((node) => node.id === link.target);
    points.push({ x: sonPos[tindex].x, y: sonPos[tindex].y });
    linksPos.push({
      ...link,
      points,
    });
  });

  let gap = {
    xGap: 50,
    yGap: 50,
  };
  if (maxPosX + rX.length > 0) {
    gap.xGap = 1500 / (maxPosX - minPosX + rX.length + lX.length);
  }
  if (maxPosY + rY.length > 0) {
    gap.yGap = 920 / (maxPosY - minPosY + rY.length + lY.length);
  }
  return {
    gap: gap,
    nodesList: sonPos.concat(commonPos),
    linksList: linksPos,
  };
};
