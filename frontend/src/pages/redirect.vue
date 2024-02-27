<template>
  <div class="blank-content"></div>
</template>

<script>
export default {
  mounted() {
    //刷新数据用的
    const path = "/AppMainPlot/" + this.$route.query.next;
    setTimeout(() => {
      this.$router.push({
        path: path,
      });
    }, 0);
  },
};
</script>

<style scoped>
.blank-content {
  flex: 3;
}
</style>
