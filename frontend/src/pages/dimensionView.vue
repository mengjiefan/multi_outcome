<template>
	<div id="DimensionView">
		<h2>Dimension View</h2>
		<svg
			:width="width"
			:height="height"
			:margin="margin"		
		>
		</svg>
	</div>
</template>

<script>
	export default {
		name:'DimensionView',
		data() {
			return {
				width: 30,
				height: 70,
				margin: {
					top: 5,
					right: 5,
					left: 5,
					bottom: 5,
				},
			};
			}
	}
</script>
