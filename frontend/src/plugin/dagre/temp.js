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
function run(g) {
  var fas = (g.graph().acyclicer === "greedy"
      ? greedyFAS(g, weightFn(g))
      : dfsFAS(g));
  fas.forEach(function (e) {
      var label = g.edge(e);
      g.removeEdge(e);
      label.forwardName = e.name;
      label.reversed = true;
      g.setEdge(e.w, e.v, label, uniqueId("rev"));
  });

  function weightFn(g) {
      return function (e) {
          return g.edge(e).weight;
      };
  }
}
