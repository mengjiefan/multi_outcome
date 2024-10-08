import json

import torch
from django.http import HttpResponse, JsonResponse
import re  # 使用正则表达式
import pandas as pd
from numpy import *
import numpy as np
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
import copy
import os
from .daggnn.utils import load_data
from .daggnn.train import _h_A, args, train, init_model
from .aaai.run import runAAAI

import threading

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


# 根据outcome和factor获取所有节点和边
# 实际中，不需要再次计算此步，直接拿第一步中的经过交互完成之后的经专家确认的多个子图中的节点和边（去重后），交给dagre绘制即可

data_file = "./myApp/data/data.json"

stop_Thread = False
suspend_lock = None
thread = None
epoch_loss = None
best_MSE_graph = []
with open(data_file, 'r') as file:
    allData = json.load(file)

def get_outcomes(request):
    try:
        dataset = request.GET.get('dataset')
        return JsonResponse({'outcomes':allData[dataset]['outcomes']
                         })
    except Exception as e:
        return JsonResponse({'outcomes': []
                             })

def get_factors(request):
    try:
        dataset = request.GET.get('dataset')
        return JsonResponse({'factors':allData[dataset]['factors']
                             })
    except Exception as e:
        return JsonResponse({'factors': []
                             })
def get_index(request):
    try:
        dataset = request.GET.get('dataset')
        return JsonResponse({'index': allData[dataset]['index']
                             })
    except Exception as e:
        return JsonResponse({'index': []
                             })
def get_all_dataset(request):
    csv_directory = './myApp/data'
    # 检查目录是否存在
    if not os.path.exists(csv_directory):
        return JsonResponse({'error': 'Directory not found'}, status=404)

    # 获取目录下的所有CSV文件
    csv_files = [os.path.splitext(f)[0] for f in os.listdir(csv_directory) if f.endswith('.csv')]

    return JsonResponse(csv_files, safe=False)
def get_csv_data(request):
    dataset = request.GET.get('dataset')
    if not dataset:
        return JsonResponse({'error': 'Dataset parameter is required'}, status=400)

    # 构建CSV文件路径
    csv_file_path = os.path.join('./myApp/data/', f'{dataset}.csv')

    # 检查文件是否存在
    if not os.path.exists(csv_file_path):
        return JsonResponse({'error': 'CSV file not found'}, status=404)

    # 读取CSV文件内容
    with open(csv_file_path, 'r', encoding='utf-8') as file:
        csv_content = file.readlines()
        csv_content = [line.strip().split(',') for line in csv_content]
    return JsonResponse(csv_content, safe=False)

def save_new_data(request):
    file = request.FILES.get('file')
    name = request.POST.get('name')
    outcomes = request.POST.get('outcomes')
    discrete_index = request.POST.get('discreteIndex')
    factors = request.POST.get('factors')
    file_path = os.path.join('./myApp/data/', f'{name}.csv')
    with open(file_path, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)

    outcomes = json.loads(outcomes)
    discrete_index = json.loads(discrete_index)
    factors = json.loads(factors)

    allData[name] = {
        'factors': factors,
        'outcomes': outcomes,
        'index': discrete_index
    }
    with open(data_file, 'w', encoding='utf-8') as json_file:
        json.dump(allData, json_file, ensure_ascii=False, indent=4)
    return JsonResponse({'msg': 'new dataset saved successfully'})
def thread_task(data):
    global stop_Thread
    global best_MSE_graph
    global suspend_lock
    global epoch_loss
    train_loader = load_data(args, args.batch_size, data)
    best_ELBO_loss = np.inf
    best_NLL_loss = np.inf
    best_MSE_loss = np.inf
    best_epoch = 0
    best_ELBO_graph = []
    best_NLL_graph = []
    # optimizer step on hyparameters
    c_A = args.c_A
    lambda_A = args.lambda_A
    h_A_new = torch.tensor(1.)
    h_tol = args.h_tol
    k_max_iter = int(args.k_max_iter)
    h_A_old = np.inf
    for step_k in range(k_max_iter):
        if stop_Thread:
            break
        suspend_lock.acquire()
        suspend_lock.release()
        while c_A < 1e+20:
            if stop_Thread:
                break
            suspend_lock.acquire()
            suspend_lock.release()
            for epoch in range(args.epochs):
                if stop_Thread:
                    break
                # ELBO_loss, NLL_loss, MSE_loss, graph, origin_A = train(epoch, best_ELBO_loss, ground_truth_G, lambda_A, c_A, optimizer)
                ELBO_loss, NLL_loss, MSE_loss, graph, origin_A = train(epoch, best_ELBO_loss, lambda_A, c_A,
                                                                       train_loader)
                suspend_lock.acquire()
                suspend_lock.release()
                if ELBO_loss < best_ELBO_loss:
                    best_ELBO_loss = ELBO_loss
                    best_epoch = epoch
                    best_ELBO_graph = graph

                if NLL_loss < best_NLL_loss:
                    best_NLL_loss = NLL_loss
                    best_epoch = epoch
                    best_NLL_graph = graph

                if MSE_loss < best_MSE_loss:
                    best_MSE_loss = MSE_loss
                    best_epoch = epoch
                    best_MSE_graph = graph
                epoch_loss = {
                    'epoch': epoch,
                    'ELBO_loss': ELBO_loss,
                    'NLL_loss': NLL_loss,
                    'MSE_loss': MSE_loss
                }
            print("Optimization Finished!")
            print("Best Epoch: {:04d}".format(best_epoch))
            if ELBO_loss > 2 * best_ELBO_loss:
                break

            # update parameters
            A_new = origin_A.data.clone()
            h_A_new = _h_A(A_new, args.data_variable_size)
            if h_A_new.item() > 0.25 * h_A_old:
                c_A *= 10
            else:
                break

            # update parameters
            # h_A, adj_A are computed in loss anyway, so no need to store
        h_A_old = h_A_new.item()
        lambda_A += c_A * h_A_new.item()

        if h_A_new.item() <= h_tol:
            break


def start_loop(request):
    global stop_Thread
    global suspend_lock
    global thread
    global best_MSE_graph
    global epoch_loss
    suspend_lock = threading.Lock()
    print("start loop!")
    postBody = request.body
    json_result = json.loads(postBody)
    nodesList = np.array(json_result['nodesList'])
    dataset = json_result['dataset']
    fileName = "./myApp/data/"+dataset+".csv"

    data = pd.read_csv(fileName)
    if thread:
        thread.join()  # 防止之前的thread还未完全结束，而init中改变了全局变量导致出错
    stop_Thread = False
    best_MSE_graph = []
    epoch_loss = None
    init_model(len(nodesList))
    thread = threading.Thread(target=thread_task, args=(data[nodesList],))
    thread.start()
    return JsonResponse({'msg': 'start daggnn loop'})


def get_aaai(request):
    postBody = request.body
    json_result = json.loads(postBody)
    nodesList = np.array(json_result['nodesList'])
    dataset = json_result['dataset']
    dag = runAAAI(dataset, nodesList)
    linksList = []
    for i, row in enumerate(dag):
        for j, element in enumerate(row):
            if element != 0:
                source = nodesList[i]
                target = nodesList[j]
                linksList.append({'source':source, "target":target, 'value':1})
    return JsonResponse({'linksList': linksList})

def numpy_to_json(obj):
    if isinstance(obj, np.ndarray):
        obj = obj.tolist()  # 将NumPy数组转换为列表
    return json.dumps(obj)


def pause_loop(request):
    global suspend_lock
    suspend_lock.acquire()
    return JsonResponse({'msg': 'loop paused'})


def continue_loop(request):
    global suspend_lock
    suspend_lock.release()
    return JsonResponse({'msg': 'loop continues'})


def stop_loop(request):
    global suspend_lock
    global stop_Thread
    global thread
    if suspend_lock and suspend_lock.locked():
        suspend_lock.release()
    stop_Thread = True
    if thread:
        thread.join()
        print("thread is killed")
    thread = None
    # get result
    return JsonResponse({'msg': 'stop loop'})


def get_temp_result(request):
    nodes = request.GET.get("nodes").split(",")
    linksList = []
    for i, row in enumerate(best_MSE_graph):
        for j, element in enumerate(row):
            if element != 0:
                source = nodes[i]
                target = nodes[j]
                linksList.append({'source': source, 'target': target, 'value': 1})
    if epoch_loss:
        return JsonResponse({'linksList': linksList,
                         'epoch': epoch_loss['epoch'],
                         'ELBO_loss': epoch_loss['ELBO_loss'],
                         'NLL_loss': epoch_loss['NLL_loss'],
                         'MSE_loss': epoch_loss['MSE_loss']
                         })
    else:
        return JsonResponse({'linksList': linksList})

def get_correlation(request):
    outcome = request.GET.get("outcome")
    dataset = request.GET.get('dataset')
    outcomes = allData[dataset]['outcomes']
    fileName = "./myApp/data/" + dataset + ".csv"

    data = pd.read_csv(fileName)
    factors = [col for col in data.columns if col not in outcomes]
    outcome_corr = data[factors].corrwith(data[outcome])
    all_variables = outcome_corr.index.tolist()
    all_values = outcome_corr.tolist()
    return JsonResponse({'outcome': all_values, 'variable': all_variables})

def get_list(request):
    num_top = request.GET.get("CovariantNum")  # CovariantNum
    num_top = int(num_top)
    outcome = request.GET.get("outcome")
    dataset = request.GET.get('dataset')
    outcomes = allData[dataset]['outcomes']
    fileName = "./myApp/data/" + dataset + ".csv"

    # 读取CSV文件
    data = pd.read_csv(fileName)

    # 获取除了outcomes列表中指定的变量之外的其他变量
    factors = [col for col in data.columns if col not in outcomes]
    # 计算因素变量的大小
    factor_size = len(factors)
    # 打印结果
    print("因素变量的大小：", factor_size)

    outcome_corr = data[factors].corrwith(data[outcome])
    all_variables = outcome_corr.index.tolist()
    all_values = outcome_corr.tolist()
    # 获取 top 变量
    top_correlated = outcome_corr.abs().nlargest(num_top)
    top_correlated_factors = top_correlated.index.tolist()
    # 所有的节点（包括结局变量和与结局变量相关的前top变量）
    outcome_vars = top_correlated_factors + [outcome]

    outcome_data_df = data[outcome_vars]
    # print(outcome_data_df)

    # 将选定结局及与其相关的前top个元素一起组成的outcome_data_df，存到 /backend/DAG_from_GNN_main目录下的datasets文件夹[./backend/DAG_from_GNN_main/datasets]下
    # outcome_data_df.to_csv('./DAG_from_GNN_main/datasets/causal_related_data.csv', index=False)

    # (1) 运行 dag-gnn
    # 调用函数
    # run_dag_gnn_command()
    # run_command_with_timeout(['python', '-m', 'DAG_from_GNN'], timeout_seconds=60)

    # 返回原文件夹
    # os.chdir('./myApp')

    # 以下方式可实现手动进行，但是手动输入 Ctrl + C时，会导致整个后端Django终止
    # 进入新的文件夹
    # os.chdir('./DAG_from_GNN_main')
    #
    # # 执行 python -m DAG_from_GNN 命令
    # try:
    #     subprocess.run(['python', '-m', 'DAG_from_GNN'], check=True)
    # except subprocess.CalledProcessError as e:
    #     print(f"Error executing python -m DAG_from_GNN: {e}")

    # (3) 运行 PC

    # 将DataFrame转换为NumPy数组
    data_array = outcome_data_df.to_numpy()

    # 使用转换后的NumPy数组运行PC算法
    cg = pc(data_array, 0.5, fisherz, True, 0, 3, outcome_vars)
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
                # link["effect_value"] = estimate.value
                link["value"] = estimate.value
            else:
                print(f"Causal effect estimation failed for {source} to {target}")
        else:
            print(f"Causal identification failed for {source} to {target}")

    # 输出所有因果效应值
    print("All causal effect values:", effect_values)
    return JsonResponse({'outcome': outcome, 'CovariantNum': num_top,
                         'nodes': nodes_variables, 'links': links,
                         'allValue': {'outcome': all_values, 'variable': all_variables}})


def get_causal_edges(request):
    outcome = request.GET.get("outcome")
    dataset = request.GET.get('dataset')
    fileName = "./myApp/data/" + dataset + ".csv"

    factors = request.GET.get("factors").split(",")
    print(factors)
    print(outcome)
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
    cg = pc(data_array, 0.5, fisherz, True, 0, 3, outcome_vars)
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
                         'nodes': nodes_variables, 'links': links})

# 获取所有效应值（没有用到）
def get_values_for_node(request):
    outcome = request.GET.get("id")

    dataset = request.GET.get('dataset')
    outcomes = allData[dataset]['outcomes']
    fileName = "./myApp/data/" + dataset + ".csv"

    # 读取CSV文件
    data = pd.read_csv(fileName)

    outcomes.append(outcome)
    factors = [col for col in data.columns if col not in outcomes]

    values = []
    for factor in factors:
        value = count_value(factor, outcome, dataset)
        values.append({
            'id': factor,
            'value': value
        })
    return JsonResponse({'target': outcome, 'values': values})


def count_value(source, target, dataset):
    G = nx.DiGraph()

    fileName = "./myApp/data/" + dataset + ".csv"

    # 读取CSV文件
    data = pd.read_csv(fileName)

    outcome_vars = [source, target]
    outcome_data_df = data[outcome_vars]

    G.add_node(source)
    G.add_node(target)

    G.add_edge(source, target)
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
    return effect_value


def get_value_of_graph(request):
    source = request.GET.get('source')
    target = request.GET.get('target')
    dataset = request.GET.get('dataset')
    value = count_value(source, target, dataset)

    return JsonResponse({'value': value})


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


def pre_process(nodesList):
    fixed_nodes_supergraph = get_fixedNodes(nodesList)
    max_order_ori_supergraph_fixedNodes, min_order_ori_supergraph_fixedNodes = get_fixedNodes_order(
        fixed_nodes_supergraph)
    fixed_order_ori_center_supergraph = (max_order_ori_supergraph_fixedNodes + min_order_ori_supergraph_fixedNodes) / 2
    return fixed_order_ori_center_supergraph


def calculate_tree_layout(request):
    postBody = request.body
    json_result = json.loads(postBody)
    nodesList = np.array(json_result['nodesList'])
    linksList = np.array(json_result['linksList'])
    grouped_data_subgraph = grouped_data_supergraph = get_grouped_data(nodesList, linksList)
    fixed_order_ori_center_supergraph = pre_process(nodesList)
    # 生成按组区分的所有节点（即每个dag图--后续可考虑用outcome名称来命名组）的更新之后的节点列表，，其中的order为新更新的
    all_groups_nodes_new = get_tree_order_new(grouped_data_subgraph,
                                              fixed_order_ori_center_supergraph)  # 为按组区分的dag，每个dag内均有新生成的的nodes列表

    return JsonResponse({'graph': all_groups_nodes_new})


def calculate_aggregate_layout(request):
    postBody = request.body
    json_result = json.loads(postBody)
    nodesList = np.array(json_result['nodesList'])
    linksList = np.array(json_result['linksList'])
    grouped_data_subgraph = get_grouped_data(nodesList, linksList)
    fixed_order_ori_center_supergraph = pre_process(nodesList)
    fixed_nodes_supergraph = get_fixedNodes(nodesList)
    # 生成按组区分的所有节点（即每个dag图--后续可考虑用outcome名称来命名组）的更新之后的节点列表，，其中的order为新更新的
    all_groups_nodes_new = get_aggregate_order_new(grouped_data_subgraph, fixed_order_ori_center_supergraph,
                                                   fixed_nodes_supergraph)
    return JsonResponse({'graph': all_groups_nodes_new})


def calculate_center_layout(request):
    postBody = request.body
    json_result = json.loads(postBody)
    nodesList = np.array(json_result['nodesList'])
    linksList = np.array(json_result['linksList'])
    grouped_data_subgraph = get_grouped_data(nodesList, linksList)
    fixed_order_ori_center_supergraph = pre_process(nodesList)
    # 生成按组区分的所有节点（即每个dag图--后续可考虑用outcome名称来命名组）的更新之后的节点列表，，其中的order为新更新的
    all_groups_nodes_new = get_center_order_new(grouped_data_subgraph)  # 为按组区分的dag，每个dag内均有新生成的的nodes列表
    print(all_groups_nodes_new)  # 为按组区分的dag，每个dag内均有新生成的的nodes列表

    return JsonResponse({'graph': all_groups_nodes_new})


def calculate_relative_layout(request):
    postBody = request.body
    json_result = json.loads(postBody)
    nodesList = np.array(json_result['nodesList'])
    linksList = np.array(json_result['linksList'])
    grouped_data_subgraph = get_grouped_data(nodesList, linksList)
    fixed_order_ori_center_supergraph = pre_process(nodesList)
    fixed_nodes_supergraph = get_fixedNodes(nodesList)
    # 生成按组区分的所有节点（即每个dag图--后续可考虑用outcome名称来命名组）的更新之后的节点列表，，其中的order为新更新的
    all_groups_nodes_new = get_relative_order_new(grouped_data_subgraph, fixed_order_ori_center_supergraph,
                                                  fixed_nodes_supergraph)
    return JsonResponse({'graph': all_groups_nodes_new})


def get_fixedNodes(nodes):
    # 根据fixed属性获取超图得到的固定节点
    fixed_nodes = []
    for node in nodes:
        if node['fixed'] == True:
            fixed_nodes.append(node)
    return fixed_nodes


def get_fixedNodes_order(fixed_nodes):
    # 根据传入的fixed_nodes列表获取其内的固定节点的原始order
    # 初始化最小和最大值为第一个节点的"order"值
    if len(fixed_nodes) == 0:
        return 0, 0
    min_order = fixed_nodes[0]['order']
    max_order = fixed_nodes[0]['order']

    # 遍历固定节点列表以找到固定节点的最小和最大的原始"order"值（此处的原始order是针对的所有层级内的节点的水平的排序顺序）
    for node in fixed_nodes:
        current_order = node['order']
        if current_order < min_order:
            min_order = current_order  # 通过遍历得到最小order值
        if current_order > max_order:
            max_order = current_order  # 通过遍历得到最大order值

    return max_order, min_order


def get_grouped_data(nodes, edges):
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

    return grouped_data  # 所有组dag的字典


def get_nonFixedNodes(nodes):
    # 根据fixed属性获取非固定节点
    non_fixed_nodes = []
    for node in nodes:
        if node['fixed'] == False:
            non_fixed_nodes.append(node)
    return non_fixed_nodes


def get_center_order_new(grouped_data):
    final_nodes_new = []  # 用于存储最终的节点列表
    # 遍历每一个组内的所有节点
    for group, data in grouped_data.items():
        group_nodes = data['nodes']  # 获取该组的节点列表，用于后续操作获取新的节点order
        current_group_fixed_nodes = get_fixedNodes(group_nodes)
        current_group_non_fixed_nodes = get_nonFixedNodes(group_nodes)
        max_order_current_group_fixed_nodes, min_order_current_group_fixed_nodes = get_fixedNodes_order(
            current_group_fixed_nodes)

        fixed_order_ori_center_current_group = (
                                                           max_order_current_group_fixed_nodes + min_order_current_group_fixed_nodes) / 2

        print("当前组的固定节点的水平中心点为：\n{}".format(fixed_order_ori_center_current_group))

        # 创建一个字典来存储每个rank值对应的全部节点列表
        rank_to_nodes = {}
        # 创建一个字典来存储每个rank值对应的非固定节点列表
        rank_to_non_fixed_nodes = {}

        # 将全部节点按照rank值分组
        for node_data in group_nodes:
            rank = node_data['rank']
            if rank not in rank_to_nodes:
                rank_to_nodes[rank] = []
            rank_to_nodes[rank].append(node_data)

        # 将非固定节点按照rank值分组
        for node_data in current_group_non_fixed_nodes:
            rank = node_data['rank']
            if rank not in rank_to_non_fixed_nodes:
                rank_to_non_fixed_nodes[rank] = []
            rank_to_non_fixed_nodes[rank].append(node_data)

        current_group_nodes = []  # 用于存储当前组的所有节点

        # 遍历节点, 计算每个节点的 new_order
        for node_data in group_nodes:
            if node_data['fixed'] == True:
                # node_data['new_order'] = fixed_order_ori_center_current_group
                node_data['new_order'] = node_data['order']
            else:
                # node_data['new_order'] = fixed_order_ori_center_current_group
                # 遍历非固定节点的rank值分组
                for rank, nodes in sorted(rank_to_non_fixed_nodes.items()):
                    # 对相同rank值的节点按照order进行排序
                    sorted_non_fixed_nodes = sorted(nodes, key=lambda x: x['order'])

                    # 计算具有相同rank的非固定节点数量
                    num_non_fixed_nodes_with_same_rank = len(sorted_non_fixed_nodes)

                    # 计算具有相同rank的非固定节点的中心索引
                    center_index_non_fixed = num_non_fixed_nodes_with_same_rank // 2

                    # 确定节点数量是奇数还是偶数
                    is_even_non_fixed = num_non_fixed_nodes_with_same_rank % 2 == 0

                    # 方法四：计算每个节点的 new_order
                    for i, node_data in enumerate(sorted_non_fixed_nodes):
                        # 如果rank值唯一，将new_order赋值为nodes_centerx
                        if num_non_fixed_nodes_with_same_rank == 1:
                            node_data['new_order'] = fixed_order_ori_center_current_group
                        else:
                            # 根据奇偶性计算 new_order
                            if is_even_non_fixed:  # 偶数
                                if i < (center_index_non_fixed - 0.5):
                                    node_data['new_order'] = fixed_order_ori_center_current_group - (
                                            (center_index_non_fixed - 0.5) - i)
                                else:
                                    node_data['new_order'] = fixed_order_ori_center_current_group + (
                                            i - (center_index_non_fixed - 0.5))
                            else:  # 奇数
                                # node_data['new_order'] = fixed_order_ori_center_current_group + ((i - center_index_non_fixed)  )
                                if i == center_index_non_fixed:
                                    node_data['new_order'] = fixed_order_ori_center_current_group
                                elif i < center_index_non_fixed:
                                    node_data['new_order'] = fixed_order_ori_center_current_group - (
                                            center_index_non_fixed - i)
                                else:
                                    node_data['new_order'] = fixed_order_ori_center_current_group + (
                                            i - center_index_non_fixed)

        # 遍历rank值分组
        for rank, nodes in sorted(rank_to_nodes.items()):
            # 对相同rank值的节点按照order进行排序
            sorted_nodes = sorted(nodes, key=lambda x: x['order'])

            for i, node_data in enumerate(sorted_nodes):
                print(node_data)
                # 将节点添加到当前组的节点列表中
                current_group_nodes.append(node_data)

        # 将当前组的节点列表添加到最终的节点列表中
        # 通过使用 copy.deepcopy，你创建了 current_group_nodes 列表的完全独立副本，确保对它的任何修改都不会影响已附加到 final_nodes_new 的列表。
        final_nodes_new.append(copy.deepcopy(current_group_nodes))  # 使用深拷贝来避免修改原始列表的问题

    # # 最终的节点列表包含了所有组的数据
    return final_nodes_new


def get_aggregate_order_new(grouped_data, nodes_centerx, fixed_nodes_supergraph):
    final_nodes_new = []  # 用于存储最终的节点列表

    for group, data in grouped_data.items():
        group_nodes = data['nodes']  # 获取该组的节点列表，用于后续操作获取新的节点order

        # 对子图内所有节点按'order'值从小到大排序，用于保持相对位置并压缩子图
        sorted_all_nodes_subgraph = sorted(group_nodes, key=lambda x: x['order'])
        # 生成新的'order_relative_sub_all_nodes'值
        order_relative_sub_all_nodes = 0
        current_order = None

        for node in sorted_all_nodes_subgraph:
            if node['order'] != current_order:
                order_relative_sub_all_nodes += 1
                current_order = node['order']
            node['order_relative_sub_all_nodes'] = order_relative_sub_all_nodes

        # 初始化最小和最大值为第一个节点的"order_relative_sub_all_nodes"值
        min_order_current_rela = sorted_all_nodes_subgraph[0]['order_relative_sub_all_nodes']
        max_order_current_rela = sorted_all_nodes_subgraph[0]['order_relative_sub_all_nodes']

        # 遍历节点列表以找到节点的最小和最大的原始"order"值（此处的原始order是针对的所有层级内的节点的水平的排序顺序）
        for node in sorted_all_nodes_subgraph:
            current_order = node['order_relative_sub_all_nodes']
            if current_order < min_order_current_rela:
                min_order_current_rela = current_order  # 通过遍历得到最小order值
            if current_order > max_order_current_rela:
                max_order_current_rela = current_order  # 通过遍历得到最大order值
            center_current_rela = (max_order_current_rela + min_order_current_rela) / 2
        print("当前组节点的相对水平中心点为：\n{}".format(center_current_rela))
        for node in sorted_all_nodes_subgraph:
            # 方法三：获取了每个子图中所有节点的水平相对顺序 order_relative_sub_all_nodes 之后，保持相对顺序不变的情况下，计算所有节点相对于超图中心点的顺序 new_order
            node['new_order'] = node['order_relative_sub_all_nodes'] - center_current_rela + nodes_centerx
            node['distance'] = node['new_order'] - node['order']

        rank_to_nodes = {}
        # 创建一个字典来存储每个rank值对应的非固定节点列表
        rank_to_non_fixed_nodes = {}
        current_group_nodes = []  # 用于存储当前组的所有节点
        # 将全部节点按照rank值分组
        for node_data in group_nodes:
            rank = node_data['rank']
            if rank not in rank_to_nodes:
                rank_to_nodes[rank] = []
            rank_to_nodes[rank].append(node_data)

        # 遍历rank值分组
        for rank, nodes in sorted(rank_to_nodes.items()):
            # 对相同rank值的节点按照order进行排序
            sorted_nodes = sorted(nodes, key=lambda x: x['order'])

            for i, node_data in enumerate(sorted_nodes):
                print(node_data)
                # 将节点添加到当前组的节点列表中
                current_group_nodes.append(node_data)
        # 将当前组的节点列表添加到最终的节点列表中
        # 通过使用 copy.deepcopy，你创建了 current_group_nodes 列表的完全独立副本，确保对它的任何修改都不会影响已附加到 final_nodes_new 的列表。
        final_nodes_new.append(copy.deepcopy(current_group_nodes))  # 使用深拷贝来避免修改原始列表的问题

    # # 最终的节点列表包含了所有组的数据
    return final_nodes_new


def get_relative_order_new(grouped_data, nodes_centerx, fixed_nodes_supergraph):
    final_nodes_new = []  # 用于存储最终的节点列表

    # 遍历每一个组内的所有节点
    for group, data in grouped_data.items():
        sorted_all_fixed_nodes = sorted(fixed_nodes_supergraph, key=lambda x: x['order'])
        order_sup_fixed_nodes_rela = 0
        order_sup_fixed = None
        for node in sorted_all_fixed_nodes:
            if node['order'] != order_sup_fixed:
                order_sup_fixed_nodes_rela += 1
                order_sup_fixed = node['order']
            node['order_sup_fixed_nodes_rela'] = order_sup_fixed_nodes_rela
        # 1.2 超图的共用节点按顺序匹配与超图中心点靠近的值
        # 初始化最小和最大值为第一个节点的"order_relative_sub_all_nodes"值
        min_order_sup_fixed = sorted_all_fixed_nodes[0]['order_sup_fixed_nodes_rela']
        max_order_sup_fixed = sorted_all_fixed_nodes[0]['order_sup_fixed_nodes_rela']

        # 遍历节点列表以找到节点的最小和最大的原始"order"值（此处的原始order是针对的所有层级内的节点的水平的排序顺序）
        for node in sorted_all_fixed_nodes:
            current_order = node['order_sup_fixed_nodes_rela']
            if current_order < min_order_sup_fixed:
                min_order_sup_fixed = current_order  # 通过遍历得到最小order值
            if current_order > max_order_sup_fixed:
                max_order_sup_fixed = current_order  # 通过遍历得到最大order值
            center_sup_fixed = (min_order_sup_fixed + max_order_sup_fixed) / 2
        print("超图固定节点的相对水平中心点为：\n{}".format(center_sup_fixed))
        for node in sorted_all_fixed_nodes:
            node['order_fixed_relative_compact'] = node['order_sup_fixed_nodes_rela'] - center_sup_fixed + nodes_centerx

        group_nodes = data['nodes']
        sorted_all_nodes_subgraph = sorted(group_nodes, key=lambda x: x['order'])
        # 生成新的'order_relative_sub_all_nodes'值
        order_relative_sub_all_nodes = 0
        current_order = None

        for node in sorted_all_nodes_subgraph:
            if node['order'] != current_order:
                order_relative_sub_all_nodes += 1
                current_order = node['order']
            node['order_relative_sub_all_nodes'] = order_relative_sub_all_nodes

        print(sorted_all_nodes_subgraph)

        # 调用函数并获取返回值
        current_group_fixed_nodes = get_fixedNodes(group_nodes)
        print('current_group_fixed_nodes:\n{}'.format(current_group_fixed_nodes))
        current_group_non_fixed_nodes = get_nonFixedNodes(group_nodes)

        # 获取当前组固定节点order_relative_sub_all_nodes值的最小和最大值
        # 初始化最小和最大值为第一个节点的"order"值
        max_order_current_fixed = 0
        min_order_current_fixed = 0
        if len(current_group_fixed_nodes) != 0:
            min_order_current_fixed = current_group_fixed_nodes[0]['order_relative_sub_all_nodes']
            max_order_current_fixed = current_group_fixed_nodes[0]['order_relative_sub_all_nodes']
        # 遍历当前组固定节点列表以找到固定节点的最小和最大的"order_relative_sub_all_nodes"值
        for node in current_group_fixed_nodes:
            current_order = node['order_relative_sub_all_nodes']
            if current_order < min_order_current_fixed:
                min_order_current_fixed = current_order  # 通过遍历得到最小order值
            if current_order > max_order_current_fixed:
                max_order_current_fixed = current_order  # 通过遍历得到最大order值

        # 获取当前组固定节点order_fixed_relative_compact值的最小和最大值
        # 初始化最小和最大值为第一个节点的"order"值
        max_order_current_fixed_optimal = 0
        min_order_current_fixed_optimal = 0
        if len(current_group_fixed_nodes) != 0:
            min_order_current_fixed_optimal = current_group_fixed_nodes[0]['order_fixed_relative_compact']
            max_order_current_fixed_optimal = current_group_fixed_nodes[0]['order_fixed_relative_compact']

        # 遍历当前组固定节点列表以找到固定节点的最小和最大的"order_fixed_relative_compact"值
        for node in current_group_fixed_nodes:
            current_order = node['order_fixed_relative_compact']
            if current_order < min_order_current_fixed_optimal:
                min_order_current_fixed_optimal = current_order  # 通过遍历得到最小order值
            if current_order > max_order_current_fixed_optimal:
                max_order_current_fixed_optimal = current_order  # 通过遍历得到最大order值

        for node in sorted_all_nodes_subgraph:
            # 方法五：获取了每个子图中所有节点的水平相对顺序 order_relative_sub_all_nodes 之后，保持所有节点水平方向相对顺序不变且固定节点紧致之后再锚定的条件下，计算所有节点相对于超图中心点的顺序 new_order
            if node['fixed'] == True:
                # print(node['node'])
                # print(f"固定节点：{node['node']}")
                node['new_order'] = node['order_fixed_relative_compact']
            else:
                if node['order_relative_sub_all_nodes'] <= min_order_current_fixed:
                    node['new_order'] = min_order_current_fixed_optimal + node[
                        'order_relative_sub_all_nodes'] - min_order_current_fixed
                if node['order_relative_sub_all_nodes'] >= max_order_current_fixed:
                    node['new_order'] = max_order_current_fixed_optimal + node[
                        'order_relative_sub_all_nodes'] - max_order_current_fixed
                else:
                    # node['new_order'] = nodes_centerx
                    # 生成间隔为1的区间列表
                    # 从current_group_fixed_nodes列表中提取'order_relative_sub_all_nodes'的值
                    order_relative_sub_all_nodes_values = [item['order_relative_sub_all_nodes'] for item in
                                                           current_group_fixed_nodes]

                    # 去除重复值并排序
                    unique_sorted_values = sorted(set(order_relative_sub_all_nodes_values))

                    # 初始化区间列表
                    intervals = []

                    # 生成区间
                    for i in range(len(unique_sorted_values) - 1):
                        start = unique_sorted_values[i]
                        end = unique_sorted_values[i + 1]
                        intervals.append((start, end))

                    print("interval为：\n{}".format(intervals))
                    # 遍历区间列表并检查值的位置
                    for interval in intervals:
                        if interval[0] < node['order_relative_sub_all_nodes'] < interval[1]:
                            # 遍历节点列表，查找匹配的节点
                            for fixed_node in current_group_fixed_nodes:
                                if fixed_node['order_relative_sub_all_nodes'] == interval[0]:
                                    order_fixed_rela_start = fixed_node['order_fixed_relative_compact']
                                    print(
                                        f"找到匹配的节点：{node['node']}，order_fixed_rela_start值为 {order_fixed_rela_start}")
                                    # 计算逻辑：起点的值加上倍数个间隔
                                    node['new_order'] = order_fixed_rela_start + (
                                                node['order_relative_sub_all_nodes'] - interval[0]) / (
                                                                    interval[1] - interval[0])
                                # else:
                                #     print(f"未找到匹配的节点")

        # 创建一个字典来存储每个rank值对应的全部节点列表
        rank_to_nodes = {}
        # 创建一个字典来存储每个rank值对应的非固定节点列表
        rank_to_non_fixed_nodes = {}

        # 将全部节点按照rank值分组
        for node_data in group_nodes:
            rank = node_data['rank']
            if rank not in rank_to_nodes:
                rank_to_nodes[rank] = []
            rank_to_nodes[rank].append(node_data)

        # 将非固定节点按照rank值分组
        for node_data in current_group_non_fixed_nodes:
            rank = node_data['rank']
            if rank not in rank_to_non_fixed_nodes:
                rank_to_non_fixed_nodes[rank] = []
            rank_to_non_fixed_nodes[rank].append(node_data)

        current_group_nodes = []  # 用于存储当前组的所有节点

        for rank, nodes in sorted(rank_to_nodes.items()):
            # 对相同rank值的节点按照order进行排序
            sorted_nodes = sorted(nodes, key=lambda x: x['order'])

            for i, node_data in enumerate(sorted_nodes):
                print(node_data)
                # 将节点添加到当前组的节点列表中
                current_group_nodes.append(node_data)
        print("当前组的节点列表为：\n{}".format(current_group_nodes))
        print("***********************************************************")

        # 将当前组的节点列表添加到最终的节点列表中
        # 通过使用 copy.deepcopy，你创建了 current_group_nodes 列表的完全独立副本，确保对它的任何修改都不会影响已附加到 final_nodes_new 的列表。
        final_nodes_new.append(copy.deepcopy(current_group_nodes))  # 使用深拷贝来避免修改原始列表的问题

    # # 最终的节点列表包含了所有组的数据
    return final_nodes_new


def get_tree_order_new(grouped_data, nodes_centerx):
    final_nodes_new = []  # 用于存储最终的节点列表

    # 遍历每一个组内的所有节点
    for group, data in grouped_data.items():
        group_nodes = data['nodes']
        rank_to_nodes = {}

        # 将节点按照rank值分组
        for node_data in group_nodes:
            rank = node_data['rank']
            if rank not in rank_to_nodes:
                rank_to_nodes[rank] = []
            rank_to_nodes[rank].append(node_data)

        # 初始化序号为0
        order = 0

        current_group_nodes = []  # 用于存储当前组的所有节点

        # 遍历rank值分组
        for rank, nodes in sorted(rank_to_nodes.items()):
            # 对相同rank值的节点按照order进行排序
            sorted_nodes = sorted(nodes, key=lambda x: x['order'])

            # 初始化新的order为0
            new_order11 = 0

            new_order_relative_centerx = nodes_centerx

            num_nodes_with_same_rank = len(sorted_nodes)

            # 计算具有相同rank的节点的中心索引
            center_index = num_nodes_with_same_rank // 2

            # 确定节点数量是奇数还是偶数
            is_even = num_nodes_with_same_rank % 2 == 0

            # 计算每个节点的 new_order
            for i, node_data in enumerate(sorted_nodes):
                # 如果rank值唯一，将new_order赋值为nodes_centerx
                if num_nodes_with_same_rank == 1:
                    node_data['new_order'] = nodes_centerx
                else:
                    # 根据奇偶性计算 new_order_relative_centerx
                    if is_even:  # 偶数
                        if i < (center_index - 0.5):
                            node_data['new_order'] = nodes_centerx - ((center_index - 0.5) - i)
                        else:
                            node_data['new_order'] = nodes_centerx + (i - (center_index - 0.5))
                    else:  # 奇数
                        # node_data['new_order'] = nodes_centerx + ((i - center_index)  )
                        if i == center_index:
                            node_data['new_order'] = nodes_centerx
                        elif i < center_index:
                            node_data['new_order'] = nodes_centerx - (center_index - i)
                        else:
                            node_data['new_order'] = nodes_centerx + (i - center_index)
                # 如果rank值唯一，将new_order赋值为0
                # 否则按索引重新赋值
                # 此处的new_order11指的是同层级内的节点都是从0开始，而上述的new_order按照同层级的顺序，围绕共用点中心点两边分布
                node_data['new_order11'] = 0 if num_nodes_with_same_rank == 1 else new_order11
                new_order11 += 1

                # 插入新属性new_order到节点数据中的特定位置（例如，在 'order' 后面）
                # index_to_insert = 2  # 在 'order' 后面插入 'new_order'，可以根据需要进行调整
                # keys = list(node_data.keys())
                # keys.insert(index_to_insert, 'new_order')
                # values = list(node_data.values())
                # values.insert(index_to_insert, new_order)
                # node_data = dict(zip(keys, values))
                # 打印节点信息
                node = node_data['node']
                print(f'Node {node}: Rank: {rank}, New Order: {node_data["new_order"]}')

                # 将节点添加到当前组的节点列表中
                current_group_nodes.append(node_data)
        # print("当前组的节点列表为：\n{}".format(current_group_nodes))

        # 将当前组的节点列表添加到最终的节点列表中
        # 通过使用 copy.deepcopy，你创建了 current_group_nodes 列表的完全独立副本，确保对它的任何修改都不会影响已附加到 final_nodes_new 的列表。
        final_nodes_new.append(copy.deepcopy(current_group_nodes))  # 使用深拷贝来避免修改原始列表的问题
    #
    # # 最终的节点列表包含了所有组的数据
    return final_nodes_new
