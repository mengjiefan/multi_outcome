import numpy as np
from scipy.spatial import distance

# 原始数据
nodes = [{'node': 'Hypertension','rank': 3, 'order': 2, 'fixed': True, 'group': [0], 'outcome': True},
 {'node': 'famHisHypertension','rank': 1, 'order': 0, 'fixed': True, 'group': [0], 'outcome': False},
 {'node': 'Smoke','rank': 2, 'order': 1, 'fixed': True, 'group': [0], 'outcome': False},
 {'node': 'Sex','rank': 0, 'order': 5, 'fixed': True, 'group': [0, 1, 2, 3], 'outcome': False},
 {'node': 'Income score','rank': 1, 'order': 4, 'fixed': True, 'group': [0, 1], 'outcome': False},
 {'node': 'Index of Multiple Deprivation','rank': 1, 'order': 3, 'fixed': True, 'group': [0, 1], 'outcome': False},
 {'node': 'Diabetes','rank': 3, 'order': 6, 'fixed': True, 'group': [1], 'outcome': True},
 {'node': 'BMI','rank': 2, 'order': 7, 'fixed': True, 'group': [1, 2], 'outcome': False},
 {'node': 'famHisDiabetes','rank': 1, 'order': 8, 'fixed': True, 'group': [1], 'outcome': False},
 {'node': 'BreastMalignancy','rank': 3, 'order': 9, 'fixed': True, 'group': [2], 'outcome': True},
 {'node': 'famHisBreastMalignancy','rank': 2, 'order': 10, 'fixed': True, 'group': [2], 'outcome': False},
 {'node': 'Education score','rank': 0, 'order': 11, 'fixed': True, 'group': [2], 'outcome': False},
 {'node': 'Processed meat intake','rank': 1, 'order': 12, 'fixed': True, 'group': [2, 3], 'outcome': False},
 {'node': 'ProstateMalignancy','rank': 3, 'order': 13, 'fixed': True, 'group': [3], 'outcome': True},
 {'node': 'Age','rank': 1, 'order': 14, 'fixed': True, 'group': [3], 'outcome': False},
 {'node': 'famHisProstateMalignancy','rank': 1, 'order': 16, 'fixed': True, 'group': [3], 'outcome': False},
 {'node': 'Health score','rank': 2, 'order': 15, 'fixed': True, 'group': [3], 'outcome': False}]

edges = [{'target': 'Smoke', 'source': 'famHisHypertension', 'value': -0.037},
 {'target': 'Hypertension', 'source': 'famHisHypertension', 'value': 0.094},
 {'target': 'Smoke', 'source': 'Sex', 'value': -0.047},
 {'target': 'Smoke', 'source': 'Income score', 'value': 0.113},
 {'target': 'Smoke', 'source': 'Index of Multiple Deprivation', 'value': 0.12},
 # {'target': 'Hypertension', 'source': 'Smoke'},
 {'target': 'Hypertension', 'source': 'Sex', 'value': -0.061},
 {'target': 'Hypertension', 'source': 'Income score', 'value': -0.056},
 {'target': 'BMI', 'source': 'Sex', 'value': -0.046},
 {'target': 'BMI', 'source': 'famHisDiabetes', 'value': 0.097},
 {'target': 'BMI', 'source': 'Index of Multiple Deprivation', 'value': 0.128},
 {'target': 'Diabetes', 'source': 'BMI', 'value': 0.199},
 {'target': 'Diabetes', 'source': 'Sex', 'value': -0.154},
 {'target': 'Diabetes', 'source': 'famHisDiabetes', 'value': 0.141},
 {'target': 'Diabetes', 'source': 'Income score', 'value': 0.077},
 {'target': 'BMI', 'source': 'Processed meat intake', 'value': 0.40642092195334456},
 {'target': 'Processed meat intake', 'source': 'Education score', 'value': 0.0047453790481526426},
 {'target': 'BMI', 'source': 'Education score', 'value': 0.04370518224459019},
 {'target': 'BreastMalignancy', 'source': 'BMI', 'value': -0.006130402385078393},
 {'target': 'famHisBreastMalignancy', 'source': 'Education score', 'value': -0.0003368741399302072},
 {'target': 'BreastMalignancy', 'source': 'famHisBreastMalignancy', 'value': 0.08506019886762786},
 {'target': 'BreastMalignancy', 'source': 'Education score', 'value': -0.0011752331959647144},
 {'target': 'Processed meat intake', 'source': 'Sex', 'value': -0.7825823366603113},
 {'target': 'ProstateMalignancy', 'source': 'Sex', 'value': -0.20006282522682559},
 {'target': 'Health score', 'source': 'Age', 'value': -0.008415294405574869},
 {'target': 'ProstateMalignancy', 'source': 'Age', 'value': 0.00420009971679286},
 {'target': 'Health score', 'source': 'Processed meat intake', 'value': 0.019867239045898648},
 {'target': 'ProstateMalignancy', 'source': 'Processed meat intake', 'value': 0.01625987363958338},
 {'target': 'Health score', 'source': 'famHisProstateMalignancy', 'value': -0.09118405477291315},
 {'target': 'ProstateMalignancy', 'source': 'famHisProstateMalignancy', 'value': 0.07287073811414913},
 {'target': 'ProstateMalignancy', 'source': 'Health score', 'value': -0.020301125470085113}]

# 创建一个字典，用于存储每个组的节点列表和边列表
grouped_data = {}

# 遍历节点列表，根据节点的group属性分类
for node in nodes:
 for group in node['group']:
  grouped_data.setdefault(group, {'nodes': [], 'edges': []})
  grouped_data[group]['nodes'].append(node)

# 遍历边列表，根据边的source和target节点的group属性分类
for edge in edges:
 source_node = next(node for node in nodes if node['node'] == edge['source'])
 target_node = next(node for node in nodes if node['node'] == edge['target'])

 for group in source_node['group']:
  if group in target_node['group']:
   grouped_data.setdefault(group, {'nodes': [], 'edges': []})
   grouped_data[group]['edges'].append(edge)

# 现在grouped_data中包含了按组分别分类的节点列表和边列表
# 你可以通过访问grouped_data[group]['nodes']和grouped_data[group]['edges']来获取每个组的数据

# 例如，要获取组0的节点列表和边列表：
# group_0_nodes = grouped_data[0]['nodes']
# group_0_edges = grouped_data[0]['edges']
#
# print(group_0_nodes)
# print(group_0_edges)

# 遍历每一组数据
for group, data in grouped_data.items():
 # 获取该组的节点列表和边列表
 group_nodes = data['nodes']
 group_edges = data['edges']

 # 打印组号
 print(f"Group {group}:")

 # 打印节点
 print("Nodes:")
 for node in group_nodes:
  print(node)

 # 打印边
 print("Edges:")
 for edge in group_edges:
  print(edge)

 print("--------------------------")

# 定义函数，用于生成邻接矩阵
def generate_adjacency_matrix(nodes, edges):
 # 创建一个空的邻接矩阵，初始化为0
 num_nodes = len(nodes)
 adjacency_matrix = np.zeros((num_nodes, num_nodes))

 # 构建邻接矩阵
 for edge in edges:
  source_node_index = nodes.index(next(node for node in nodes if node['node'] == edge['source']))
  target_node_index = nodes.index(next(node for node in nodes if node['node'] == edge['target']))
  adjacency_matrix[source_node_index][target_node_index] = edge['value']

 return adjacency_matrix


# 遍历每一组数据
for group, data in grouped_data.items():
 # 获取该组的节点列表和边列表
 group_nodes = data['nodes']
 group_edges = data['edges']

 # 生成该组的邻接矩阵
 adjacency_matrix = generate_adjacency_matrix(group_nodes, group_edges)

 # 打印邻接矩阵
 print(f"Adjacency Matrix for Group {group}:")
 print(adjacency_matrix)

# 定义函数，用于计算欧氏距离
def calculate_euclidean_distance(matrix1, matrix2):
 return distance.euclidean(matrix1.flatten(), matrix2.flatten())


# 获取各组的邻接矩阵
adjacency_matrices = [generate_adjacency_matrix(data['nodes'], data['edges']) for data in grouped_data.values()]

# 计算两个邻接矩阵之间的欧氏距离
for i in range(len(adjacency_matrices)):
 for j in range(i + 1, len(adjacency_matrices)):
  matrix1 = adjacency_matrices[i]
  matrix2 = adjacency_matrices[j]

  euclidean_distance = calculate_euclidean_distance(matrix1, matrix2)

  print(f"Euclidean Distance between Group {list(grouped_data.keys())[i]} and Group {list(grouped_data.keys())[j]}:")
  print(euclidean_distance)

