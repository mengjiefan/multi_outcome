import statsmodels.api as sm
import os, sys
import networkx as nx
import io
from causallearn.score.LocalScoreFunction import local_score_BDeu
from causallearn.utils.GraphUtils import GraphUtils
sys.path.append("")
import unittest
import warnings
from pickle import load
import matplotlib.image as mpimg
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import dowhy
from dowhy import CausalModel
import dowhy.datasets
import re  # 使用正则表达式
from causallearn.search.ScoreBased.GES import ges
from causallearn.search.ConstraintBased.PC import pc
from causallearn.utils.cit import chisq, fisherz, gsq, kci, mv_fisherz
from causallearn.graph.GraphNode import GraphNode
from functools import reduce

# 数据文件的路径
filename = "data/ukb.csv"
# filename = "./ukb_8_outcomes_data_nolab.csv"
# filename = "./ukb_8_outcomes_data.csv"   # 前几位太多都是检验结果，而实际上检验结果一般是疾病的结果，故不适用含lab的数据

# filename = "./clhls.csv"


# 以列表形式告诉程序哪些变量是结局变量，其他变量均视为因素变量
#  ukb_8_outcomes_data 中的结局变量
outcomes = ['Hypertension', 'Diabetes', 'BreastMalignancy', 'ProstateMalignancy',
           'Hypothyroidism', 'NutritionalAnaemias', 'InfectiousGastroenteritis', 'Septicemia']

#  clhls.csv 中的结局变量
# outcomes = ['g15a1_HT', 'g15b1_DM', 'g15c1_CVD', 'g15e1_COPD',
#            'g15n1_RA', 'g15o1_dementia', 'g15k1_gastric', 'eye_base', 'g15j1_prostate', 'multimorbidity_base']
# 指定的选出因素变量的数目
num_top = 6
# 读取CSV文件
data = pd.read_csv(filename)

# 获取除了outcomes列表中指定的变量之外的其他变量
factors = [col for col in data.columns if col not in outcomes]
# 计算因素变量的大小
factor_size = len(factors)
# 打印结果
print("因素变量的大小：", factor_size)

outcome = "Hypertension"  # ukb
# outcome = "g15a1_HT"  # clhls

outcome_corr = data[factors].corrwith(data[outcome])
# 获取 top 变量
top_correlated = outcome_corr.abs().nlargest(num_top)
top_correlated_factors = top_correlated.index.tolist()
# 所有的节点（包括结局变量和与结局变量相关的前top变量）
outcome_vars = top_correlated_factors + [outcome]

outcome_data_df = data[outcome_vars]
print("var names of dag:", outcome_vars)
print("Result DataFrame:", outcome)
print("outcome_data_df为:\n", outcome_data_df)

# 将DataFrame转换为NumPy数组
data_array = outcome_data_df.to_numpy()
print("data_array为:\n", data_array)

# 使用转换后的NumPy数组运行PC算法
cg = pc(data_array, 0.05, fisherz, True, 0, 3, outcome_vars)
# Retrieving the graph nodes with labels
nodes_pc = cg.G.get_nodes()
print("dag的nodes为:\n", nodes_pc)
node_labels = outcome_vars  # Use variable names as labels

print("cg.G的结果为：")
print(cg.G)  # 会得到 Graph Nodes 和 Graph Edges，但均无标签
# print("cg.G.graph的结果为：")
# print(cg.G.graph)  # 会得到 一个矩阵

replace_dict = {}
# node = nodes_list_all
for i in range(len(outcome_vars)):
    print(nodes_pc[i])
    print(outcome_vars[i])
    print(GraphNode(outcome_vars[i]))
    # print('节点为：{}---{}'.format(nodes_pc[i], GraphNode(outcome_vars[i])))
    # 使用字典修改多个词语
    replace_dict_single = {str(nodes_pc[i]): str(GraphNode(outcome_vars[i]))}
    print(replace_dict_single)
    # 向字典中添加元素
    replace_dict[str(nodes_pc[i])] = str(GraphNode(outcome_vars[i]))
    print('---------')
print('节点对应标签replace_dict为:\n', replace_dict)
result_data = str(cg.G)
# print(result_data)

origin_edges = re.findall('X\d --> X\d', result_data)
print('origin_edges:\n', origin_edges)

# 使用字典修改多个词语
new_edges = []
effect_values = {}  # 存储效应值的字典
for ele in origin_edges:
    ele_sin = ele.split(' --> ')
    new_ele_sin = [replace_dict[j] if j in replace_dict else j for j in ele_sin]
    # print(new_ele_sin)
    X1 = new_ele_sin[0]
    X2 = new_ele_sin[1]
    # 计算线性回归系数
    data_corr = outcome_data_df[X1].corr(outcome_data_df[X2])
    print("变量{}和{}的回归系数为{}".format(X1, X2, "%.3f" % data_corr))
    new_ele_sin.append(float("%.3f" % data_corr))
    print(new_ele_sin)
    new_edges.append(new_ele_sin)

print('替换后的边new_edges为:\n', new_edges)

# 获取特定结局的PC因果算法所得的边
links = []
for link_ele in new_edges:
    link_sin = {}
    link_sin['source'] = link_ele[0]
    link_sin['target'] = link_ele[1]
    link_sin['corr'] = link_ele[2]
    links.append(link_sin)
print('因果图的有向边为：\n', links)

# 获取特定结局的PC因果算法所得的节点
nodes_variables = []
node_outcome = {}  # TypeError: list indices must be integers or slices, not str --- 设成对象而非数组
node_outcome['id'] = outcome
node_outcome['type'] = 0
print(node_outcome)
for node_ele in top_correlated_factors:
    node_sin = {}
    node_sin['id'] = node_ele
    node_sin['type'] = 1
    nodes_variables.append(node_sin)
print(nodes_variables)
nodes_variables.append(node_outcome)
print('因果图的节点为：\n', nodes_variables)


# 构建有向图
G = nx.DiGraph()

# 添加节点
for node in nodes_variables:
    G.add_node(node['id'])

# 添加边
for link in links:
    source = link['source']
    target = link['target']
    G.add_edge(source, target)

# 检查是否为有向无环图（DAG）
if nx.is_directed_acyclic_graph(G):
    print("The causal graph is a Directed Acyclic Graph (DAG).")  # The causal graph is a Directed Acyclic Graph (DAG).
else:
    print("The causal graph contains cycles and is not a Directed Acyclic Graph (DAG). Please ensure your causal graph is acyclic.")
print("---------------------")

# 计算links中每一个source到target的效应量
# Step 1: 构建因果图

# Step 2: 循环计算因果效应
effect_values = {}

for link in links:
    source = link['source']
    target = link['target']
    # print(source)
    # print(target)

    # Step 3: 定义因果模型
    # 不对以下model提供 graph=graph_gml 时，可以得到想要的effect，否则总是报错
    model = CausalModel(
        data=outcome_data_df,
        treatment=source,
        outcome=target,
    )
    # print("model为\n", model)

    # Step 4: 识别因果效应
    identified_estimand = model.identify_effect(proceed_when_unidentifiable=True)
    if identified_estimand is not None:
        # Step 5: 估计因果效应
        estimate = model.estimate_effect(identified_estimand, method_name="backdoor.linear_regression")
        if estimate is not None:
            effect_values[(source, target)] = estimate.value
            # print(estimate)
            print(f"Causal Estimate for {source} to {target} is {estimate.value}")
            link["effect_value"] = estimate.value
        else:
            print(f"Causal effect estimation failed for {source} to {target}")
    else:
        print(f"Causal identification failed for {source} to {target}")

# 输出所有因果效应值
print("All causal effect values:", effect_values)
print(links)


"""
todo:
计算多个子图dag的距离，判断相似度，进而据此画矩阵
一种考虑方式：
边相似度： 共有的边E/（dag1的边E1 + dag2的边E2）
点相似度： 共有的点V/（dag1的点V1 + dag2的点V2）
dag图的相似度： 边相似度 * 点相似度
"""