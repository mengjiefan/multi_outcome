import { LinksManagement } from "@/plugin/joint/linkAndNode.js";
import * as joint from "jointjs";

export class findLink {
  static showSameDireLink(originalLink, originalLinkList) {
    let link = LinksManagement.getFinalLink(originalLink);
    let linksList = LinksManagement.getFinalLinks(originalLinkList);
    let index = linksList.findIndex((item) => {
      if (item.source === link.source && item.target === link.target)
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
  static showReverseLink(originalLink, originalLinkList) {
    let link = LinksManagement.getFinalLink(originalLink);
    let linksList = LinksManagement.getFinalLinks(originalLinkList);

    let index = linksList.findIndex((item) => {
      if (item.target === link.source && item.source === link.target)
        return true;
      else return false;
    });
    return index;
  }
}
const countControl = (source, target, mid) => {
  let x = (source.x + target.x) / 2;
  let y = (source.y + target.y) / 2;

  let offset = (target.y - source.y) * 0.15;
  if (source.x !== target.x) {
    offset = Math.abs(offset);
    if (x < mid) x = x - offset;
    else x = x + offset;
    return { x, y };
  } else return { x: x + offset, y };
};

export class linksOperation {
  static recalLinkValue(value) {
    let newV = Math.abs(value);
    return Math.log(newV + 1.01) / Math.log(2);
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

    if (curveType === "TreeCurve") {
      source = attrs.source;
      target = attrs.target;
      let point = countControl(nodesList[sIndex], nodesList[tIndex], attrs.mid);
      points = [nodesList[sIndex], point, nodesList[tIndex]];
      path.connector("TreeCurve", { points: points, value: value });
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
