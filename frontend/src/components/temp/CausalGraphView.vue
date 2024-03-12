<template>
	<div id="CausalGraph">
		<h2>Causal Graph View</h2>
		<svg
			:width="width"
			:height="height"
			:margin="margin"		
		>
		</svg>	
	</div>
</template>


<script>
	import * as d3 from "d3";
	export default {
		name:'CausalGraph',
		data() {
			return {
				width: 90,
				height: 70,
				margin: {
					top: 5,
					right: 5,
					left: 5,
					bottom: 5,
				},
			};
			},
		mounted() {
			this.generateTreeMap();
		},
		methods: {
			generateTreeMap() {
				var treeData =
				{
						"name": "中国",
						"children":
							[
								{
									"name": "浙江",
									"children":
										[
											{"name": "杭州"},
											{"name": "宁波"},
											{"name": "温州"},
											{"name": "绍兴"}
										]
								},
								{
									"name": "广西",
									"children":
										[
											{
												"name": "桂林",
												"children":
													[
														{"name": "秀峰区"},
														{"name": "叠彩区"},
														{"name": "象山区"},
														{"name": "七星区"}
													]
											},
											{"name": "南宁"},
											{"name": "柳州"},
											{"name": "防城港"}
										]
								},
								{
									"name": "黑龙江",
									"children":
										[
											{"name": "哈尔滨"},
											{"name": "齐齐哈尔"},
											{"name": "牡丹江"},
											{"name": "大庆"}
										]
								},
								{
									"name": "新疆",
									"children":
										[
											{"name": "乌鲁木齐"},
											{"name": "克拉玛依"},
											{"name": "吐鲁番"},
											{"name": "哈密"}
										]
								}
							]
					};

				// set the dimensions and margins of the diagram
				var margin = {top: 40, right: 90, bottom: 50, left: 90},
					width = 660 - margin.left - margin.right,
					height = 500 - margin.top - margin.bottom;

				// declares a tree layout and assigns the size
				var TreeMap = d3.tree()
					.size([width-10, height-10]);

				//  assigns the data to a hierarchy using parent-child relationships
				var nodes = d3.hierarchy(treeData);

				// maps the node data to the tree layout
				nodes = TreeMap(nodes);

				// append the svg object to the body of the page
				// appends a 'group' element to 'svg'
				// moves the 'group' element to the top left margin
				var svg = d3.select("#CausalGraph").append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom),
					g = svg.append("g")
					.attr("transform",
							"translate(" + margin.left + "," + margin.top + ")");

				// adds the links between the nodes
				//var link = 
				g.selectAll(".link")
					.data( nodes.descendants().slice(1))
				.enter().append("path")
					.attr("class", "link")
					.style("stroke-width", 4)
					.attr("d", function(d) {
					return "M" + d.y + "," + d.x
						+ "C" + d.y + "," + (d.x + d.parent.x) / 2
						+ " " + d.parent.y + "," +  (d.x + d.parent.x) / 2
						+ " " + d.parent.y + "," + d.parent.x;
					});

				// adds each node as a group
				var node = g.selectAll(".node")
					.data(nodes.descendants())
					.enter().append("g")
					.attr("class", function(d) { 
						return "node" + 
						(d.children ? " node--internal" : " node--leaf"); })
					.attr("transform", function(d) { 
						return "translate(" + d.y + "," + d.x + ")"; })
					//.attr("transform","rotate(-90)");

				// adds the circle to the node
				node.append("circle")
				.attr("r", 5);

				// adds the text to the node
				node.append("text")
				.attr("dy", ".35em")
				.attr("x",function(d) { return d.children ? -45 : 10; })
				//.attr("y", function(d) { return d.children ? -20 : 0; })
				//.attr("x",15)
				.attr("y",0)
				//.attr("transform","rotate(90)")
				.style("text-anchor", "start")
				.style("font-size", 13)
				.style("fill", "black")
				.text(function(d) { return d.data.name; });	
					}
			}
	}
</script>

<style>
	.node circle {
		fill: #fff;
		stroke: steelblue;
		stroke-width: 3px;
    }

    .node text { font: 12px sans-serif; }

    .node--internal text {
    text-shadow: 0 1px 0 #fff, 0 -1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff;
    }

    .link {
		fill: none;
		stroke: #ccc;
		stroke-width: 2px;
    }
</style>