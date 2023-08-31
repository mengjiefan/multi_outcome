<template>
  <div class="canvas" ref="canvas"></div>
</template>

<script>
import * as joint from "jointjs";
import { g, V } from "jointjs";
export default {
  data() {
    return {
      paper: null,
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      let graph = new joint.dia.Graph();

      this.paper = new joint.dia.Paper({
        el: this.$refs.canvas,
        model: graph,
        width: 600,
        height: 100,
        gridSize: 10, // 网格大小
        drawGrid: {
          color: "red",
          thickness: 1,
          // grid shape element
          markup: "path",

          // refresh grid element attributes on change (like paper scale change, gridSize change etc.)
          /**
           * @param el Grid element, it's the reference to element defined by the drawGrid.markup
           * @param opt drawgrid extended with some useful stuff like current paper transformations, actual grid size
           */
          update: function (el, opt) {
            var d;
            // actual grid size (defined by paper.options.gridSize, scaled according to paper scale)
            var width = opt.width;
            var height = opt.height;
            var thickness = opt.thickness;

            if (width - thickness >= 0 && height - thickness >= 0) {
              d = ["M", width, 0, "H0"].join(" ");
            } else {
              d = "M 0 0 0 0";
            }

            V(el).attr({
              d: d,
              stroke: opt.color,
              "stroke-width": opt.thickness,
            });
          },
        },
        background: {
          color: "rgba(0, 255, 0, 0.3)",
        },
      });

      let rect = new joint.shapes.standard.Rectangle();
      rect.position(100, 30);
      rect.resize(100, 40);
      rect.attr({
        body: {
          fill: "blue",
        },
        label: {
          text: "Hello",
          fill: "white",
        },
      });
      rect.addTo(graph);

      let rect2 = rect.clone();
      rect2.translate(300, 0);
      rect2.attr("label/text", "World!");
      rect2.addTo(graph);

      let link = new joint.shapes.standard.Link();
      link.source(rect);
      link.target(rect2);
      link.addTo(graph);
    },
  },
};
</script>

<style>
</style>
