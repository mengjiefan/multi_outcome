const floydWarshall = (graph) => {
  let dist = [];
  for (let i = 0; i < graph.length; i++) {
    dist[i] = [];
    for (let j = 0; j < graph.length; j++) {
      if (i === j) {
        dist[i][j] = 0;
      } else if (!isFinite(graph[i][j])) {
        dist[i][j] = Infinity;
      } else {
        dist[i][j] = graph[i][j];
      }
    }
  }

  for (let k = 0; k < graph.length; k++) {
    for (let i = 0; i < graph.length; i++) {
      for (let j = 0; j < graph.length; j++) {
        if (dist[i][j] > dist[i][k] + dist[k][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }

  return dist;
};

export const countStress = (graphNodes, graphLinks) => {
  let scale = 0;
  let stressList = [];
  for (let index = 0; index < graphNodes.length; index++) {
    let nodesList = graphNodes[index];
    let linksList = graphLinks[index];
    let graph = [];
    //初始化邻接矩阵
    for (let i = 0; i < nodesList.length; i++) {
      graph.push([]);
      for (let j = 0; j < nodesList.length; j++) graph[i].push(Infinity);
    }
    for (let i = 0; i < linksList.length; i++) {
      let sIndex = nodesList.findIndex(
        (node) => node.id === linksList[i].source
      );
      let tIndex = nodesList.findIndex(
        (node) => node.id === linksList[i].target
      );
      graph[sIndex][tIndex] = 1;
      graph[tIndex][sIndex] = 1;
    }
    //最短路径
    graph = floydWarshall(graph);

    let maxY = -15000;
    let minY = 15000;
    let nowH = 1;
    //缩放第一张子图到同等大小（高为5），记录缩放比例
    if (!scale) {
      nodesList.forEach((node) => {
        if (node.y > maxY) maxY = node.y;
        if (node.y < minY) minY = node.y;
      });
      nowH = maxY - minY;

      scale = 5 / nowH;
      scale = scale ** 2;
    }

    let stress = 0;
    for (let i = 0; i < nodesList.length; i++) {
      for (let j = i + 1; j < nodesList.length; j++) {
        let v = nodesList[i];
        let w = nodesList[j];
        let nowDis = Math.sqrt(
          (v.x - w.x) ** 2 * scale + (v.y - w.y) ** 2 * scale
        );
        let bestDis = graph[i][j];
        stress = stress + (nowDis - bestDis) ** 2 / bestDis ** 2;
      }
    }
    stressList.push(stress.toFixed(2));
  }
  return stressList
};
