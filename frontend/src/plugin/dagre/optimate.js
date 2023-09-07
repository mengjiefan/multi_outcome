export function layout(g) {
    var t = feasibleTree(g);
    g.nodes().forEach(v => {
        console.log(v, g.node(v).rank)
    })
    initLowLimValues(t);
    initCutValues(t, g);
    var e, f;

    while ((e = leaveEdge(t))) {
        f = enterEdge(t, g, e);
        exchangeEdges(t, g, e, f);
    }
}
function feasibleTree(g) {
    var t = new Graph({ directed: false });
    //console.log(g.nodes(), 'feasible')
    // Choose arbitrary node from which to start our tree

    //var start = g.nodes()[0];
    var size = g.nodeCount();
    //t.setNode(start, {});
    g.nodes().forEach(v => {
        let node = g.node(v);
        if (node.fixed) t.setNode(v, {});
    })
    g.edges().forEach(e => {
        let source = g.node(e.v);
        let target = g.node(e.w);
        if (source.fixed && target.fixed) {
            t.setEdge(e.v, e.w, {});
        }
    })
    //把fixed的点和边都先加入紧致树
    var edge, delta;
    while (tightTree(t, g) < size) {
        edge = findMinSlackEdge(t, g);
        delta = t.hasNode(edge.v) ? slack(g, edge) : -slack(g, edge);
        shiftRanks(t, g, delta);
    }


    return t;
}
function tightTree(t, g) {
    function dfs(v) {
        g.nodeEdges(v).forEach(function (e) {
            var edgeV = e.v,
                w = (v === edgeV) ? e.w : edgeV;
            if (!t.hasNode(w) && !slack(g, e)) {
                t.setNode(w, {});
                t.setEdge(v, w, {});
                dfs(w);
            }
        });
    }

    t.nodes().forEach(dfs);
    return t.nodeCount();
}
/*
 * Finds the edge with the smallest slack that is incident on tree and returns
 * it.
 */
function findMinSlackEdge(t, g) {
    const edges = g.edges();

    return edges.reduce((acc, edge) => {
        let edgeSlack = Number.POSITIVE_INFINITY;
        if (t.hasNode(edge.v) !== t.hasNode(edge.w)) {
            edgeSlack = slack(g, edge);
        }

        if (edgeSlack < acc[0]) {
            return [edgeSlack, edge];
        }

        return acc;
    }, [Number.POSITIVE_INFINITY, null])[1];
}

function initLowLimValues(tree, root) {
    if (arguments.length < 2) {
        root = tree.nodes()[0];
    }
    dfsAssignLowLim(tree, {}, 1, root);
}

function dfsAssignLowLim(tree, visited, nextLim, v, parent) {
    var low = nextLim;
    var label = tree.node(v);

    visited[v] = true;
    tree.neighbors(v).forEach(function (w) {
        if (!visited.hasOwnProperty(w)) {
            nextLim = dfsAssignLowLim(tree, visited, nextLim, w, v);
        }
    });

    label.low = low;
    label.lim = nextLim++;
    if (parent) {
        label.parent = parent;
    } else {
        // TODO should be able to remove this when we incrementally update low lim
        delete label.parent;
    }

    return nextLim;
}

function leaveEdge(tree) {
    return tree.edges().find(e => tree.edge(e).cutvalue < 0);
}

function enterEdge(t, g, edge) {
    var v = edge.v;
    var w = edge.w;

    // For the rest of this function we assume that v is the tail and w is the
    // head, so if we don't have this edge in the graph we should flip it to
    // match the correct orientation.
    if (!g.hasEdge(v, w)) {
        v = edge.w;
        w = edge.v;
    }

    var vLabel = t.node(v);
    var wLabel = t.node(w);
    var tailLabel = vLabel;
    var flip = false;

    // If the root is in the tail of the edge then we need to flip the logic that
    // checks for the head and tail nodes in the candidates function below.
    if (vLabel.lim > wLabel.lim) {
        tailLabel = wLabel;
        flip = true;
    }

    var candidates = g.edges().filter(function (edge) {
        return flip === isDescendant(t, t.node(edge.v), tailLabel) &&
            flip !== isDescendant(t, t.node(edge.w), tailLabel);
    });

    return candidates.reduce((acc, edge) => {
        if (slack(g, edge) < slack(g, acc)) {
            return edge;
        }

        return acc;
    });
}

function exchangeEdges(t, g, e, f) {
    var v = e.v;
    var w = e.w;
    t.removeEdge(v, w);
    t.setEdge(f.v, f.w, {});
    initLowLimValues(t);
    initCutValues(t, g);
    updateRanks(t, g);
}

function updateRanks(t, g) {
    var root = t.nodes().find(v => !g.node(v).parent);
    var vs = preorder(t, root);
    vs = vs.slice(1);
    vs.forEach(function (v) {
        var parent = t.node(v).parent,
            edge = g.edge(v, parent),
            flipped = false;
        if (!edge) {
            edge = g.edge(parent, v);
            flipped = true;
        }

        const old = g.node(v).rank;
        if (g.node(v).fixed)
            console.log('update', v, old)
        g.node(v).rank = g.node(parent).rank + (flipped ? edge.minlen : -edge.minlen);
    });
}