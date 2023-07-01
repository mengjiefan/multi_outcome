<template>
    <div class="blank-content">
      <div id="paper"></div>
    </div>
  </template>
  
  <script>
  import dagre from "dagre";
  import graphlib from "graphlib";
  import * as joint from "jointjs";
  import "/node_modules/jointjs/dist/joint.css";
  import svgPanZoom from "svg-pan-zoom";
  export default {
    data() {
      return {
        graph: null,
        paper: null,
        /** 原始数据：节点 */
        nodes: [
          { id: 1, label: "node1" },
          { id: 2, label: "node2" },
          { id: 3, label: "node3" },
        ],
        /** 原始数据：连线 */
        links: [
          { from: 1, to: 2 },
          { from: 1, to: 3 },
        ],
        /** 处理后生成的节点 */
        nodeList: [],
        /** 处理后生成的连线 */
        linkList: [],
      };
    },
    methods: {
      /** 页面初始化 */
      init() {
        this.initGraph();
        this.createNode();
        this.createLink();
        this.randomLayout();
        this.svgPanZoom();
        this.paperEvent();
      },
      /** 初始化画布，按照joint文档来就可以，具体画布的尺寸和颜色自定义 */
      initGraph() {
        let paper = document.getElementById("paper");
        this.graph = new joint.dia.Graph();
        this.paper = new joint.dia.Paper({
          dagre: dagre,
          graphlib: graphlib,
          el: paper,
          model: this.graph,
          width: "100%",
          height: "calc(100vh - 100px)",
          background: {
            color: "#f5f5f5",
          },
          /** 是否需要显示单元格以及单元格大小(px) */
          // drawGrid: true,
          // gridSize: 20,
        });
      },
      /** 创建节点 */
      createNode() {
        /** 遍历节点原始数据，通过joint.shapes.standard.Rectangle（joint内置shape）创建节点对象。 */
        this.nodes.forEach((ele) => {
  
          let node = new joint.shapes.standard.Rectangle({
            id: ele.id,
            size: {
              width: 100,
              height: 50,
            },
            attrs: {
              body: {
                fill: "#ddd",
                stroke: "none",
              },
              text: {
                text: ele.label,
              },
            },
          });
     
          console.log(node);
          /** 创建的节点对象放入list */
          this.nodeList.push(node);
        });
        /** 通过graph的addCell方法向画布批量添加一个list */
        this.graph.addCell(this.nodeList);
      },
      /** 创建连线 */
      createLink() {
        this.links.forEach((ele) => {
          let link = new joint.shapes.standard.Link({
            source: {
              id: ele.from,
            },
            target: {
              id: ele.to,
            },
            attrs: {
              line: {
                stroke: "#aaa",
                strokeWidth: 1,
              },
            },
          });
          /** 创建好的连线push进数组 */
          this.linkList.push(link);
        });
        /** 通过graph.addCell向画布批量添加连线 */
        this.graph.addCell(this.linkList);
      },
      /** 画布节点自动布局，通过joint.layout.DirectedGraph.layout实现 */
      randomLayout() {
        joint.layout.DirectedGraph.layout(this.graph, {
          dagre: dagre,
          graphlib: graphlib,
          /** 布局方向 TB | BT | LR | RL */
          rankDir: "LR",
          /** 表示列之间间隔的像素数 */
          rankSep: 200,
          /** 相同列中相邻接点之间的间隔的像素数 */
          nodeSep: 80,
          /** 同一列中相临边之间间隔的像素数 */
          edgeSep: 50,
        });
      },
      /** svgpanzoom 画布拖拽、缩放 */
      svgPanZoom() {
        /** 判断是否有节点需要渲染，否则svg-pan-zoom会报错。 */
        if (this.nodes.length) {
          let svgZoom = svgPanZoom("#paper svg", {
            /** 判断是否是节点的拖拽 */
            beforePan: (oldPan, newPan) => {
              if (this.currCell) {
                return false;
              }
            },
            /** 是否可拖拽 */
            panEnabled: true,
            /** 是否可缩放 */
            zoomEnabled: true,
            /** 双击放大 */
            dblClickZoomEnabled: false,
            /** 可缩小至的最小倍数 */
            minZoom: 0.01,
            /** 可放大至的最大倍数 */
            maxZoom: 100,
            /** 是否自适应画布尺寸 */
            fit: true,
            /** 图是否居中 */
            center: true,
          });
          /** 手动设置缩放敏感度 */
          svgZoom.setZoomScaleSensitivity(0.5);
        }
      },
      /** 给paper添加事件 */
      paperEvent() {
        /** 确认点击的是节点 */
        this.paper.on("element:pointerdown", (cellView, evt, x, y) => {
          this.currCell = cellView;
        });
        /** 在鼠标抬起时恢复currCell为null */
        this.paper.on("cell:pointerup blank:pointerup", (cellView, evt, x, y) => {
          this.currCell = null;
        });
      },
    },
    mounted() {
      this.init();
    },
    /*
    mounted() {
      //刷新数据用的
     
      const path = "/AppMainPlot/" + this.$route.query.next;
      setTimeout(() => {
        this.$router.push({
          path: path,
        });
      }, 0);
     
    }, */
  };
  </script>
  
  <style scoped>
  .blank-content {
    flex: 3;
  }
  </style>
  