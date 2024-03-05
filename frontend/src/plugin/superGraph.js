import * as joint from "jointjs";
import "/node_modules/jointjs/dist/joint.css";
import * as d3 from "d3";
//import { getAnchoredGraph } from "@/plugin/super/anchor.js";
import { LinksManagement } from "@/plugin/joint/linkAndNode.js";
import dagre from "dagre";
import { linksOperation } from "./links";

const cmap = [
  "#FF595E",
  "#FF924C",
  "#FFCA3A",
  "#C5CA30",
  "#8AC926",
  "#36949D",
  "#1982C4",
  "#4267AC",
  "#565AA0",
  "#6A4C93",
];
let gap = 1;
let startX;
let startY;
const countXPos = (x) => {
  return x * gap;
};
const countYPos = (y) => {
  return y * gap;
};

const moveRight = (points) => {
  let value = 5;
  let newPoints = [];
  if (points[points.length - 1].x === points[0].x)
    return points.map((point) => {
      let newx = point.x + value;
      return { x: newx, y: point.y };
    });
  // Find the slope of the line connecting the first and last points
  const slope =
    (points[points.length - 1].y - points[0].y) /
    (points[points.length - 1].x - points[0].x);

  // Find the angle of the line
  const angle = Math.atan(slope);

  // Calculate the horizontal and vertical shifts
  let shiftY = Math.cos(angle) * value;
  let shiftX = Math.sin(angle) * value;
  if (shiftX < 0) {
    shiftX = 0 - shiftX;
    shiftY = 0 - shiftY;
  }

  // Adjust each point
  newPoints = points.map((point) => {
    let newX = point.x + shiftX;
    let newY = point.y - shiftY;
    return { x: newX, y: newY };
  });

  return newPoints;
};
const moveLeft = (points) => {
  let value = 5;
  let newPoints = [];
  if (points[points.length - 1].x === points[0].x)
    return points.map((point) => {
      let newx = point.x - value;
      return { x: newx, y: point.y };
    });
  // Find the slope of the line connecting the first and last points
  const slope =
    (points[points.length - 1].y - points[0].y) /
    (points[points.length - 1].x - points[0].x);

  // Find the angle of the line
  const angle = Math.atan(slope);

  // Calculate the horizontal and vertical shifts
  let shiftY = Math.cos(angle) * value;
  let shiftX = Math.sin(angle) * value;
  if (shiftX > 0) {
    shiftX = 0 - shiftX;
    shiftY = 0 - shiftY;
  }

  // Adjust each point
  newPoints = points.map((point) => {
    let newX = point.x + shiftX;
    let newY = point.y - shiftY;
    return { x: newX, y: newY };
  });

  return newPoints;
};

const countAnchor = (last, center, radius) => {
  let distance = Math.sqrt(
    (center.x - last.x) * (center.x - last.x) +
      (center.y - last.y) * (center.y - last.y)
  );
  let x = center.x + ((last.x - center.x) * radius) / distance;
  let y = center.y + ((last.y - center.y) * radius) / distance;
  return { x, y };
};
const addTool = (element, paper) => {
  function getMarkup(angle = 0) {
    return [
      {
        title: element.attr("title"),
        tagName: "circle",
        selector: "button",
        attributes: {
          r: 5,
          fill: "transparent",
          stroke: "transparent",
          cursor: "pointer",
        },
      },
      {
        title: element.attr("title"),
        tagName: "path",
        selector: "icon",
        attributes: {
          transform: `rotate(${angle})`,
          d: "M -2 -1 L 0 -1 L 0 -2 L 2 0 L 0 2 0 1 -2 1 z",
          fill: "#4666E5",
          stroke: "none",
          "stroke-width": 2,
          "pointer-events": "none",
        },
      },
    ];
  }

  const connectBottom = new joint.elementTools.Connect({
    x: "50%",
    y: "100%",
    markup: getMarkup(90),
    magnet: "body",
  });
  const connectTop = new joint.elementTools.Connect({
    x: "50%",
    y: "0%",
    markup: getMarkup(270),
    magnet: "body",
  });
  const hoverButton = new joint.elementTools.HoverConnect({
    useModelGeometry: true,
    trackPath: (view) => {
      view.model.attr(["body", "d"]);
    },
  });

  const tools = new joint.dia.ToolsView({
    tools: [connectTop, connectBottom, hoverButton],
  });
  element.findView(paper).addTools(tools);
};

const handleCellMouseWheel = (paper, x, y, delta) => {
  const oldScale = paper.scale().sx;
  const newScale = oldScale + delta * 0.1;
  scaleToPoint(newScale, x, y, paper);
};
let targetSvg = null;
const handleMouseMove = (paper, e, originalPos) => {
  const translate = paper.translate();

  const nextTx = translate.tx + e.clientX - originalPos.x;
  const nextTy = translate.ty + e.clientY - originalPos.y;
  originalPos.x = e.clientX;
  originalPos.y = e.clientY;

  if (!targetSvg) targetSvg = e.target;
  if (targetSvg !== e.target) {
    return;
  }
  if (!isNaN(nextTx)) {
    paper.translate(nextTx, nextTy);
  }
};
const handleMouseUp = (originalPos) => {
  originalPos.x = NaN;
  originalPos.y = NaN;
  targetSvg = null;
};
const scaleToPoint = (nextScale, x, y, paper) => {
  if (nextScale >= 0.3 && nextScale <= 5) {
    const currentScale = paper.scale().sx;

    const beta = currentScale / nextScale;

    const ax = x - x * beta;
    const ay = y - y * beta;

    const translate = paper.translate();

    const nextTx = translate.tx - ax * nextScale;
    const nextTy = translate.ty - ay * nextScale;

    paper.translate(nextTx, nextTy);
    paper.scale(nextScale);
  }
};

export const setSuperGraph = (g, data) => {
  var states = data.nodesList;
  var edges = data.linksList;
  edges = edges.filter((edge) => !edge.add);
  states.forEach(function (state) {
    let node = {
      label: "",
      type: state.type,
      shape: "circle", // 设置节点形状为圆形
      width: 10,
      height: 10,
    };
    if (node.type === 0) node["index"] = state.index;
    g.setNode(state.id, node);
  });

  edges.forEach(function (edge) {
    let edgeValue = edge.value > 0 ? edge.value * 10 : -edge.value * 10;
    var valString = edgeValue.toString() + "px";
    var widthStr = "stroke-width: " + valString;
    var edgeColor = "stroke: black";
    let completeStyle = edgeColor + ";" + widthStr + ";" + "fill: transparent;";
    if (edge.hidden) {
      g.setEdge(edge.source, edge.target, {
        style:
          "stroke: transparent; fill: transparent; opacity: 0;stroke-width:0",
      });
    } else {
      if (edge.value < 0) {
        completeStyle = completeStyle + "stroke-dasharray:4 4";
      }
      g.setEdge(edge.source, edge.target, {
        style: completeStyle,
        arrowhead: "undirected",
      });
    }
  });

  // Set some general styles
  g.nodes().forEach(function (v) {
    var node = g.node(v);
    node.style = "fill:" + cmap[0];
  });
  dagre.layout(g);
  //getAnchoredGraph(g, data);
};

export const drawSuperGraph = (dom, nodesList, links, scale) => {
  startX = scale.startX;
  startY = scale.startY;
  let paperScale = scale.gap / gap;
  let linksList = links.filter((link) => !link.hidden);
  linksList = linksList.map((link) => {
    let points = link.points.concat([]);
    if (link.reverse)
      return {
        source: link.target,
        target: link.source,
        value: link.value,
        points: points.reverse(),
      };
    else return link;
  });
  let graph = new joint.dia.Graph({});

  let paper = new joint.dia.Paper({
    el: dom,
    model: graph,
    width: "100%",
    height: "100%",
    async: true,
    sorting: joint.dia.Paper.sorting.APPROX,
    linkPinning: false,
    defaultLink: () => new joint.shapes.standard.Link(),
    connectionStrategy: joint.connectionStrategies.pinAbsolute,
    interactive: function (cellView, method) {
      return null;
    },
  });
  for (let nodeI = 0; nodeI < nodesList.length; nodeI++) {
    let faRect = new joint.shapes.standard.Rectangle();

    faRect.resize(24 * gap, 24 * gap);
    faRect.position(
      countXPos(nodesList[nodeI].x) - 12 * gap,
      countYPos(nodesList[nodeI].y) - 12 * gap
    );
    let indexes = nodesList[nodeI].indexes;
    faRect.attr({
      body: {
        strokeWidth: 0,
        stroke: "white",
        strokeDasharray: 2,
        rx: 20 * gap,
        ry: 20 * gap,
        fill: "transparent",
      },
      label: {
        text: nodesList[nodeI].id,
        fill: "black",
        y: 0,
        fontSize: 6 * gap,
      },
      title: nodesList[nodeI].id,
    });
    if (nodesList[nodeI].type === 0) faRect.attr("body/strokeWidth", 3);

    faRect.set("z", 100);
    for (let i = 0; i < indexes.length; i++) {
      let circle = new joint.shapes.standard.Circle();
      let offset = 360 / indexes.length;
      circle.attr({
        body: {
          strokeDasharray: 12 * gap * 3.1415926,
          strokeDashoffset: ((12 * gap * 3.1415926) / 360) * (offset * i),
          fill: "transparent",
          stroke: cmap[indexes[i]],
          strokeWidth: 12 * gap,
        },
      });
      circle.resize(12 * gap, 12 * gap);
      circle.position(
        countXPos(nodesList[nodeI].x) - 6 * gap,
        countYPos(nodesList[nodeI].y) - 6 * gap
      );
      circle.set("z", 50);
      circle.addTo(graph);
    }
    nodesList[nodeI]["node"] = faRect;
    faRect.addTo(graph);
    addTool(faRect, paper);
  }

  var Gen = d3
    .line()
    .x((p) => countXPos(p.x))
    .y((p) => countYPos(p.y))
    .curve(d3.curveBasis);
  joint.connectors.SuperCurve = function (
    sourcePoint,
    targetPoint,
    vertices,
    args
  ) {
    let points = args.points.concat([]);
    if (points.length > 1) {
      let radius = 6.8;
      if (points.length > 2) {
        points[0] = countAnchor(points[1], points[0], radius);
        if (points[points.length - 1].y < points[0].y)
          radius = radius + args.value;
        points[points.length - 1] = countAnchor(
          points[points.length - 2],
          points[points.length - 1],
          radius
        );
      } else {
        points[0] = countAnchor(points[1], points[0], 12);
        points[1] = countAnchor(points[0], points[1], 12);
      }
    }

    return Gen(points);
  };
  joint.connectors.DagGnnCurve = function (
    sourcePoint,
    targetPoint,
    vertices,
    args
  ) {
    let points = args.points.concat([]);
    if (points.length > 1) {
      let radius = 6.8;
      if (points.length > 2) {
        points[0] = countAnchor(points[1], points[0], radius);
        if (points[points.length - 1].y < points[0].y)
          radius = radius + args.value;
        points[points.length - 1] = countAnchor(
          points[points.length - 2],
          points[points.length - 1],
          radius
        );
      } else {
        points[0] = countAnchor(points[1], points[0], 12);
        points[1] = countAnchor(points[0], points[1], 12);
      }
    }
    let newPoints = moveRight(points);

    return Gen(newPoints);
  };
  joint.connectors.AAAICurve = function (
    sourcePoint,
    targetPoint,
    vertices,
    args
  ) {
    let points = args.points.concat([]);
    if (points.length > 1) {
      let radius = 6.8;
      if (points.length > 2) {
        points[0] = countAnchor(points[1], points[0], radius);
        if (points[points.length - 1].y < points[0].y)
          radius = radius + args.value;
        points[points.length - 1] = countAnchor(
          points[points.length - 2],
          points[points.length - 1],
          radius
        );
      } else {
        points[0] = countAnchor(points[1], points[0], 12);
        points[1] = countAnchor(points[0], points[1], 12);
      }
    }
    let newPoints = moveLeft(points);

    return Gen(newPoints);
  };
  linksList.forEach((link) => {
    let path = new joint.shapes.standard.Link({});

    let sindex = nodesList.findIndex((item) => {
      if (item.id === link.source) return true;
      else return false;
    });
    let tindex = nodesList.findIndex((item) => {
      if (item.id === link.target) return true;
      else return false;
    });
    let value = linksOperation.recalLinkValue(link.value);
    path.attr({
      id: "(" + link.source + ", " + link.target + ")",
      line: {
        strokeWidth: value + "",
        targetMarker: {
          // minute hand
          type: "path",
          stroke: "black",
          "stroke-width": value,
          fill: "transparent",
          d: "M 10 -5 0 0 10 5 ",
        },
      },
    });
    if (link.value < 0) {
      path.attr("line/strokeDasharray", "4 4");
    }
    let realLink = LinksManagement.getNodeByName(paper, link);
    let source = realLink.source;
    let target = realLink.target;
    if (nodesList[sindex].y < nodesList[tindex].y)
      path.attr("line/targetMarker", null);

    path.source(source);
    path.target(target);
    path.addTo(graph);

    path.connector("SuperCurve", {
      points: link.points,
      value,
    });
  });

  paper.scale(paperScale);
  paper.translate(startX, startY);

  let originalPos = {
    x: NaN,
    y: NaN,
  };
  paper.on("link:mousewheel", function (linkView, evt, x, y, delta) {
    handleCellMouseWheel(paper, x, y, delta);
  });

  paper.on("blank:mousewheel", function (evt, x, y, delta) {
    handleCellMouseWheel(paper, x, y, delta);
  });

  paper.on("blank:pointermove", function (evt, x, y) {
    handleMouseMove(paper, evt, originalPos);
  });

  paper.on("blank:pointerup", function (evt, x, y) {
    handleMouseUp(originalPos);
  });
  paper.on("link:pointerup", function (linkView, evt, x, y) {
    handleMouseUp(originalPos);
  });
  paper.on("cell:pointerup", function (cellView, evt, x, y) {
    handleMouseUp(originalPos);
  });

  return paper;
};
export const drawExtractedGraph = (dom, nodesList, links, scale) => {
  let linksList = links.filter((link) => !link.hidden && link.points?.length);
  linksList = linksList.map((link) => {
    if (!link.points) link.points = [];
    let points = link.points.concat([]);
    if (link.reverse)
      return {
        source: link.target,
        target: link.source,
        value: link.value,
        points: points.reverse(),
      };
    else return link;
  });
  let graph = new joint.dia.Graph({});
  let paperScale = scale.gap / gap;
  startX = scale.startX;
  startY = scale.startY;
  let paper = new joint.dia.Paper({
    el: dom,
    model: graph,
    width: "100%",
    height: "100%",
    gridSize: 1,
    async: true,
    linkPinning: false,
    sorting: joint.dia.Paper.sorting.APPROX,
    defaultLink: () => new joint.shapes.standard.Link(),
    connectionStrategy: joint.connectionStrategies.pinAbsolute,
    interactive: function (cellView, method) {
      return null;
    },
  });

  for (let nodeI = 0; nodeI < nodesList.length; nodeI++) {
    let faRect = new joint.shapes.standard.Rectangle();

    faRect.resize(24, 24);
    faRect.position(
      countXPos(nodesList[nodeI].x) - 12,
      countYPos(nodesList[nodeI].y) - 12
    );
    let indexes = nodesList[nodeI].indexes;
    faRect.attr({
      body: {
        strokeWidth: 0,
        stroke: "white",
        strokeDasharray: 2,
        rx: 20,
        ry: 20,
        fill: "transparent",
      },
      label: {
        text: nodesList[nodeI].id,
        fill: "black",
        y: 0,
        fontSize: 6,
      },
      title: nodesList[nodeI].id,
    });
    if (nodesList[nodeI].type === 0) faRect.attr("body/strokeWidth", 3);
    for (let i = 0; i < indexes.length; i++) {
      let circle = new joint.shapes.standard.Circle();
      let offset = 360 / indexes.length;
      circle.attr({
        body: {
          strokeDasharray: 12 * 3.1415926,
          strokeDashoffset: ((12 * 3.1415926) / 360) * (offset * i),
          fill: "transparent",
          stroke: cmap[indexes[i]],
          strokeWidth: 12,
        },
      });
      circle.resize(12, 12);
      circle.position(
        countXPos(nodesList[nodeI].x) - 6,
        countYPos(nodesList[nodeI].y) - 6
      );
      circle.addTo(graph);
    }
    nodesList[nodeI]["node"] = faRect;
    faRect.addTo(graph);
    addTool(faRect, paper);
  }
  var Gen = d3
    .line()
    .x((p) => p.x)
    .y((p) => p.y)
    .curve(d3.curveBasis);
  joint.connectors.ExtractedCurve = function (
    sourcePoint,
    targetPoint,
    vertices,
    args
  ) {
    let points = args.points.concat([]);
    if (points.length > 1) {
      let radius = args.radius;
      points[0] = countAnchor(points[1], points[0], radius);
      if (points[points.length - 1].y < points[0].y)
        radius = radius + args.value;
      points[points.length - 1] = countAnchor(
        points[points.length - 2],
        points[points.length - 1],
        radius
      );
    }
    return Gen(points);
  };
  linksList.forEach((link) => {
    let path = new joint.shapes.standard.Link({});
    let sindex = nodesList.findIndex((item) => {
      if (item.id === link.source) return true;
      else return false;
    });
    let tindex = nodesList.findIndex((item) => {
      if (item.id === link.target) return true;
      else return false;
    });
    let value = linksOperation.recalLinkValue(link.value);
    path.attr({
      id: "(" + link.source + ", " + link.target + ")",
      line: {
        stroke: "black",
        strokeWidth: value + "",
        targetMarker: {
          // minute hand
          type: "path",
          stroke: "black",
          "stroke-width": value,
          fill: "transparent",
          d: "M 10 -5 0 0 10 5 ",
        },
      },
    });
    if (link.value < 0) {
      path.attr("line/strokeDasharray", "4 4");
    }
    let realLink = LinksManagement.getNodeByName(paper, link);
    let source = realLink.source;
    let target = realLink.target;
    if (sindex < 0) console.log(link);
    if (nodesList[sindex].y < nodesList[tindex].y)
      path.attr("line/targetMarker", null);

    path.source(source);
    path.target(target);
    path.addTo(graph);
    let points = link.points.map((point) => {
      return {
        x: countXPos(point.x),
        y: countYPos(point.y),
      };
    });
    points[0] = {
      x: countXPos(nodesList[sindex].x),
      y: countYPos(nodesList[sindex].y),
    };

    points[points.length - 1] = {
      x: countXPos(nodesList[tindex].x),
      y: countYPos(nodesList[tindex].y),
    };
    path.connector("ExtractedCurve", {
      points,
      value,
      radius: 12,
    });
  });
  paper.scale(paperScale);
  paper.translate(startX, startY);

  let originalPos = {
    x: NaN,
    y: NaN,
  };
  paper.on("link:mousewheel", function (linkView, evt, x, y, delta) {
    handleCellMouseWheel(paper, x, y, delta);
  });

  paper.on("blank:mousewheel", function (evt, x, y, delta) {
    handleCellMouseWheel(paper, x, y, delta);
  });

  paper.on("blank:pointermove", function (evt, x, y) {
    handleMouseMove(paper, evt, originalPos);
  });

  paper.on("blank:pointerup", function (evt, x, y) {
    handleMouseUp(originalPos);
  });
  paper.on("link:pointerup", function (linkView, evt, x, y) {
    handleMouseUp(originalPos);
  });
  paper.on("cell:pointerup", function (cellView, evt, x, y) {
    handleMouseUp(originalPos);
  });

  return paper;
};
