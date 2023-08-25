"""
这个程序可以根据结局和不同因素线性回归的p值大小，筛选出
和结局相关性最大的N个因素变量，并输出为csv表格
"""

# from django.shortcuts import render
# Create your views here.

import json
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
from functools import reduce

sys.path.append("")

# SETTINGS.verbose = True

# Create your views here.
# def index(request):
#     # print(reverse("add"))  #reverse通过路由名称add反向生成URL请求地址
#     # print(reverse("index"))
#     # print(reverse("find3",args=(100,"lisi")))
#     # return redirect(reverse("find3",args=(100,"lisi")))  #redirect执行浏览器重定向，实现页面跳转
#     return HttpResponse("Hello World!")
# def add(request):
#     return HttpResponse("add...")

def test11(request):
    return HttpResponse("test...")  # 测试成功

#根据outcome和factor获取所有节点和边
# 实际中，不需要再次计算此步，直接拿第一步中的经过交互完成之后的经专家确认的多个子图中的节点和边（去重后），交给dagre绘制即可

ukb_outcomes = ['Hypertension', 'Diabetes', 'BreastMalignancy', 'ProstateMalignancy',
           'Hypothyroidism', 'NutritionalAnaemias', 'InfectiousGastroenteritis', 'Septicemia']
clhls_outcomes = ['g15a1_HT', 'g15b1_DM', 'g15c1_CVD', 'g15e1_COPD',
          'g15n1_RA', 'g15o1_dementia', 'g15k1_gastric', 'eye_base', 'g15j1_prostate', 'multimorbidity_base']

ukb_file = "./myApp/ukb_8_outcomes_data_nolab_his.csv"
clhls_file = "./myApp/clhls_10_outcomes_data.csv"

def get_list(request):
    num_top = request.GET.get("CovariantNum")  # CovariantNum
    num_top = int(num_top)
    outcome = request.GET.get("outcome")
    dataset = request.GET.get('dataset')
    fileName = "./myApp/MissingValue_fill_data_all.csv"
    outcomes = ['death', 'follow_dura', 'multimorbidity_incid_byte', 'hospital_freq',
           'MMSE_MCI_incid', 'physi_limit_incid', 'dependence_incid', 'b11_incid', 'b121_incid']
    if dataset == 'ukb':
        fileName = ukb_file
        outcomes =ukb_outcomes
    elif dataset == 'clhls':
        fileName = clhls_file
        outcomes = clhls_outcomes

    # 读取CSV文件
    data = pd.read_csv(fileName)

    # 获取除了outcomes列表中指定的变量之外的其他变量
    factors = [col for col in data.columns if col not in outcomes]
    # 计算因素变量的大小
    factor_size = len(factors)
    # 打印结果
    print("因素变量的大小：", factor_size)

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
    node_outcome = {}  # TypeError: list indices must be integers or slices, not str --- 设成对象而非数组
    node_outcome['id'] = outcome
    node_outcome['type'] = 0
    for node_ele in top_correlated_factors:
        data_col = data[node_ele].to_numpy()
        node_sin = {}
        node_sin['range'] = data_col.tolist()
        node_sin['id'] = node_ele
        node_sin['type'] = 1
        nodes_variables.append(node_sin)
    nodes_variables.append(node_outcome)

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
                #link["effect_value"] = estimate.value
                link["value"] = estimate.value
            else:
                print(f"Causal effect estimation failed for {source} to {target}")
        else:
            print(f"Causal identification failed for {source} to {target}")

    # 输出所有因果效应值
    print("All causal effect values:", effect_values)
    return JsonResponse({'outcome': outcome, 'CovariantNum': num_top,
                         'nodes':nodes_variables,'links':links})

def get_causal_edges(request):
    outcome = request.GET.get("outcome")
    dataset = request.GET.get('dataset')
    fileName = "./myApp/MissingValue_fill_data_all.csv"
    outcomes = ['death', 'follow_dura', 'multimorbidity_incid_byte', 'hospital_freq',
           'MMSE_MCI_incid', 'physi_limit_incid', 'dependence_incid', 'b11_incid', 'b121_incid']
    if dataset == 'ukb':
        fileName = ukb_file
        outcomes =ukb_outcomes
    elif dataset == 'clhls':
        fileName = clhls_file
        outcomes = clhls_outcomes

    factors = request.GET.get("factors").split(",")

    # 读取CSV文件
    data = pd.read_csv(fileName)
    # 计算因素变量的大小
    factor_size = len(factors)
    # 打印结果
    print("因素变量的大小：", factor_size)
    print("所有因素为{}", factors)
    print(dataset)

    outcome_corr = data[factors].corrwith(data[outcome])
    top_correlated_factors = outcome_corr.index.tolist()
    # 所有的节点（包括结局变量和与结局变量相关的前top变量）
    outcome_vars = top_correlated_factors + [outcome]

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
    node_outcome = {}  # TypeError: list indices must be integers or slices, not str --- 设成对象而非数组
    node_outcome['id'] = outcome
    node_outcome['type'] = 0
    for node_ele in top_correlated_factors:
        data_col = data[node_ele].to_numpy()
        node_sin = {}
        node_sin['range'] = data_col.tolist()
        node_sin['id'] = node_ele
        node_sin['type'] = 1
        nodes_variables.append(node_sin)
    nodes_variables.append(node_outcome)

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
    return JsonResponse({'outcome': outcome,
                         'nodes':nodes_variables,'links':links})

#modify graph and recaculate effect_value
def get_value_of_graph(request):
    G = nx.DiGraph()
    nodes_variables = request.GET.get("variables").split(",")
    linkslist = request.GET.get('linkslist').split(",")
    outcome = request.GET.get('outcome')
    dataset = request.GET.get('dataset')

    if dataset == 'ukb':
        fileName = ukb_file
    elif dataset == 'clhls':
        fileName = clhls_file

    # 读取CSV文件
    data = pd.read_csv(fileName)

    outcome_vars = nodes_variables + [outcome]
    outcome_data_df = data[outcome_vars]

    links = []
    for i in range(len(links)/2-1):
        links.append({
            'source': linkslist[i*2],
            'target': linkslist[i*2+1]
        })
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
                # link["effect_value"] = estimate.value
                link["value"] = estimate.value
            else:
                print(f"Causal effect estimation failed for {source} to {target}")
        else:
            print(f"Causal identification failed for {source} to {target}")

    return JsonResponse({'links': links})
def select_factor(request):
    # 数据文件的路径，需要为excel表格;Django读取失败时，需 install openpyxl，Excel文件路径前的r是为了Windows转义用
    # filename = r"C:\MyProjects_yuxi\ComparativeVis\Django+vue前后端交互\django_vue\multiOutcomeInter\myApp\MissingValue_fill_data_all.xlsx"
    filename = "./myApp/MissingValue_fill_data_all.csv"
    # filename = "C:/MyProjects_yuxi/6-comparativeVis/Django+vue前后端交互/django_vue/multiOutcomeInter/MissingValue_fill_data_all.xlsx"
    # 指定的选出因素变量的数目
    # 通过 num = request.GET.get("num")，来获取前端get请求中的参数"num"的值
    CovariantNum = request.GET.get("CovariantNum")  # CovariantNum
    outcome = request.GET.get("outcome")
    # if CovariantNum == 5 and outcome == "death":
    #     return HttpResponse('数据渲染成功')

    dataset = pd.read_excel(filename, index_col=0)

    labels = list(dataset.columns.values)
    num_results = len(results)
    factors = list(set(labels) - set(results))
    num_factors = len(factors)

    # if num_factors < CovariantNum:
    #     print("指定的选出因素变量的数目大于所有的因素变量数目")
    #     sys.exit(0)
    # 减少不必要的报错

    df = dataset.drop(columns=list(set(results) - {outcome}))
    df.dropna(inplace=True)
    top_factors = {}
    for factor in factors:
        X = df[factor]
        y = df[outcome]
        X2 = sm.add_constant(X)
        est = sm.OLS(y, X2)
        est2 = est.fit()
        top_factors[factor] = abs(est2.pvalues[1])

    top_factors = sorted(top_factors.items(), key=lambda x: x[1])
    top_factors = dict(top_factors)
    top_factors_list = list(top_factors)[:int(CovariantNum)]
    # print(top_factors)  # 为按相关性从最高到最低排序的全部factor变量
    print("结局变量为：{},最相关的{}个变量为:{}".format(outcome, CovariantNum, top_factors_list))
    # print(top_factors_list)  # 为按相关性从最高到最低排序的前CovariantNum个factor变量
    # nodes_list = top_factors_list.append("outcome")
    nodes_list = [outcome]
    print("初始节点为:{}".format(nodes_list))
    nodes_list_all = top_factors_list + nodes_list
    print("最终节点为:{}".format(nodes_list_all))
    # # print("当前为{}的结果".format(outcome))
    # df.drop(columns=list(top_factors)[int(CovariantNum):], inplace=True)
    # # df.to_csv(outcome + '.csv')
    df = df[nodes_list_all]
    # print(df)
    data = df.to_numpy()

    # PC算法
    # cg_without_background_knowledge = pc(data, 0.05, fisherz, True, 0,
    #                                      0)  # Run PC and obtain the estimated graph (CausalGraph object)
    cg_without_background_knowledge = pc(data, 0.05, fisherz, True, 0,
                                         3)  # Run PC and obtain the estimated graph (CausalGraph object)
    nodes_pc = cg_without_background_knowledge.G.get_nodes()

    # cg = pc(data, 0.05, fisherz, True, 0, 3)
    # result_data = cg.G
    # print(result_data)

    # edges = []
    # for i, j in nodes_list_all:
    #     if cg.G.graph[j, i] == 1 and cg.G.graph[i, j] == -1:
    #         source = i, target = j
    #         edge = {source, target}
    #         edges += edge
    # return edges
    # print(edges)

    '''
    cg : a CausalGraph object, where 
    cg.G.graph[j,i]=1 and cg.G.graph[i,j]=-1 indicate i –> j; 
    cg.G.graph[i,j] = cg.G.graph[j,i] = -1 indicate i — j; 
    cg.G.graph[i,j] = cg.G.graph[j,i] = 1 indicates i <-> j.
    '''

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
    print('因果图的有向边为：\n', links)

    # 获取特定结局的PC因果算法所得的节点
    nodes_variables = []
    node_outcome = {}  # TypeError: list indices must be integers or slices, not str --- 设成对象而非数组
    node_outcome['id'] = outcome
    node_outcome['type'] = 0
    print(node_outcome)
    for node_ele in top_factors_list:
        node_sin = {}
        node_sin['id'] = node_ele
        node_sin['type'] = 1
        # print(node_sin)
        # aJson = json.dumps(aItem)
        # link_sinJson = json.dumps(link_sin)
        nodes_variables.append(node_sin)
    print(nodes_variables)
    nodes_variables.append(node_outcome)
    print('因果图的节点为：\n', nodes_variables)


    # print(result_data)
    # with open(outcome+"_cg.txt", "w") as f:
    #     # print('Hi', file=f)
    #     print(cg.G, file=f)   # 仅该行代码时出来的为点和边的信息（如点：X1,X2,X3；边：X1---X2,X1---X4;）todo:如何实现显示原始节点名称
    # print(cg.G.graph,file=f)   #仅该行代码时出来的仅有矩阵信息
    # print(cg['G'],file=f)
    # print(cg['score'],file=f)

    # node_line = linecache.getline('../outcome+"_cg.txt"', 2)
    # print(node_line)

    # 读取txt文件
    # result_graph = open('f', "r")
    # node_line = linecache.getline(r'C:\MyProjects_yuxi\ComparativeVis\Django+vue前后端交互\django_vue\multiOutcomeInter\f.txt', 2)
    # print(node_line)

    # result_graph_file = open('../outcome+"_cg.txt"', "r")  # 此种路径命名方式不可行
    # result_graph = result_graph_file.readlines()
    # print(result_graph)
    # result_graph.close()

    # def change_type(byte):     # 未转换成功
    #     if isinstance(byte, bytes):
    #         return str(byte, encoding="utf-8")
    #     return json.JSONEncoder.default(byte)
    #
    # # 关键步骤：转化为json格式，并返回给前端   # 未转换成功
    # return HttpResponse(json.dumps(data,cls=change_type), content_type="application/json", safe=False)  # 数据非字典格式时，加参数safe = false
    #
    # return HttpResponse(result_data)  # 经测试，HttpResponse与JsonResponse不能共存
    # return HttpResponse(top_factors_list)  # 测试成功
    # return JsonResponse({'top_factors_list': top_factors_list, 'outcome': outcome, 'edges': result_data})
    return JsonResponse({'top_factors_list': top_factors_list, 'outcome': outcome, 'CovariantNum': CovariantNum,'nodes_list_all': nodes_list_all,
                         'nodes':nodes_variables,'links':links})


# 定义一个去列表(列表元素是字典)重复的函数
def list_dict_duplicate_removal(request):
    # selection = request.POST.getlist("selection")  # 前端勾选的数据selection json 化后的selection;getlist能接收到数据，但是数据为空
    # selection = request.POST.get("selection")   # 此种情况会报错 TypeError: object of type 'NoneType' has no len()
    # selection = request.POST("selection")
    # return selection
    json_bytes = request.body
    json_str = json_bytes.decode()
    req_data = json.loads(json_str)
    selection = req_data['selection']
    print(selection)
    selection1 = req_data['selection1']
    print(selection1)
    # newList=[]

    nodesList = []
    linksList = []
    for i in range(len(selection)):
        nodesList += selection[i].get("nodes")
        linksList += selection[i].get("links")
    # data_list = [{"a": "123", "b": "321"}, {"a": "123", "b": "321"}, {"b": "321", "a": "123"}]
    run_function = lambda x, y: x if y in x else x + [y]
    # return reduce(run_function, [[], ] + nodesList), reduce(run_function, [[], ] + linksList)
    nodesList = reduce(run_function, [[], ] + nodesList)
    linksList = reduce(run_function, [[], ] + linksList)
    print(nodesList)
    print(linksList)
    return JsonResponse({'nodesList': nodesList, 'linksList': linksList})
    # return JsonResponse({'nodesList': reduce(0), 'linksList': reduce(1)})

    # return JsonResponse((list_dict_duplicate_removal(selection.[0].nodes, selection.[1].nodes)))

# 测试成功，所以留意读取文件
def variable_show(request):
    # 通过 num = request.GET.get("num")，来获取前端get请求中的参数"num"的值
    # CovariantNum = request.GET.get("CovariantNum")  # CovariantNum
    # outcome = request.GET.get("outcome")
    CovariantNum = 6
    outcome = "death"
    print(CovariantNum)
    return JsonResponse({'CovariantNum': CovariantNum, 'outcome': outcome, 'message': 'success'})
