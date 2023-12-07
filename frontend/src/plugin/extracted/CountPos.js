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
      edge["points"] = points;
      linksList.push(edge);
    }
  });
  return { nodesList, linksList };
};
export const countExtractedSonPos = (all, son) => {
  let linksList = [];
  let nodesList = [];
  let links = LinksManagement.getLayoutLinks(son.linksList);
  links.forEach((link) => {
    let nowLink = {
      source: link.source,
      target: link.target,
      value: link.value,
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
  /*
    all.nodesList.forEach(node => {
        if(son.variable.includes(node.id)) 
        nodesList.push(node)
    })*/
  son.variable.forEach((node) => {
    let index = all.nodesList.findIndex((item) => {
      if (node === item.id) return true;
      else return false;
    });
    nodesList.push(all.nodesList[index]);
  });
  return { linksList, nodesList };
};
