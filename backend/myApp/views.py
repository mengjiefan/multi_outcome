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
    outcome_corr = data[factors].corrwith(data[outcome])
    # 所有的节点（包括结局变量和与结局变量相关的前top变量）
    outcome_vars = factors + [outcome]

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
    for node_ele in factors:
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
    source = request.GET.get('source')
    target = request.GET.get('target')
    dataset = request.GET.get('dataset')
    fileName = "./myApp/MissingValue_fill_data_all.csv"

    if dataset == 'ukb':
        fileName = ukb_file
    elif dataset == 'clhls':
        fileName = clhls_file

    # 读取CSV文件
    data = pd.read_csv(fileName)

    outcome_vars = [source, target]
    outcome_data_df = data[outcome_vars]

    G.add_node(source)
    G.add_node(target)

    G.add_edge(source, target)
    # 添加节点
    # 检查是否为有向无环图（DAG）
    if nx.is_directed_acyclic_graph(G):
        print(
            "The causal graph is a Directed Acyclic Graph (DAG).")  # The causal graph is a Directed Acyclic Graph (DAG).

    model = CausalModel(
        data=outcome_data_df,
        treatment=source,
        outcome=target,
    )
    # print("model为\n", model)
    effect_value = 0
    # Step 4: 识别因果效应
    identified_estimand = model.identify_effect(proceed_when_unidentifiable=True)
    if identified_estimand is not None:
        # Step 5: 估计因果效应
        estimate = model.estimate_effect(identified_estimand, method_name="backdoor.linear_regression")
        if estimate is not None:
            effect_value = estimate.value

    return JsonResponse({'value': effect_value})

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

def calculate_layout(request):
    postBody = request.body
    json_result = json.loads(postBody)
    nodesList = np.array(json_result['nodesList'])
    print(nodesList)
    return JsonResponse({})