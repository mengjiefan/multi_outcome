
const getNode = (nodeView) => {
    return nodeView.model.attributes.attrs.title;
}
export class LinksManagement {

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
        let realLink = LinksManagement.getLinkNode(paper, link);
        let realItem = LinksManagement.getLinkNode(paper, item);
        return (
            link.id !== item.id &&
            realItem.source === realLink.source &&
            realItem.target === realLink.target)
    }
    static reversedLink(paper,link, item) {
        let realLink = LinksManagement.getLinkNode(paper, link);
        let realItem = LinksManagement.getLinkNode(paper, item);
        return (
            realItem.target === realLink.source &&
            realItem.source === realLink.target)
    }
}