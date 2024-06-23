"""
这个程序可以根据结局和不同因素线性回归的p值大小，筛选出
和结局相关性最大的N个因素变量，并输出为csv表格
"""

import statsmodels.api as sm
import re  # 使用正则表达式
# from cdt import SETTINGS
import matplotlib.pyplot as plt
import pandas as pd
from numpy import *
import numpy as np
import sys
import io
from pickle import load
import matplotlib.image as mpimg
import matplotlib.pyplot as plt
import json

from causallearn.score.LocalScoreFunction import local_score_BDeu
from causallearn.utils.GraphUtils import GraphUtils

from causallearn.graph.GraphClass import CausalGraph
from causallearn.graph.GraphNode import GraphNode
from causallearn.search.ScoreBased.GES import ges
from causallearn.search.ConstraintBased.PC import pc
from causallearn.utils.cit import chisq, fisherz, gsq, kci, mv_fisherz
from causallearn.utils.PCUtils import SkeletonDiscovery
from causallearn.utils.PCUtils.BackgroundKnowledge import BackgroundKnowledge
from causallearn.utils.PCUtils.BackgroundKnowledgeOrientUtils import orient_by_background_knowledge

sys.path.append("")
# SETTINGS.verbose = True
import unittest

# 数据文件的路径，需要为excel表格
filename = ".\\MissingValue_fill_data_all.xlsx"

# 指定的选出因素变量的数目
# num_top = 6   #CovariantNum
CovariantNum = 5  # CovariantNum
outcome = 'b121_incid'

# 以列表形式告诉程序哪些变量是结局变量，其他变量均视为因素变量
results = ['death', 'follow_dura', 'multimorbidity_incid_byte', 'hospital_freq',
           'MMSE_MCI_incid', 'physi_limit_incid', 'dependence_incid', 'b11_incid', 'b121_incid']

dataset = pd.read_excel(filename, index_col=0)
labels = list(dataset.columns.values)
num_results = len(results)
factors = list(set(labels) - set(results))
num_factors = len(factors)
# if num_factors < CovariantNum:
#     print("指定的选出因素变量的数目大于所有的因素变量数目")
#     sys.exit(0)

import warnings
warnings.filterwarnings("ignore")

# df = dataset.drop(columns=list(set(results) - {'follow_dura'}))
df = dataset.drop(columns=list(set(results) - {outcome}))
df.dropna(inplace=True)
# print(df)
top_factors = {}
for factor in factors:
    X = df[factor]
    # y = df['follow_dura']
    y = df[outcome]
    X2 = sm.add_constant(X)
    est = sm.OLS(y, X2)
    est2 = est.fit()
    top_factors[factor] = abs(est2.pvalues[1])
top_factors = sorted(top_factors.items(), key=lambda x: x[1])
top_factors = dict(top_factors)
# print(top_factors)
top_factors_list = list(top_factors)[:int(CovariantNum)]
# print(top_factors)  # 为按相关性从最高到最低排序的全部factor变量
# print("结局变量为：{},最相关的{}个变量为:{}".format('follow_dura', 6, top_factors_list))
print("结局变量为：{},最相关的{}个变量为:{}".format(outcome, CovariantNum, top_factors_list))
# print(top_factors_list)  # 为按相关性从最高到最低排序的前CovariantNum个factor变量
nodes_list = [outcome]
print("初始节点为:{}".format(nodes_list))
nodes_list_all = top_factors_list + nodes_list
print("最终节点为:{}".format(nodes_list_all))

# print("当前为{}的结果".format(outcome))
df.drop(columns=list(top_factors)[int(CovariantNum):], inplace=True)
# df.to_csv(outcome + '.csv')
#
data = df.to_numpy()
# print(data)

# ges算法
# Record = ges(data, 'local_score_BDeu', maxP=5)
#
# # pyd = GraphUtils.to_pydot(Record['G'])
# # tmp_png = pyd.create_png(f="png")
# # fp = io.BytesIO(tmp_png)
# # img = mpimg.imread(fp, format='png')
# # plt.axis('off')
# # plt.imshow(img)
# # plt.show()
# # print(Record.G)     # AttributeError: 'dict' object has no attribute 'G'
# # print(Record)
# print(Record['G'])
# print(Record['update1'])
# print(Record['update2'])
# print(Record['G_step1'])
# print(Record['G_step2'])
# print(Record['score'])

# PC算法
cg_without_background_knowledge = pc(data, 0.05, fisherz, True, 0,
                                     0)  # Run PC and obtain the estimated graph (CausalGraph object)
nodes_pc = cg_without_background_knowledge.G.get_nodes()
# print(nodes_pc)
# edges = cg_without_background_knowledge.G.get_edges()
# print(edges)

# assert cg_without_background_knowledge.G.is_directed_from_to(nodes_pc[1], nodes_pc[2])
# assert cg_without_background_knowledge.G.is_undirected_from_to(nodes_pc[4], nodes_pc[5])
#
# bk = BackgroundKnowledge() \
#     .add_forbidden_by_node(nodes_pc[2], nodes_pc[8]) \
#     .add_forbidden_by_node(nodes_pc[8], nodes_pc[2]) \
#     .add_required_by_node(nodes_pc[7], nodes_pc[17])
# cg_with_background_knowledge = pc(data, 0.05, fisherz, True, 0, 0, background_knowledge=bk)
#
# assert cg_with_background_knowledge.G.get_edge(nodes_pc[2], nodes_pc[8]) is None
# assert cg_with_background_knowledge.G.is_directed_from_to(nodes_pc[7], nodes_pc[17])

replace_dict = {}
# node = nodes_list_all
for i in range(len(nodes_list_all)):
    # print(nodes_pc[i])
    # print(GraphNode(nodes_list_all[i]))  # GraphNode再确认一下？
    print('节点为：{}---{}'.format(nodes_pc[i], GraphNode(nodes_list_all[i])))
    # print(nodes_list_all[i])
    # print('节点为：{}---{}'.format(nodes_pc[i], nodes_list_all[i]))
    # 使用字典修改多个词语
    replace_dict_single = {str(nodes_pc[i]): str(GraphNode(nodes_list_all[i]))}
    print(replace_dict_single)
    # 向字典中添加元素
    replace_dict[str(nodes_pc[i])] = str(GraphNode(nodes_list_all[i]))
    print('---------')
print('节点对应标签replace_dict为:\n', replace_dict)

result_data = str(cg_without_background_knowledge.G)
# print(result_data.nodes)
# print(result_data.edges)   # 'GeneralGraph' object has no attribute 'edges'
print(result_data)
# print(nodes_pc)


# print(result_data.get_graph_edges)
# print(nodes)
"""
def find(string):
    # 方法一
    # pattern = re.compile('X\d --> X\d')
    # origin_edges = pattern.findall(str)   # TypeError: expected string or bytes-like object
    # 方法二
    origin_edges = re.findall('X\d --> X\d', string)
    return origin_edges
"""

origin_edges = re.findall('X\d --> X\d', result_data)
print('origin_edges:\n', origin_edges)
# 使用字典修改多个词语
# new_edges = [replace_dict[j] if j in replace_dict else j for j in origin_edges]  # 类似 'X1 --> X6' 是一个整体，无法用替换字典匹配上

new_edges = []
for ele in origin_edges:
    ele_sin = ele.split(' --> ')
    new_ele_sin = [replace_dict[j] if j in replace_dict else j for j in ele_sin]
    # print(new_ele_sin)
    X1 = new_ele_sin[0]
    X2 = new_ele_sin[1]
    # print(X1)
    # print(X2)
    # print(data[X1])
    # print(data[X2])
    # 计算线性回归系数
    data_corr = df[X1].corr(df[X2])
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
    link_sin['value'] = link_ele[2]
    # print(link_sin)
    # aJson = json.dumps(aItem)
    # link_sinJson = json.dumps(link_sin)
    links.append(link_sin)
print('因果图的有向边为：\n',links)

# 获取特定结局的PC因果算法所得的节点
nodes = []
for node_ele in nodes_list_all:
    node_sin = {}
    node_sin['id'] = node_ele
    node_sin['group'] = 1
    # print(node_sin)
    # aJson = json.dumps(aItem)
    # link_sinJson = json.dumps(link_sin)
    nodes.append(node_sin)
print('因果图的节点为：\n',nodes)

# visualization using networkx,无法实现，可能与相关库未安装有关
# Record.to_nx_graph()
# Record.draw_nx_graph(skel=False)
# plt.savefig(result + "111.png", format="PNG")
