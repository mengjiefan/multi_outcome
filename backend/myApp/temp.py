import json

import torch
from django.shortcuts import render
from django.views import View
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect, HttpResponseNotFound
# from django.urls import reverse
# from django.shortcuts import redirect
import statsmodels.api as sm
import re  # 使用正则表达式
# from cdt import SETTINGS
import matplotlib.pyplot as plt
import pandas as pd
from numpy import *
import numpy as np
import linecache  # 用于读取指定行
import sys
import warnings

warnings.filterwarnings("ignore")
import networkx as nx
from dowhy import CausalModel
from causallearn.search.ScoreBased.GES import ges
from causallearn.search.ConstraintBased.PC import pc
from causallearn.utils.cit import chisq, fisherz, gsq, kci, mv_fisherz
from causallearn.graph.GraphNode import GraphNode
from daggnn.utils import load_data
from daggnn.train import _h_A, args, train, init_model

def get_causal_edges():

    fileName = "./healthcare.csv"


    # 读取CSV文件
    data = pd.read_csv(fileName)

    outcome_vars = ['A', 'C', 'D', 'H', 'I', 'O', 'T']

    outcome_data_df = data[outcome_vars]

    # 将DataFrame转换为NumPy数组
    data_array = outcome_data_df.to_numpy()

    # 使用转换后的NumPy数组运行PC算法
    cg = pc(data_array, 0.05, fisherz, True, 0, 3, outcome_vars)
    # Retrieving the graph nodes with labels
    nodes_pc = cg.G.get_nodes()
    node_labels = outcome_vars  # Use variable names as labels

    replace_dict = {}
    # node = nodes_list_all
    for i in range(len(outcome_vars)):
        # 使用字典修改多个词语
        replace_dict_single = {str(nodes_pc[i]): str(GraphNode(outcome_vars[i]))}
        replace_dict[str(nodes_pc[i])] = str(GraphNode(outcome_vars[i]))
    result_data = str(cg.G)

    origin_edges = re.findall('X\d --> X\d', result_data)

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
        new_ele_sin.append(float("%.3f" % data_corr))
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
        print(
            "The causal graph is a Directed Acyclic Graph (DAG).")  # The causal graph is a Directed Acyclic Graph (DAG).
    else:
        print(
            "The causal graph contains cycles and is not a Directed Acyclic Graph (DAG). Please ensure your causal graph is acyclic.")
    print("---------------------")

    # 计算links中每一个source到target的效应量
    # Step 1: 构建因果图

    # Step 2: 循环计算因果效应
    effect_values = {}

    for link in links:
        source = link['source']
        target = link['target']
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
                link["value"] = estimate.value
            else:
                print(f"Causal effect estimation failed for {source} to {target}")
        else:
            print(f"Causal identification failed for {source} to {target}")

    # 输出所有因果效应值
    print("All causal effect values:", effect_values)
    print(links)

get_causal_edges()