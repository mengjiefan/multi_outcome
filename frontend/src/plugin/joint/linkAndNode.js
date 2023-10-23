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
  static getFinalLinks(linksList) {
    let links = linksList.filter((link) => !link.hidden);
    links = links.map((link) => {
      if (link.reverse) {
        return {
          source: link.target,
          target: link.source,
          value: link.value,
        };
      } else if (link.add) {
        return {
          source: link.source,
          target: link.target,
          value: link.value,
        };
      } else return link;
    });
    return links;
  }
  static reverseLink(link) {
    let source = link.source;
    let target = link.target;
    link.target = source;
    link.source = target;
  }
}
