import dagre from "dagre";
const getNodeIndex = (id, data) => {
    let indexes = [];
    for (let i = 0; i < data.selections.length; i++) {
        let selection = data.selections[i];
        if (selection.outcome === id) indexes.push(i);
        else if (selection.variable.includes(id)) indexes.push(i);
    }
    return indexes;
};
const manageGroupId = (groupsId, idGroups, indexes) => {
    let index = indexes.join();
    if (groupsId.includes(index)) return;
    let i;
    for (i = 0; i < idGroups.length; i++) {
        if (idGroups[i].length >= indexes.length) break;
    }
    if (i === idGroups.length) {
        idGroups.push(indexes);
        groupsId.push(index);
    } else if (i === 0) {
        idGroups.unshift(indexes);
        groupsId.unshift(index);
    } else {
        idGroups.splice(i, 0, indexes);
        groupsId.splice(i, 0, index);
    }
};
const findparent = (idGroups, i) => {
    let group = idGroups[i];
    let index;
    for (index = i + 1; index < idGroups.length; index++) {
        let nowGroup = idGroups[index];
        let flag = true;
        group.forEach((number) => {
            if (!nowGroup.includes(number)) flag = false;
        });
        if (flag) break;
    }
    if (index >= idGroups.length) return "";
    else return idGroups[index].join();
};
export const getAnchoredGraph = (g, data) => {
    console.log("anchor");
    var states = data.nodesList;

    let groupsId = []; //string
    let idGroups = []; //series

    states.forEach(function (state) {
        let indexes = getNodeIndex(state.id, data);
        let index = indexes.join();
        manageGroupId(groupsId, idGroups, indexes);
        g.setParent(state.id, "group" + index);
    });
    for (let i = 0; i < groupsId.length; i++) {
        g.setNode("group" + groupsId[i], {
            label: "",
            clusterLabelPos: "bottom",
            style:
                "stroke-width:0;stroke:transparent;fill: transparent;opacity: 0;",
        });
        let parent = findparent(idGroups, i);
        if (parent) g.setParent("group" + groupsId[i], "group" + parent);
    }
    dagre.layout(g);
};