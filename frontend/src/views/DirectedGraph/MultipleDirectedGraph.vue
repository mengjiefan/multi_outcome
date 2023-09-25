<template>
  <div class="drawing-canvas">
    <div class="directed-tabs">
      <div
        :class="name === 'DirectedSuperGraph' ? 'active-tab' : 'normal-tab'"
        @click="routeTo('DirectedSuperGraph')"
      >
        Super Graph
      </div>
      <div
        :class="name === 'ExtractedSubGraph' ? 'active-tab' : 'normal-tab'"
        @click="routeTo('ExtractedSubGraph')"
      >
        Extracted Subgraphs
      </div>
      <div
        :class="name === 'TightenedSubGraph' ? 'active-tab' : 'normal-tab'"
        @click="routeTo('TightenedSubGraph')"
      >
        Tightened Subgraphs
      </div>
      <div
        :class="name === 'OptimalSubGraph' ? 'active-tab' : 'normal-tab'"
        @click="routeTo('OptimalSubGraph')"
      >
        Optimal Subgraphs
      </div>
      <div
        :class="name === 'ConstraintSubGraph' ? 'active-tab' : 'normal-tab'"
        @click="routeTo('ConstraintSubGraph')"
      >
        Constraint Subgraphs
      </div>
      <div
        :class="name === 'OriginalSubGraph' ? 'active-tab' : 'normal-tab'"
        @click="routeTo('OriginalSubGraph')"
      >
        Original Subgraphs
      </div>
    </div>
    <router-view></router-view>
  </div>
</template>

<script >
import { ref } from "vue";
export default {
  setup() {
    return {
      name: ref(""),
    };
  },
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.getTag();
    });
  },
  mounted() {
    this.getTag();
  },
  methods: {
    getTag() {
      this.name = this.$route.name;
    },
    routeTo(name) {
      this.name = name;
      if (this.$route.name !== this.name)
        this.$router.push({
          name,
        });
    },
  },
};
</script>

<style>
rect {
  cursor: pointer;
}
g text {
  cursor: pointer;
}
</style>
<style scoped>
.drawing-canvas {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.directed-tabs {
  background-color: rgb(55, 162, 228);
  height: 40px;
  display: flex;
  font-size: 20px;
  padding-left: 16px;
  gap: 16px;
}
.active-tab {
  background-color: white;
  border-radius: 4px 4px 0 0;
  color: rgb(55, 162, 228);
  vertical-align: center;
  text-align: center;
  padding-left: 8px;
  padding-right: 8px;
  line-height: 40px;
  cursor: pointer;
  transition-duration: 0.2s;
}
.normal-tab {
  background-color: rgb(55, 162, 228);
  border-radius: 4px 4px 0 0;
  color: white;
  vertical-align: center;
  text-align: center;
  padding-left: 8px;
  padding-right: 8px;
  line-height: 40px;
  cursor: pointer;
  transition-duration: 0.2s;
}
</style>