import { findLink } from "@/plugin/links";
import historyManage from "@/plugin/history";
const getNode = (nodeView) => {
  return nodeView.model.attributes.attrs.title;
};
export class LinksManagement {
  static highLightBlueLink(linkView) {
    let color = linkView.model.attributes.attrs.line.stroke;
    if (color.includes("rgba(66,103,172")) {
      linkView.model.attr("line/targetMarker/stroke", "rgba(66,103,172,1)");
      linkView.model.attr("line/stroke", "rgba(66,103,172,1)");
    }
  }
  static highLightOrangeLink(linkView) {
    let color = linkView.model.attributes.attrs.line.stroke;
    if (color.includes("rgba(240,157,68")) {
      linkView.model.attr("line/targetMarker/stroke", "rgba(240,157,68,1)");
      linkView.model.attr("line/stroke", "rgba(240,157,68,1)");
    }
  }
  static removeLightOrangeLink(linkView) {
    let color = linkView.model.attributes.attrs.line.stroke;
    if (color.includes("rgba(240,157,68")) {
      linkView.model.attr("line/targetMarker/stroke", "rgba(240,157,68,0.1)");
      linkView.model.attr("line/stroke", "rgba(240,157,68,0.1)");
    }
  }
  static removeLightBlueLink(linkView) {
    let color = linkView.model.attributes.attrs.line.stroke;
    if (color.includes("rgba(66,103,172")) {
      //daggnn
      linkView.model.attr("line/targetMarker/stroke", "rgba(66,103,172,0.1)");
      linkView.model.attr("line/stroke", "rgba(66,103,172,0.1)");
    }
  }
  static highLightBlackLink(linkView) {
    let color = linkView.model.attributes.attrs.line.stroke;
    if (
      !color.includes("rgba(66,103,172") &&
      !color.includes("rgba(240,157,68")
    ) {
      //PC
      linkView.model.attr("line/targetMarker/stroke", "black");
      linkView.model.attr("line/stroke", "black");
    }
  }
  static removeLightBlackLink(linkView) {
    let color = linkView.model.attributes.attrs.line.stroke;
    if (
      !color.includes("rgba(66,103,172") &&
      !color.includes("rgba(240,157,68")
    ) {
      //PC
      linkView.model.attr("line/targetMarker/stroke", "rgba(0,0,0,0.1)");
      linkView.model.attr("line/stroke", "rgba(0,0,0,0.1)");
    }
  }
  static highLightBlueLinks(paper) {
    let graph = paper.model.attributes.cells.graph;
    graph.getLinks().forEach((link) => {
      let linkView = link.findView(paper);
      this.highLightBlueLink(linkView);
      this.removeLightOrangeLink(linkView);
      this.removeLightBlackLink(linkView);
    });
  }
  static highLightOrangeLinks(paper) {
    let graph = paper.model.attributes.cells.graph;
    graph.getLinks().forEach((link) => {
      let linkView = link.findView(paper);
      this.removeLightBlueLink(linkView);
      this.highLightOrangeLink(linkView);
      this.removeLightBlackLink(linkView);
    });
  }
  static highLightBlackLinks(paper) {
    let graph = paper.model.attributes.cells.graph;
    graph.getLinks().forEach((link) => {
      let linkView = link.findView(paper);
      this.removeLightBlueLink(linkView);
      this.removeLightOrangeLink(linkView);
      this.highLightBlackLink(linkView);
    });
  }
  static removeLightLinks(paper) {
    let graph = paper.model.attributes.cells.graph;
    graph.getLinks().forEach((link) => {
      let linkView = link.findView(paper);
      this.highLightBlueLink(linkView);
      this.highLightOrangeLink(linkView);
      this.highLightBlackLink(linkView);
    });
  }
  static removeLinks(paper, type) {
    let graph = paper.model.attributes.cells.graph;
    graph.getLinks().forEach((item) => {
      let linkView = item.findView(paper);
      let color = linkView.model.attributes.attrs.line.stroke;
      if (type === "blue" && color.includes("rgba(66,103,172"))
        linkView.model.remove({ ui: true });
      else if (type === "orange" && color.includes("rgba(240,157,68"))
        linkView.model.remove({ ui: true });
      else if (
        type === "black" &&
        !color.includes("rgba(66,103,172") &&
        !color.includes("rgba(240,157,68")
      )
        linkView.model.remove({ ui: true });
    });
  }
  static getNodeByName(paper, link) {
    let graph = paper.model.attributes.cells.graph;
    let sourceNode = null;
    let targetNode = null;
    graph.getElements().forEach((node) => {
      if (getNode(node.findView(paper)) === link.source) sourceNode = node;
    });
    graph.getElements().forEach((node) => {
      if (getNode(node.findView(paper)) === link.target) targetNode = node;
    });
    return { source: sourceNode, target: targetNode };
  }
  static isLinkDown(paper, link) {
    let realLink = this.getNodeByName(paper, link);
    if (
      realLink.source.attributes.position.y <
      realLink.target.attributes.position.y
    )
      return true;
    else return false;
  }
  static getLinkNode(paper, link) {
    let graph = paper.model.attributes.cells.graph;
    let sourceNode = null;
    let targetNode = null;
    graph.getElements().forEach((node) => {
      if (node.id === link.get("source").id) sourceNode = node;
    });
    graph.getElements().forEach((node) => {
      if (node.id === link.get("target").id) targetNode = node;
    });
    let source = getNode(sourceNode.findView(paper));
    let target = getNode(targetNode.findView(paper));
    return { source, target };
  }
  static dubplicateLink(paper, link, item) {
    let realLink = this.getLinkNode(paper, link);
    let realItem = this.getLinkNode(paper, item);
    return (
      link.id !== item.id &&
      realItem.source === realLink.source &&
      realItem.target === realLink.target
    );
  }
  static reversedLink(paper, link, item) {
    let realLink = LinksManagement.getLinkNode(paper, link);
    let realItem = LinksManagement.getLinkNode(paper, item);
    return (
      realItem.target === realLink.source && realItem.source === realLink.target
    );
  }
  static getFinalLink(link) {
    let ans = link;
    if (link.reverse) {
      ans = {
        source: link.target,
        target: link.source,
        value: link.value,
      };
    } else if (link.add) {
      ans = {
        source: link.source,
        target: link.target,
        value: link.value,
      };
    }
    if (link.hidden) ans.hidden = link.hidden;

    return ans;
  }
  //保留add
  static getFinalLinks(linksList) {
    let links = linksList.filter((link) => !link.hidden);
    links = links.map((link) => {
      return this.getFinalLink(link);
    });
    return links;
  }
  //去除add
  static getLayoutLinks(linksList) {
    let links = linksList.filter((link) => !link.add);
    links = links.map((link) => {
      return this.getFinalLink(link);
    });
    return links;
  }

  static reverseLink(link, linksList, history) {
    let index = findLink.showSameDireLink(link, linksList);
    historyManage.reverseEdge(history, link);
    linksList[index].value = link.value;
    linksList[index].reverse = !linksList[index].reverse;
    return this.getFinalLink(linksList[index]);
  }
}
