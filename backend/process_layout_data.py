import numpy as np
import networkx as nx
import copy
from scipy.spatial import distance

# 原始数据
nodes = [
 {'node': 'Hypertension','rank': 3, 'order': 2, 'fixed': False, 'group': [0], 'outcome': True},
 {'node': 'famHisHypertension','rank': 1, 'order': 0, 'fixed': False, 'group': [0], 'outcome': False},
 {'node': 'Smoke','rank': 2, 'order': 1, 'fixed': False, 'group': [0], 'outcome': False},
 {'node': 'Sex','rank': 0, 'order': 5, 'fixed': True, 'group': [0, 1, 2, 3], 'outcome': False},
 {'node': 'Income score','rank': 1, 'order': 4, 'fixed': True, 'group': [0, 1], 'outcome': False},
 {'node': 'Index of Multiple Deprivation','rank': 1, 'order': 3, 'fixed': True, 'group': [0, 1], 'outcome': False},
 {'node': 'Diabetes','rank': 3, 'order': 6, 'fixed': False, 'group': [1], 'outcome': True},
 {'node': 'BMI','rank': 2, 'order': 7, 'fixed': True, 'group': [1, 2], 'outcome': False},
 {'node': 'famHisDiabetes','rank': 1, 'order': 8, 'fixed': False, 'group': [1], 'outcome': False},
 {'node': 'BreastMalignancy','rank': 3, 'order': 9, 'fixed': False, 'group': [2], 'outcome': True},
 {'node': 'famHisBreastMalignancy','rank': 2, 'order': 10, 'fixed': False, 'group': [2], 'outcome': False},
 {'node': 'Education score','rank': 0, 'order': 11, 'fixed': False, 'group': [2], 'outcome': False},
 {'node': 'Processed meat intake','rank': 1, 'order': 12, 'fixed': True, 'group': [2, 3], 'outcome': False},
 {'node': 'ProstateMalignancy','rank': 3, 'order': 13, 'fixed': False, 'group': [3], 'outcome': True},
 {'node': 'Age','rank': 1, 'order': 14, 'fixed': False, 'group': [3], 'outcome': False},
 {'node': 'famHisProstateMalignancy','rank': 1, 'order': 16, 'fixed': False, 'group': [3], 'outcome': False},
 {'node': 'Health score','rank': 2, 'order': 15, 'fixed': False, 'group': [3], 'outcome': False}
]

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
    min_order = fixed_nodes[0]['order']
    max_order = fixed_nodes[0]['order']

    # 遍历固定节点列表以找到固定节点的最小和最大的原始"order"值（此处的原始order是针对的所有层级内的节点的水平的排序顺序）
    for node in fixed_nodes:
        current_order = node['order']
        if current_order < min_order:
            min_order = current_order   # 通过遍历得到最小order值
        if current_order > max_order:
            max_order = current_order   # 通过遍历得到最大order值

    return max_order, min_order

def get_grouped_data(nodes,edges):
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

def get_each_dag_nodes_order_new(grouped_data, nodes_centerx):
    final_nodes_new = []  # 用于存储最终的节点列表

    # 遍历每一个组内的所有节点
    for group, data in grouped_data.items():
        group_nodes_ori = data['nodes']  # 获取该组的节点列表
        group_nodes = data['nodes']  # 获取该组的节点列表，用于后续操作获取新的节点order
        group_edges = data['edges']

        # print(f'Nodes in Group {group}:')

        # 创建一个字典来存储每个rank值对应的节点列表
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
            # print(sorted_nodes)

            # 初始化新的order为0
            new_order = 0
            # 初始化新的order为nodes_centerx
            new_order_relative_centerx = nodes_centerx

            # 计算具有相同rank的节点数量
            num_nodes_with_same_rank = len(sorted_nodes)

            # 计算具有相同rank的节点的中心索引
            center_index = num_nodes_with_same_rank // 2

            # 确定节点数量是奇数还是偶数
            is_even = num_nodes_with_same_rank % 2 == 0

            # 计算每个节点的 new_order_relative_centerx
            for i, node_data in enumerate(sorted_nodes):
                # 如果rank值唯一，将new_order_relative_centerx赋值为nodes_centerx
                if num_nodes_with_same_rank == 1:
                    node_data['new_order_relative_centerx'] = nodes_centerx
                else:
                    # 根据奇偶性计算 new_order_relative_centerx
                    if is_even:  #偶数
                        if i < (center_index - 0.5):
                            node_data['new_order_relative_centerx'] = nodes_centerx - ((center_index - 0.5) - i)
                        else:
                            node_data['new_order_relative_centerx'] = nodes_centerx + (i - (center_index - 0.5))
                    else:  #奇数
                        # node_data['new_order_relative_centerx'] = nodes_centerx + ((i - center_index)  )
                        if i == center_index:
                            node_data['new_order_relative_centerx'] = nodes_centerx
                        elif i < center_index:
                            node_data['new_order_relative_centerx'] = nodes_centerx - (center_index - i)
                        else:
                            node_data['new_order_relative_centerx'] = nodes_centerx + (i - center_index)
                # 如果rank值唯一，将new_order赋值为0
                # 否则按索引重新赋值
                node_data['new_order'] = 0 if num_nodes_with_same_rank == 1 else new_order
                new_order += 1

                # 插入新属性new_order到节点数据中的特定位置（例如，在 'order' 后面）
                index_to_insert = 3  # 在 'order' 后面插入 'new_order'，可以根据需要进行调整
                keys = list(node_data.keys())
                keys.insert(index_to_insert, 'new_order')
                values = list(node_data.values())
                values.insert(index_to_insert, new_order)
                node_data = dict(zip(keys, values))

                # 插入新属性new_order_relative_centerx到节点数据中的特定位置（例如，在 'rank' 后面）
                index_to_insert = 2  # 在 'rank' 后面插入 'new_order_relative_centerx'，可以根据需要进行调整
                keys = list(node_data.keys())
                keys.insert(index_to_insert, 'new_order_relative_centerx')
                values = list(node_data.values())
                values.insert(index_to_insert, new_order_relative_centerx)
                node_data = dict(zip(keys, values))

                # 打印节点信息
                node = node_data['node']
                print(f'节点 {node}: Rank: {rank}, 新的顺序: {node_data["new_order"]}, 相对于中心的新顺序: {node_data["new_order_relative_centerx"]}')

                # 将节点添加到当前组的节点列表中
                current_group_nodes.append(node_data)

        # print("当前组的节点列表为：\n{}".format(current_group_nodes))

        # 将当前组的节点列表添加到最终的节点列表中
        # 通过使用 copy.deepcopy，你创建了 current_group_nodes 列表的完全独立副本，确保对它的任何修改都不会影响已附加到 final_nodes_new 的列表。
        final_nodes_new.append(copy.deepcopy(current_group_nodes))  # 使用深拷贝来避免修改原始列表的问题

    # # 最终的节点列表包含了所有组的数据
    return final_nodes_new

# def cal_node_move_distance(nodes):



# 调用 get_fixedNodes(nodes)函数，获取超图的固定节点
fixed_nodes_supergraph = get_fixedNodes(nodes)
print(fixed_nodes_supergraph)

# 调用 get_fixedNodes_order(fixed_nodes)函数，获取超图的原始order（此处的原始order是针对的所有层级内的节点的水平的排序顺序）
# 调用函数并获取返回值
max_order_ori_supergraph_fixedNodes, min_order_ori_supergraph_fixedNodes = get_fixedNodes_order(fixed_nodes_supergraph)
# 执行数值运算，计算最大和最小order值的差,即原固定节点水平跨度的距离fixed_order_ori_diff_supergraph
fixed_order_ori_diff_supergraph = max_order_ori_supergraph_fixedNodes - min_order_ori_supergraph_fixedNodes
# 执行数值运算，计算最大和最小order值的和的一半,即原固定节点水平方向上的中心值
fixed_order_ori_center_supergraph = (max_order_ori_supergraph_fixedNodes + min_order_ori_supergraph_fixedNodes)/2

print(fixed_order_ori_diff_supergraph, fixed_order_ori_center_supergraph)

# 调用get_grouped_data(nodes,edges)函数，获取按组区分的超图的所有包含node和edge列表的dag，其中的order为原始的
grouped_data_supergraph = get_grouped_data(nodes,edges)  # 为按组区分的dag，每个dag内均有其原先的node和edge列表
print(grouped_data_supergraph)

print("----------------------------------------")

# 生成按组区分的所有节点（即每个dag图--后续可考虑用outcome名称来命名组）的更新之后的节点列表，，其中的order为新更新的
all_groups_nodes_new = get_each_dag_nodes_order_new(grouped_data_supergraph, fixed_order_ori_center_supergraph)  # 为按组区分的dag，每个dag内均有新生成的的nodes列表
print(all_groups_nodes_new)
