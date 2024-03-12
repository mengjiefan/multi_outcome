import { LinksManagement } from "../joint/linkAndNode";
import { findLink } from "../links";
export const countSimplePos = (g, nodes, links) => {
  let nodesList = [];
  nodes.forEach((factor) => {
    let pos = g.node(factor.id);
    nodesList.push({
      type: factor.type,
      id: factor.id,
      x: pos.x,
      y: pos.y,
    });
  });
  let linksList = [];
  g.edges().forEach((v) => {
    let pos = g.edge(v);
    let points = [];
    if (pos.points) points = pos.points; //.slice(1, pos.points.length - 1);
    if (isNaN(points[0].x) || isNaN(points[0].y)) {
      let sindex = nodesList.findIndex((node) => node.id === v.v);
      points.splice(0, 1, { x: nodesList[sindex].x, y: nodesList[sindex].y });
    }
    if (
      isNaN(points[points.length - 1].x) ||
      isNaN(points[points.length - 1].y)
    ) {
      let tindex = nodesList.findIndex((node) => node.id === v.w);
      points.splice(points.length - 1, 1, {
        x: nodesList[tindex].x,
        y: nodesList[tindex].y,
      });
    }

    let index = links.findIndex((link) => {
      if (link.source === v.v && link.target === v.w) return true;
      else if (link.target === v.v && link.source === v.w) return true;
      else return false;
    });
    if (index > -1) {
      let edge = links[index];
      // simplePos: dagre中点的顺序和数组中一样，无需反向
      linksList.push({
        ...edge,
        points: points,
      });
    }
  });
  return { nodesList, linksList };
};
export const countExtractedSonPos = (all, son) => {
  let linksList = [];
  let nodesList = [];
  let links = LinksManagement.getFinalLinks(son.linksList);
  links.forEach((link) => {
    let nowLink = {
      ...link,
      points: [],
    };
    let index = findLink.sameNodeLink(nowLink, all.linksList);
    if (index > -1) {
      nowLink["points"] = all.linksList[index].points.concat([]);
      if (nowLink.source !== all.linksList[index].source)
        nowLink.points.reverse();
    }
    linksList.push(nowLink);
  });
  let index = all.nodesList.findIndex((item) => {
    if (item.id === son.outcome) return true;
    else return false;
  });
  nodesList.push(all.nodesList[index]);

  son.variable.forEach((node) => {
    let index = all.nodesList.findIndex((item) => {
      if (node === item.id) return true;
      else return false;
    });
    nodesList.push(all.nodesList[index]);
  });
  return { linksList, nodesList };
};

export const countExtractedScale = (
  graphs,
  clientHeight,
  clientWidth,
  sonNum
) => {
  let scales = [];
  let minGap = 10000;

  let midX = [];
  let midY = [];

  graphs.forEach((graph) => {
    let minW = 150000;
    let maxW = 0;
    let minH = 15000;
    let maxH = 0;
    graph.nodesList.forEach((node) => {
      if (node.x > maxW) maxW = node.x;
      if (node.x < minW) minW = node.x;
      if (node.y > maxH) maxH = node.y;
      if (node.y < minH) minH = node.y;
    });
    graph.linksList.forEach((link) => {
      link.points.forEach((node) => {
        if (node.x > maxW) maxW = node.x;
        if (node.x < minW) minW = node.x;
        if (node.y > maxH) maxH = node.y;
        if (node.y < minH) minH = node.y;
      });
    });
    let gap = (clientWidth - 40) / (maxW - minW);
    if ((clientHeight - 120) / (maxH - minH) < gap)
      gap = (clientHeight - 120) / (maxH - minH);
    if (gap < minGap) minGap = gap;
    midX.push(maxW + minW);
    midY.push(maxH + minH);
  });

  for (let i = 0; i < sonNum; i++) {
    let startX = (clientWidth - minGap * midX[i]) / 2;
    let startY = (clientHeight - 80 - minGap * midY[i]) / 2;
    scales.push({
      gap: minGap,
      startX,
      startY,
    });
  }
  return scales;
};
