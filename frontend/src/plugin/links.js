import { LinksManagement } from "@/plugin/joint/linkAndNode.js";
import * as joint from "jointjs";

export class findLink {
  static showSameDireLink(link, linksList) {
    let index = linksList.findIndex((item) => {
      if (
        item.source === link.source &&
        item.target === link.target &&
        !item.reverse
      )
        return true;
      else if (
        item.target === link.source &&
        item.source === link.target &&
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
  static showReverseLink(link, linksList) {
    let index = linksList.findIndex((item) => {
      if (
        item.source === link.source &&
        item.target === link.target &&
        item.reverse
      )
        return true;
      else if (
        item.target === link.source &&
        item.source === link.target &&
        !item.reverse
      )
        return true;
      else return false;
    });
    return index;
  }
}

export class linksOperation {
  static addLink(pos, link, paper, curveType, gap) {
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
    let value = Math.abs(link.value);

    if (value > 1.2) value = 1.2;
    path.attr({
      id: "(" + link.source + ", " + link.target + ")",
      line: {
        strokeWidth: value * 8 + "",
        targetMarker: {
          // minute hand
          type: "path",
          stroke: "black",
          "stroke-width": value * 7,
          fill: "transparent",
          d: "M 10 -5 0 0 10 5 ",
        },
      },
    });
    let index = findLink.sameNodeLink(link, linksList);
    let points = [nodesList[sIndex], nodesList[tIndex]];
    console.log(index, "points index");
    if (index > -1) {
      points = linksList[index].points.concat([]);
      if (link.source !== linksList[index].source) {
        points.reverse();
      }
    }
    switch (curveType) {
      case "SuperCurve":
        path.connector(curveType, {
          points,
          value: value * 7,
        });
        break;
      case "ExtractedCurve":
        path.connector(curveType, {
          points,
          value: value * 7,
          radius: 7 * gap,
        });
        break;
      default:
        break;
    }
    if (link.value < 0) path.attr("line/strokeDasharray", "4 4");

    if (LinksManagement.isLinkDown(paper, link))
      path.attr("line/targetMarker", null);
    let realLink = LinksManagement.getNodeByName(paper, link);
    let source = realLink.source;
    let target = realLink.target;

    path.source(source);
    path.target(target);
    path.addTo(paper.model);
  }
}
