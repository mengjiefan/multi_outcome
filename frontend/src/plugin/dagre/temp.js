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
function positionX(g) {
  var layering = util.buildLayerMatrix(g);
  var conflicts = Object.assign(
    findType1Conflicts(g, layering),
    findType2Conflicts(g, layering));
  var xss = {};
  var adjustedLayering;
  ["u", "d"].forEach(function (vert) {
    adjustedLayering = vert === "u" ? layering : Object.values(layering).reverse();
    ["l", "r"].forEach(function (horiz) {
      if (horiz === "r") {
        adjustedLayering = adjustedLayering.map(inner => {
          return Object.values(inner).reverse();
        });
      }

      var neighborFn = (vert === "u" ? g.predecessors : g.successors).bind(g);
      var align = verticalAlignment(g, adjustedLayering, conflicts, neighborFn);
      var xs = horizontalCompaction(g, adjustedLayering,
        align.root, align.align, horiz === "r");
      if (horiz === "r") {
        xs = util.mapValues(xs, x => -x);
      }
      xss[vert + horiz] = xs;
    });
  });


  var smallestWidth = findSmallestWidthAlignment(g, xss);
  alignCoordinates(xss, smallestWidth);
  return balance(xss, g.graph().align);
}
/*
 * Try to align nodes into vertical "blocks" where possible. This algorithm
 * attempts to align a node with one of its median neighbors. If the edge
 * connecting a neighbor is a type-1 conflict then we ignore that possibility.
 * If a previous node has already formed a block with a node after the node
 * we're trying to form a block with, we also ignore that possibility - our
 * blocks would be split in that scenario.
 */
function verticalAlignment(g, layering, conflicts, neighborFn) {
  var root = {},
    align = {},
    pos = {};

  // We cache the position here based on the layering because the graph and
  // layering may be out of sync. The layering matrix is manipulated to
  // generate different extreme alignments.
  let firstFixed = null;
  layering.forEach(function (layer) {
    layer.forEach(function (v, order) {
      root[v] = v;
      align[v] = v;
      pos[v] = order;
    });
  });
  layering.forEach(function (layer) {
    var prevIdx = -1;
    layer.forEach(function (v) {
      var ws = neighborFn(v);
      if (ws.length) {
        ws = ws.sort((a, b) => pos[a] - pos[b]);
        console.log('v', v, g.node(v).rank, g.node(v).order)
        ws.forEach(id => {
          let node = g.node(id);
          console.log(node.rank, node.order)
        })
        var mp = (ws.length - 1) / 2;

        for (var i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
          var w = ws[i];
          if (align[v] === v &&
            prevIdx < pos[w] &&
            !hasConflict(conflicts, v, w)) {
            align[w] = v;
            align[v] = root[v] = root[w];
            prevIdx = pos[w];
          }
        }
      }
    });
  });



  return { root: root, align: align };
}
//align
function verticalAlignment(g, layering, conflicts, neighborFn) {
  var root = {},
    align = {},
    pos = {};

  // We cache the position here based on the layering because the graph and
  // layering may be out of sync. The layering matrix is manipulated to
  // generate different extreme alignments.
  let firstFixed = null;
  layering.forEach(function (layer) {
    layer.forEach(function (v, order) {
      root[v] = v;
      align[v] = v;
      pos[v] = order;
    });
  });
  layering.forEach(function (layer) {
    var prevIdx = -1;
    layer.forEach(function (v) {
      var ws = neighborFn(v);
      let now = g.node(v);
      if (now.fixed && firstFixed) {
        align[firstFixed] = v;
        align[v] = root[v] = root[firstFixed];
        prevIdx = pos[firstFixed];
      }
      else if (ws.length) {
        if (now.fixed) firstFixed = v;
        ws = ws.sort((a, b) => pos[a] - pos[b]);
        console.log('v', v, g.node(v).rank, g.node(v).order)
        ws.forEach(id => {
          let node = g.node(id);
          console.log(node.rank, node.order)
        })
        var mp = (ws.length - 1) / 2;

        for (var i = Math.floor(mp), il = mp.length; i <= il; ++i) {
          var w = ws[i];
          if (align[v] === v &&
            prevIdx < pos[w] &&
            !hasConflict(conflicts, v, w)) {
            align[w] = v;
            align[v] = root[v] = root[w];
            prevIdx = pos[w];

            console.log('align', v, g.node(w).order)
          }
        }
      }
    });
  });



  return { root: root, align: align };
}
function verticalAlignment(g, layering, conflicts, neighborFn) {
  var root = {},
      align = {},
      pos = {};

  // We cache the position here based on the layering because the graph and
  // layering may be out of sync. The layering matrix is manipulated to
  // generate different extreme alignments.
  let firstFixed = null;
  layering.forEach(function (layer) {
      layer.forEach(function (v, order) {
          root[v] = v;
          align[v] = v;
          pos[v] = order;
      });
  });
  layering.forEach(function (layer) {
      var prevIdx = -1;
      let alignFixed = -1;
      let fixedIndex = layer.findIndex(node => {
          if (g.node(node).fixed) return true;
          else return false;
      })

      if (fixedIndex > -1) {
          let v = layer[fixedIndex];
          let now = g.node(v);
          if (now.fixed && firstFixed) {
              align[firstFixed] = v;
              align[v] = root[v] = root[firstFixed];
              alignFixed = pos[firstFixed];
          } else if (now.fixed) {
              firstFixed = v;
              fixedIndex = -1;
          }
      }
      for (let index = 0; index < fixedIndex; index++) {
          let v = layer[index];
          var ws = neighborFn(v);
          if (ws.length) {
              ws = ws.sort((a, b) => pos[a] - pos[b]);
              console.log('v', v, g.node(v).rank, g.node(v).order)
              ws.forEach(id => {
                  let node = g.node(id);
                  console.log(node.rank, node.order)
              })
              var mp = (ws.length - 1) / 2;

              for (var i = 0, il = Math.ceil(mp); i <= il; ++i) {
                  var w = ws[i];
                  if (align[v] === v &&
                      prevIdx < pos[w] && pos[w] < alignFixed &&
                      !hasConflict(conflicts, v, w)) {
                      align[w] = v;
                      align[v] = root[v] = root[w];
                      prevIdx = pos[w];
                      console.log('align', v, g.node(w).order)
                  }
              }
          }
      }
      prevIdx = alignFixed;
      for (let index = fixedIndex + 1; index < layer.length; index++) {
          let v = layer[index];
          var ws = neighborFn(v);
          if (ws.length) {
              ws = ws.sort((a, b) => pos[a] - pos[b]);
              console.log('v', v, g.node(v).rank, g.node(v).order)
              ws.forEach(id => {
                  let node = g.node(id);
                  console.log(node.rank, node.order)
              })
              var mp = (ws.length - 1) / 2;

              for (var i = Math.floor(mp), il = mp.length - 1; i <= il; ++i) {
                  var w = ws[i];
                  if (align[v] === v &&
                      prevIdx < pos[w] &&
                      !hasConflict(conflicts, v, w)) {
                      align[w] = v;
                      align[v] = root[v] = root[w];
                      prevIdx = pos[w];
                      console.log('align', v, g.node(w).order)
                  }
              }
          }
      }
  });
  return { root: root, align: align };
}
function assignOrder(g, layering) {
  let fixedIndex = -1;
  Object.values(layering).forEach(layer => {
      let nowIndex = -1;
      layer.forEach((v, i) => {
          let node = g.node(v);
          g.node(v).order = i;
          if (node.fixed) {
              if (fixedIndex > -1) {
                  nowIndex = i;
                  g.node(v).order = fixedIndex;
              }
              else fixedIndex = i;
          }
      })
      if (nowIndex > -1 && fixedIndex > -1)
          layer.forEach((v, i) => {
              if (i === fixedIndex && !g.node(v).fixed)
                  g.node(v).order = nowIndex;
          })
  });
}
function assignOrder(g, layering) {
  Object.values(layering).forEach(layer => layer.forEach((v, i) => {
      g.node(v).order = i;
      if (g.node(v).fixed)
          console.log(v, g.node(v), i);
  }));
}
            /*
             * Align the coordinates of each of the layout alignments such that
             * left-biased alignments have their minimum coordinate at the same point as
             * the minimum coordinate of the smallest width alignment and right-biased
             * alignments have their maximum coordinate at the same point as the maximum
             * coordinate of the smallest width alignment.
             */
            function alignCoordinates(xss, alignTo) {
              var alignToVals = Object.values(alignTo),
                  alignToMin = Math.min(...alignToVals),
                  alignToMax = Math.max(...alignToVals);

              ["u", "d"].forEach(function (vert) {
                  ["l", "r"].forEach(function (horiz) {
                      var alignment = vert + horiz,
                          xs = xss[alignment];

                      if (xs === alignTo) return;

                      var xsVals = Object.values(xs);
                      let delta = alignToMin - Math.min(...xsVals);
                      if (horiz !== "l") {
                          delta = alignToMax - Math.max(...xsVals);
                      }

                      if (delta) {
                          xss[alignment] = util.mapValues(xs, x => x + delta);
                      }
                  });
              });
          }