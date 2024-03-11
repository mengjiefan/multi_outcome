<template>
  <div class="bench-mark-list">
    <div class="bnrep-right">
      <h3>HEALTHCARE</h3>
      <font _mstmutation="1">
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
    </div>
  </div>
</template>

<script>
export default {
  setup() {},
  mounted() {
    this.$router.push({
      name: "BenchmarkDirectedGraph",
    });
  },
};
</script>
