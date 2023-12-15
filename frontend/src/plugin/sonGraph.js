import * as joint from "jointjs";
import "/node_modules/jointjs/dist/joint.css";
import * as d3 from "d3";

import { g } from "jointjs";
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

const addOffset = (x, y, offset, graph) => {
  if (offset === 0) return;
  let arrow = new joint.shapes.standard.Polygon();
  arrow.resize(10, 20);

  arrow.attr({
    body: {
      strokeWidth: 0,
      stroke: "transparent",
      fill: "rgba(151, 151, 151, 0.6)",
    },
  });
  if (offset > 0) {
    arrow.position(x - 16, y + 6);
    arrow.attr("body/refPoints", "0,20 10,10 0,0");
  } else {
    arrow.position(x + 38, y + 6);
    arrow.attr("body/refPoints", "0,20 -10,10 0,0");
  }
  arrow.addTo(graph);
  let width = 6 / Math.abs(offset);
  let number = Math.floor(20 / width);
  for (let i = 0; i < number; i++) {
    let rect = new joint.shapes.standard.Rectangle();
    rect.resize(width, 10);
    rect.attr({
      body: {
        strokeWidth: 0,
        stroke: "transparent",
        fill: "rgba(151, 151, 151, 0.6)",
      },
    });
    let gap = (width * 5) / 3;
    if (offset > 0) rect.position(x - 16 - width - gap * i, y + 11);
    else rect.position(x + 48 + gap * i, y + 11);
    rect.addTo(graph);
  }
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
const findLink = (links, edge) => {
  let index = links.findIndex((link) => {
    if (link.source === edge.source && link.target === edge.target) return true;
    else if (link.source === edge.target && link.target === edge.source)
      return true;
    else return false;
  });
  return links[index];
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

let gap = 80;
const countXPos = (x) => {
  return x * gap;
};
const countYPos = (y) => {
  return y * gap;
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

export const checkDirection = (source, target) => {
  if (source.y <= target.y) return "DOWN";
  else return "UP";
};
export const addHighLight = (elementView) => {
  /*
    joint.highlighters.mask.add(
        elementView,
        { selector: "root" },
        "my-element-highlight",
        {
            padding: 0,
            deep: true,
            attrs: {
                stroke: "#FF4365",
                "stroke-width": 3,
            },
        }
    );*/
  let attributes = elementView.model.attributes;
  if (attributes.attrs.label.fontWeight !== "bold") {
    elementView.model.attr("label/fontWeight", "bold");
    elementView.model.attr(
      "label/fontSize",
      elementView.model.attributes.attrs.label.fontSize + 1
    );
  }

  if (!isNaN(parseFloat(attributes.attrs.label.text))) {
    elementView.model.attr("body/fill", "#1f77b4");
  }
};
export const removeHighLight = (elementView) => {
  /*
    const highlighter = joint.dia.HighlighterView.get(
        elementView,
        "my-element-highlight"
    );
    if (highlighter)
        highlighter.remove();
        */
  let attributes = elementView.model.attributes;
  elementView.model.attr("label/fontWeight", "normal");
  elementView.model.attr(
    "label/fontSize",
    elementView.model.attributes.attrs.label.fontSize - 1
  );
  if (!isNaN(parseFloat(attributes.attrs.label.text))) {
    elementView.model.attr("body/fill", "transparent");
  }
};
export const drawCurveGraph = (dom, nodesList, scale, linksList) => {
  let maxX = 0;
  let maxY = 0;

  let paperScale = scale.gap / gap;

  let startX = scale.startX;
  let startY = scale.startY;
  let graph = new joint.dia.Graph({});

  let paper = new joint.dia.Paper({
    el: dom,
    model: graph,
    width: "100%",
    height: "100%",
    drawGrid: { name: "mesh", args: { color: "#bbbbbb" } },
    gridSize: 80,
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
    if (nodesList[nodeI].x > maxX) maxX = nodesList[nodeI].x;
    if (nodesList[nodeI].y > maxY) maxY = nodesList[nodeI].y;
  }
  linksList.forEach((link) => {
    for (let i = 0; i < link.points.length; i++) {
      let point = link.points[i];
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }
  });
  //addIndexOfGrid(graph, maxX, maxY);
  let max = -1;
  nodesList.forEach((node) => {
    if (Math.abs(node.offset) > max) max = Math.abs(node.offset);
  });
  console.log(max)
  for (let nodeI = 0; nodeI < nodesList.length; nodeI++) {
    addOffset(
      countXPos(nodesList[nodeI].x) - 16,
      countYPos(nodesList[nodeI].y) - 16,
      nodesList[nodeI].offset,
      graph
    );
  }
  for (let nodeI = 0; nodeI < nodesList.length; nodeI++) {
    let faRect = new joint.shapes.standard.Rectangle();
    faRect.resize(32, 32);
    faRect.position(
      countXPos(nodesList[nodeI].x) - 16,
      countYPos(nodesList[nodeI].y) - 16
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
        fontSize: 10,
      },
      title: nodesList[nodeI].id,
    });
    if (nodesList[nodeI].type === 0) faRect.attr("body/strokeWidth", 3);
    for (let i = 0; i < indexes.length; i++) {
      let circle = new joint.shapes.standard.Circle();
      let offset = 360 / indexes.length;
      circle.attr({
        body: {
          strokeDasharray: 16 * 3.1415926,
          strokeDashoffset: ((16 * 3.1415926) / 360) * (offset * i),
          fill: "transparent",
          stroke: cmap[indexes[i]],
          strokeWidth: 16,
        },
      });
      circle.resize(16, 16);
      circle.position(
        countXPos(nodesList[nodeI].x) - 8,
        countYPos(nodesList[nodeI].y) - 8
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
    .curve(d3.curveNatural);
  joint.connectors.TreeCurve = function (
    sourcePoint,
    targetPoint,
    vertices,
    args
  ) {
    let points = args.points.map((point) => {
      return {
        x: countXPos(point.x),
        y: countXPos(point.y),
      };
    });
    if (points.length > 1) {
      let radius = 16;
      points[0] = countAnchor(points[1], points[0], radius);

      if (points[points.length - 1].y < points[0].y) radius = 16 + args.value;
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
    let value = Math.abs(link.value);

    if (value > 1) value = 1;
    path.attr({
      id: "(" + link.source + ", " + link.target + ")",
      line: {
        class: link.source + "," + link.target,
        strokeWidth: value * 8 + "",
        targetMarker: {
          // minute hand
          type: "path",
          stroke: "black",
          "stroke-width": value * 7,
          fill: "transparent",
          d: "M 10 -5 0 0 10 5 ",
        },
      },
    });
    if (link.value < 0) {
      path.attr("line/strokeDasharray", "4 4");
    }
    if (
      nodesList[sindex].node.attributes.position.y <
      nodesList[tindex].node.attributes.position.y
    )
      path.attr("line/targetMarker", null);

    path.source(nodesList[sindex].node);
    path.target(nodesList[tindex].node);
    path.addTo(graph);
    //path.vertices(vertices);

    path.connector("TreeCurve", { points: link.points, value: value * 7 });
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
export const drawTightenedGraph = (dom, nodesList, links, scale, linksPos) => {
  let linksList = links.filter((link) => !link.hidden);
  linksList = linksList.map((link) => {
    if (link.reverse)
      return {
        source: link.target,
        target: link.source,
        value: link.value,
        reverse: true,
      };
    else return link;
  });
  let paperScale = scale.gap / gap;

  let startX = scale.startX;
  let startY = scale.startY;
  let graph = new joint.dia.Graph({});

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

    faRect.resize(32, 32);
    faRect.position(
      countXPos(nodesList[nodeI].x) - 16,
      countYPos(nodesList[nodeI].y) - 16
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
        fontSize: 10,
      },
      title: nodesList[nodeI].id,
    });
    if (nodesList[nodeI].type === 0) faRect.attr("body/strokeWidth", 3);
    for (let i = 0; i < indexes.length; i++) {
      let circle = new joint.shapes.standard.Circle();
      let offset = 360 / indexes.length;
      circle.attr({
        body: {
          strokeDasharray: 16 * 3.1415926,
          strokeDashoffset: ((16 * 3.1415926) / 360) * (offset * i),
          fill: "transparent",
          stroke: cmap[indexes[i]],
          strokeWidth: 16,
        },
      });
      circle.resize(16, 16);
      circle.position(
        countXPos(nodesList[nodeI].x) - 8,
        countYPos(nodesList[nodeI].y) - 8
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
  joint.connectors.TightenedCurve = function (
    sourcePoint,
    targetPoint,
    vertices,
    args
  ) {
    let points = args.points.concat([]);
    points = points.map((point) => {
      return {
        x: point.x * 80,
        y: point.y * 80,
      };
    });
    if (points.length > 1) {
      points[0] = countAnchor(points[1], points[0], 16);
      let radius = 16;
      // target arrow偏移
      if (points[points.length - 1].y < points[0].y) radius = 16 + args.value;
      points[points.length - 1] = countAnchor(
        points[points.length - 2],
        points[points.length - 1],
        radius
      );
    }
    return Gen(points);
  };

  linksList.forEach((link) => {
    let points = findLink(linksPos, link).points.concat([]);
    let path = new joint.shapes.standard.Link({});

    if (link.reverse) points.reverse();
    let sindex = nodesList.findIndex((item) => {
      if (item.id === link.source) return true;
      else return false;
    });
    let tindex = nodesList.findIndex((item) => {
      if (item.id === link.target) return true;
      else return false;
    });
    let value = Math.abs(link.value);
    if (value > 1) value = 1;
    path.attr({
      id: "(" + link.source + ", " + link.target + ")",
      line: {
        strokeWidth: value * 8 + "",
        targetMarker: {
          // minute hand
          type: "path",
          stroke: "black",
          "stroke-width": value * 7,
          fill: "transparent",
          d: "M 10 -5 0 0 10 5 ",
        },
      },
    });
    if (link.value < 0) {
      path.attr("line/strokeDasharray", "4 4");
    }
    if (
      nodesList[sindex].node.attributes.position.y <
      nodesList[tindex].node.attributes.position.y
    )
      path.attr("line/targetMarker", null);

    path.source(nodesList[sindex].node);
    path.target(nodesList[tindex].node);
    path.addTo(graph);

    path.connector("TightenedCurve", {
      points: points,
      value: value * 7,
    });
  });

  paper.scale(paperScale);
  paper.translate(startX, startY);

  paper.on("link:mousewheel", function (linkView, evt, x, y, delta) {
    handleCellMouseWheel(paper, x, y, delta);
  });

  paper.on("blank:mousewheel", function (evt, x, y, delta) {
    handleCellMouseWheel(paper, x, y, delta);
  });

  paper.on("blank:pointermove", function (evt, x, y) {
    handleMouseMove(paper, evt, x, y);
  });

  paper.on("blank:pointerup", function (evt, x, y) {
    handleMouseUp();
  });
  paper.on("link:pointerup", function (linkView, evt, x, y) {
    handleMouseUp();
  });
  paper.on("cell:pointerup", function (cellView, evt, x, y) {
    handleMouseUp();
  });

  return paper;
};
