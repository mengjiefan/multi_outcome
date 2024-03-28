import { LinksManagement } from "@/plugin/joint/linkAndNode.js";
import * as joint from "jointjs";

export class findLink {
  static showSameDireLink(originalLink, linksList) {
    let link = LinksManagement.getFinalLink(originalLink);
    let index = linksList.findIndex((item) => {
      if (
        item.source === link.source &&
        item.target === link.target &&
        !item.reverse
      )
        return true;
      else if (
        item.source === link.target &&
        item.target === link.source &&
        item.reverse
      )
        return true;
      else return false;
    });
    return index;
  }
  static sameNodeLink(link, linksList) {
    let index = linksList.findIndex((item) => {
      if (item.source === link.source && item.target === link.target)
        return true;
      else if (item.target === link.source && item.source === link.target)
        return true;
      else return false;
    });
    return index;
  }
  static showReverseLink(originalLink, linksList) {
    let link = LinksManagement.getFinalLink(originalLink);

    let index = linksList.findIndex((item) => {
      if (
        item.target === link.source &&
        item.source === link.target &&
        !item.reverse
      )
        return true;
      else if (
        item.target === link.target &&
        item.source === link.source &&
        item.reverse
      )
        return true;
      else return false;
    });
    return index;
  }
}

export class linksOperation {
  static countControl(source, target, mid) {
    let x = (source.x + target.x) / 2;
    let y = (source.y + target.y) / 2;

    let offset = (target.y - source.y) * 0.17;
    if (source.x !== target.x) {
      offset = Math.abs(offset);
      if (x < mid) x = x - offset;
      else x = x + offset;
      return { x, y };
    } else return { x: x + offset, y };
  }
  static recalLinkValue(value) {
    let newV = Math.abs(value);
    return Math.log(newV + 1.2) / Math.log(2);
  }
  static addNode(nodes, paper, type) {
    let graph = paper.model.attributes.cells.graph;
    nodes.forEach((node) => {
      let nodeView = null;
      graph.getElements().forEach((circle) => {
        if (circle.findView(paper).model.attributes.attrs.title === node)
          nodeView = circle.findView(paper);
      });
      let newCircle = new joint.shapes.standard.Circle();
      let color = "rgba(66,103,172,1)";
      if (type === "AAAI") color = "rgba(240,157,68,1)";
      let position = nodeView.model.attributes.position;
      newCircle.attr({
        body: {
          fill: color,
          stroke: "transparent",
        },
      });
      newCircle.resize(24, 24);
      if (type === "AAAI") newCircle.position(position.x - 5, position.y - 5);
      else newCircle.position(position.x + 5, position.y + 5);
      newCircle.set("z", 10);
      newCircle.addTo(paper.model);
    });
  }
  static addRange(x, y, width, height, paper) {
    let rect = new joint.shapes.standard.Rectangle({});
    rect.position(x, y);
    rect.resize(width, height);
    rect.attr({
      body: {
        fill: "transparent",
        stroke: "red",
      },
    });
    rect.addTo(paper.model);
  }
  static addLink(pos, link, paper, curveType, attrs) {
    let linksList = pos.linksList;
    let nodesList = pos.nodesList;
    var path = new joint.shapes.standard.Link({});
    let sIndex = nodesList.findIndex((node) => {
      if (node.id === link.source) return true;
      else return false;
    });

    let tIndex = nodesList.findIndex((node) => {
      if (node.id === link.target) return true;
      else return false;
    });
    let value = linksOperation.recalLinkValue(link.value);

    path.attr({
      id: "(" + link.source + ", " + link.target + ")",
      line: {
        strokeWidth: value + "",
        targetMarker: {
          // minute hand
          type: "path",
          stroke: "black",
          "stroke-width": value,
          fill: "transparent",
          d: "M 10 -5 0 0 10 5 ",
        },
      },
    });
    let index = findLink.sameNodeLink(link, linksList);
    let points = [];

    if (linksList[index]?.points?.length) {
      points = linksList[index].points.concat([]);
      if (link.source !== linksList[index].source) points.reverse();
    }

    if (link.value < 0) path.attr("line/strokeDasharray", "4 4");

    if (LinksManagement.isLinkDown(paper, link))
      path.attr("line/targetMarker", null);
    let realLink = LinksManagement.getNodeByName(paper, link);

    let source = realLink.source;
    let target = realLink.target;
    if (curveType === "DagGnnCurve") {
      let color = "rgba(66,103,172,0.3)";
      if (attrs.highlight) color = "rgba(66,103,172,1)";
      path.attr("line/stroke", color);
      path.attr("line/targetMarker/stroke", color);
      path.set("z", -1);
    } else if (curveType === "AAAICurve") {
      let color = "rgba(240,157,68,0.3)";
      if (attrs.highlight) color = "rgba(240,157,68,1)";
      path.attr("line/stroke", color);
      path.attr("line/targetMarker/stroke", color);
      path.set("z", -1);
    }

    if (curveType === "TreeCurve") {
      source = attrs.source;
      target = attrs.target;
      path.connector("TreeCurve", { points: attrs.points, value: value });
    } else if (!points.length) {
      path.connector(curveType, {
        points: [nodesList[sIndex], nodesList[tIndex]],
        value: value,
        radius: 12,
      });
    } else if (curveType === "ExtractedCurve")
      path.connector(curveType, {
        points,
        value: value,
        radius: 8 * attrs.gap,
      });
    else
      path.connector(curveType, {
        points,
        value: value,
      });
    path.source(source);
    path.target(target);
    path.addTo(paper.model);
  }
}
