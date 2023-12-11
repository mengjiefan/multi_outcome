import { findLink } from "@/plugin/links";
import historyManage from "@/plugin/history";
const getNode = (nodeView) => {
  return nodeView.model.attributes.attrs.title;
};
export class LinksManagement {
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
    if (linksList[index].reverse) linksList[index].reverse = false;
    else linksList[index].reverse = true;
    return this.getFinalLink(linksList[index]);
  }
}
