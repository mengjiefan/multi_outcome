<template>
  <div class="bench-mark-list">
    <div class="bnrep-right">
      <el-select
        v-model="benchMark"
        @change="routeToGraph"
        placeholder="Please select the dataset"
      >
        <el-option
          v-for="item in dataOption"
          :key="item"
          :label="item"
          :value="item"
        >
        </el-option>
      </el-select>
      <h3></h3>
      <font _mstmutation="1" v-if="benchMark === 'healthcare'">
        Number of nodes:&nbsp;7<br _mstmutation="1" />
        Number of arcs:&nbsp;9<br _mstmutation="1" />
        Number of parameters:&nbsp;42<br _mstmutation="1" />
        Average Markov blanket size:&nbsp;3.14<br _mstmutation="1" />
        Average degree:&nbsp;2.57<br _mstmutation="1" />
        Maximum in-degree:&nbsp;2<br _mstmutation="1" />

        <br _mstmutation="1" />
        <a
          href="https://www.bnlearn.com/bnrepository/healthcare/healthcare.rda"
          _mstmutation="1"
          >RDA (bn.fit)</a
        >
        (967B)<br _mstmutation="1" />
        <a
          href="https://www.bnlearn.com/bnrepository/healthcare/healthcare.rds"
          _mstmutation="1"
          >RDS (bn.fit)</a
        >
        (955B)<br _mstmutation="1" />
        <br _mstmutation="1" />
        M. Scutari and J.-B. Denis. Bayesian Networks: with Examples in R.
        Chapman &amp; Hall, 2nd edition, 2021.
      </font>
      <font _mstmutation="1" v-else>
        Number of nodes:&nbsp;9<br _mstmutation="1" />
        Number of arcs:&nbsp;12<br _mstmutation="1" />

        <br _mstmutation="1" />
        <a
          href="https://www.bnlearn.com/research/scirep17/prepd-ortho.rda"
          _mstmutation="1"
          >prepd-ortho.rda</a
        >
        <br _mstmutation="1" />
        <a
          href="https://www.bnlearn.com/research/scirep17/prepd-bathia.rda"
          _mstmutation="1"
          >prepd-bathia.rda</a
        >
        <br _mstmutation="1" />
        <br _mstmutation="1" />
        Scutari, Auconi, Caldarelli, Franchi. Bayesian Networks Analysis of
        Malocclusion Data. Scientific Reports, 2017.
      </font>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
export default {
  setup() {},
  data() {
    return {
      benchMark: ref("healthcare"),
      dataOption: ["healthcare", "prepd-bathia"],
    };
  },
  methods: {
    routeToGraph() {
      localStorage.setItem("benchMark", this.benchMark);
      this.$router.push({
        path: "/redirect",
        query: { next: "DirectedGraphView/benchmark" },
      });
    },
  },
  mounted() {
    this.routeToGraph();
  },
};
</script>
