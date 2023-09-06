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

      g.node(v).rank = g.node(parent).rank + (flipped ? edge.minlen : -edge.minlen);
  });
}