function layout(g, opts) {
  var time = opts && opts.debugTiming ? util.time : util.notime;
  time("layout", function () {
    var layoutGraph =
      // time("  buildLayoutGraph", function () { return buildLayoutGraph(g); });
      time("  runLayout", function () { runLayout(layoutGraph, time); });
    time("  updateInputGraph", function () { updateInputGraph(g, layoutGraph); });
  });
}

function runLayout(g, time) {
  time("    makeSpaceForEdgeLabels", function () { makeSpaceForEdgeLabels(g); });
  time("    removeSelfEdges", function () { removeSelfEdges(g); });
  time("    acyclic", function () { acyclic.run(g); });
  time("    nestingGraph.run", function () { nestingGraph.run(g); });
  time("    rank", function () { rank(util.asNonCompoundGraph(g)); });
  time("    injectEdgeLabelProxies", function () { injectEdgeLabelProxies(g); });
  time("    removeEmptyRanks", function () { removeEmptyRanks(g); });
  time("    nestingGraph.cleanup", function () { nestingGraph.cleanup(g); });
  //
  time("    normalizeRanks", function () { normalizeRanks(g); });
  time("    assignRankMinMax", function () { assignRankMinMax(g); });
  time("    removeEdgeLabelProxies", function () { removeEdgeLabelProxies(g); });
  time("    normalize.run", function () { normalize.run(g); });
  time("    parentDummyChains", function () { parentDummyChains(g); });
  time("    addBorderSegments", function () { addBorderSegments(g); });
  time("    order", function () { order(g); });
  time("    insertSelfEdges", function () { insertSelfEdges(g); });
  time("    adjustCoordinateSystem", function () { coordinateSystem.adjust(g); });
  time("    position", function () { position(g); });
  time("    positionSelfEdges", function () { positionSelfEdges(g); });
  time("    removeBorderNodes", function () { removeBorderNodes(g); });
  time("    normalize.undo", function () { normalize.undo(g); });
  time("    fixupEdgeLabelCoords", function () { fixupEdgeLabelCoords(g); });
  time("    undoCoordinateSystem", function () { coordinateSystem.undo(g); });
  time("    translateGraph", function () { translateGraph(g); });
  time("    assignNodeIntersects", function () { assignNodeIntersects(g); });
  time("    reversePoints", function () { reversePointsForReversedEdges(g); });
  time("    acyclic.undo", function () { acyclic.undo(g); });
}
function networkSimplex(g) {
  g = simplify(g);
  initRank(g);
  var t = feasibleTree(g);
  initLowLimValues(t);
  initCutValues(t, g);

  var e, f;
  while ((e = leaveEdge(t))) {
    f = enterEdge(t, g, e);
    exchangeEdges(t, g, e, f);
  }
}
function simplify(g) {
  var simplified = new Graph().setGraph(g.graph());
  g.nodes().forEach(v => simplified.setNode(v, g.node(v)));
  g.edges().forEach(e => {
    var simpleLabel = simplified.edge(e.v, e.w) || { weight: 0, minlen: 1 };
    var label = g.edge(e);
    simplified.setEdge(e.v, e.w, {
      weight: simpleLabel.weight + label.weight,
      minlen: Math.max(simpleLabel.minlen, label.minlen)
    });
  });
  return simplified;
}
/*
 * Initializes ranks for the input graph using the longest path algorithm. This
 * algorithm scales well and is fast in practice, it yields rather poor
 * solutions. Nodes are pushed to the lowest layer possible, leaving the bottom
 * ranks wide and leaving edges longer than necessary. However, due to its
 * speed, this algorithm is good for getting an initial ranking that can be fed
 * into other algorithms.
 *
 * This algorithm does not normalize layers because it will be used by other
 * algorithms in most cases. If using this algorithm directly, be sure to
 * run normalize at the end.
 *
 * Pre-conditions:
 *
 *    1. Input graph is a DAG.
 *    2. Input graph node labels can be assigned properties.
 *
 * Post-conditions:
 *
 *    1. Each node will be assign an (unnormalized) "rank" property.
 */
function longestPath(g) {
  var visited = {};

  function dfs(v) {
    var label = g.node(v);
    if (visited.hasOwnProperty(v)) {
      return label.rank;
    }
    visited[v] = true;

    var rank = Math.min(...g.outEdges(v).map(e => {
      if (e == null) {
        return Number.POSITIVE_INFINITY;
      }

      return dfs(e.w) - g.edge(e).minlen;
    }));

    if (rank === Number.POSITIVE_INFINITY) {
      rank = 0;
    }

    return (label.rank = rank);
  }

  g.sources().forEach(dfs);
}