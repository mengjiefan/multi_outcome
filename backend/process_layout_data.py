import numpy as np
import networkx as nx
import copy
from scipy.spatial import distance

# 原始数据
# nodes = [
#  {'node': 'Hypertension','rank': 3, 'order': 2, 'fixed': False, 'group': [0], 'outcome': True},
#  {'node': 'famHisHypertension','rank': 1, 'order': 0, 'fixed': False, 'group': [0], 'outcome': False},
#  {'node': 'Smoke','rank': 2, 'order': 1, 'fixed': False, 'group': [0], 'outcome': False},
#  {'node': 'Sex','rank': 0, 'order': 5, 'fixed': True, 'group': [0, 1, 2, 3], 'outcome': False},
#  {'node': 'Income score','rank': 1, 'order': 4, 'fixed': True, 'group': [0, 1], 'outcome': False},
#  {'node': 'Index of Multiple Deprivation','rank': 1, 'order': 3, 'fixed': True, 'group': [0, 1], 'outcome': False},
#  {'node': 'Diabetes','rank': 3, 'order': 6, 'fixed': False, 'group': [1], 'outcome': True},
#  {'node': 'BMI','rank': 2, 'order': 7, 'fixed': True, 'group': [1, 2], 'outcome': False},
#  {'node': 'famHisDiabetes','rank': 1, 'order': 8, 'fixed': False, 'group': [1], 'outcome': False},
#  {'node': 'BreastMalignancy','rank': 3, 'order': 9, 'fixed': False, 'group': [2], 'outcome': True},
#  {'node': 'famHisBreastMalignancy','rank': 2, 'order': 10, 'fixed': False, 'group': [2], 'outcome': False},
#  {'node': 'Education score','rank': 0, 'order': 11, 'fixed': False, 'group': [2], 'outcome': False},
#  {'node': 'Processed meat intake','rank': 1, 'order': 12, 'fixed': True, 'group': [2, 3], 'outcome': False},
#  {'node': 'ProstateMalignancy','rank': 3, 'order': 13, 'fixed': False, 'group': [3], 'outcome': True},
#  {'node': 'Age','rank': 1, 'order': 14, 'fixed': False, 'group': [3], 'outcome': False},
#  {'node': 'famHisProstateMalignancy','rank': 1, 'order': 16, 'fixed': False, 'group': [3], 'outcome': False},
#  {'node': 'Health score','rank': 2, 'order': 15, 'fixed': False, 'group': [3], 'outcome': False}
# ]

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

nodes = [
    {'node': 'Hypertension', 'rank': 1, 'order': 2, 'fixed': False, 'group': [0], 'outcome': True},
    {'node': 'famHisHypertension', 'rank': 0, 'order': 0, 'fixed': False, 'group': [0], 'outcome': False},
    {'node': 'Smoke', 'rank': 2, 'order': 1, 'fixed': False, 'group': [0], 'outcome': False},
    {'node': 'Sex', 'rank': 0, 'order': 4, 'fixed': True, 'group': [0, 1, 2, 3], 'outcome': False},
    {'node': 'Income score', 'rank': 0, 'order': 3, 'fixed': True, 'group': [0, 1], 'outcome': False},
    {'node': 'Index of Multiple Deprivation', 'rank': 1, 'order': 4, 'fixed': True, 'group': [0, 1], 'outcome': False},
    {'node': 'Diabetes', 'rank': 3, 'order': 5, 'fixed': False, 'group': [1], 'outcome': True},
    {'node': 'BMI', 'rank': 2, 'order': 7, 'fixed': True, 'group': [1, 2], 'outcome': False},
    {'node': 'famHisDiabetes', 'rank': 1, 'order': 6, 'fixed': False, 'group': [1], 'outcome': False},
    {'node': 'BreastMalignancy', 'rank': 3, 'order': 9, 'fixed': False, 'group': [2], 'outcome': True},
    {'node': 'famHisBreastMalignancy', 'rank': 2, 'order': 8, 'fixed': False, 'group': [2], 'outcome': False},
    {'node': 'Education score', 'rank': 0, 'order': 10, 'fixed': False, 'group': [2], 'outcome': False},
    {'node': 'Processed meat intake', 'rank': 1, 'order': 11, 'fixed': True, 'group': [2, 3], 'outcome': False},
    {'node': 'ProstateMalignancy', 'rank': 3, 'order': 12, 'fixed': False, 'group': [3], 'outcome': True},
    {'node': 'Age', 'rank': 1, 'order': 13, 'fixed': False, 'group': [3], 'outcome': False},
    {'node': 'famHisProstateMalignancy', 'rank': 1, 'order': 15, 'fixed': False, 'group': [3], 'outcome': False},
    {'node': 'Health score', 'rank': 2, 'order': 14, 'fixed': False, 'group': [3], 'outcome': False}
]



def get_fixedNodes(nodes):
    # 根据fixed属性获取超图得到的固定节点
    fixed_nodes = []
    for node in nodes:
        if node['fixed'] == True:
            fixed_nodes.append(node)
    return fixed_nodes

def get_nonFixedNodes(nodes):
    # 根据fixed属性获取非固定节点
    non_fixed_nodes = []
    for node in nodes:
        if node['fixed'] == False:
            non_fixed_nodes.append(node)
    return non_fixed_nodes

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

def get_each_dag_nodes_order_new(grouped_data, nodes_centerx, fixed_nodes_supergraph):
    final_nodes_new = []  # 用于存储最终的节点列表

    # 遍历每一个组内的所有节点
    for group, data in grouped_data.items():
        # 1 压缩超图的共用节点
        # 1.1 超图的共用节点排序
        # 对子图内所有节点按'order'值从小到大排序，用于保持相对位置并压缩子图
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
            # 保持固定节点的相对位置不变的同时，压缩后锚定固定节点
            node['order_fixed_relative_compact'] = node['order_sup_fixed_nodes_rela'] - center_sup_fixed + nodes_centerx
        print(fixed_nodes_supergraph)

        group_nodes_ori = data['nodes']  # 获取该组的节点列表
        group_nodes = data['nodes']  # 获取该组的节点列表，用于后续操作获取新的节点order
        group_edges = data['edges']

        print(f'Nodes in Group {group}: {group_nodes}')
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
        # # 打印排序后的节点列表
        # for node in sorted_all_nodes_subgraph:
        #     print(node)

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
            center_current_rela = (max_order_current_rela + min_order_current_rela)/2
        print("当前组节点的相对水平中心点为：\n{}".format(center_current_rela))
        for node in sorted_all_nodes_subgraph:
            # 方法三：获取了每个子图中所有节点的水平相对顺序 order_relative_sub_all_nodes 之后，保持相对顺序不变的情况下，计算所有节点相对于超图中心点的顺序 order_relative_sub_centerx_tran_sup_fixed_center
            node['order_relative_sub_centerx_tran_sup_fixed_center'] = node['order_relative_sub_all_nodes'] - center_current_rela + nodes_centerx
            node['distance'] = node['order_relative_sub_centerx_tran_sup_fixed_center'] - node['order']
        print(sorted_all_nodes_subgraph)


        # 调用函数并获取返回值
        current_group_fixed_nodes = get_fixedNodes(group_nodes)
        print('current_group_fixed_nodes:\n{}'.format(current_group_fixed_nodes))
        current_group_non_fixed_nodes = get_nonFixedNodes(group_nodes)
        max_order_current_group_fixed_nodes, min_order_current_group_fixed_nodes = get_fixedNodes_order(current_group_fixed_nodes)
        # 执行数值运算，计算最大和最小order值的差,即原固定节点水平跨度的距离fixed_order_ori_diff_supergraph
        fixed_order_ori_diff_current_group = max_order_current_group_fixed_nodes - min_order_current_group_fixed_nodes
        # 执行数值运算，计算最大和最小order值的和的一半,即原固定节点水平方向上的中心值
        fixed_order_ori_center_current_group = (max_order_current_group_fixed_nodes + min_order_current_group_fixed_nodes) / 2
        # print(fixed_order_ori_diff_current_group, fixed_order_ori_center_current_group)
        print("当前组的固定节点的水平中心点为：\n{}".format(fixed_order_ori_center_current_group))

        # 获取当前组固定节点order_relative_sub_all_nodes值的最小和最大值
        # 初始化最小和最大值为第一个节点的"order"值
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
            # 方法五：获取了每个子图中所有节点的水平相对顺序 order_relative_sub_all_nodes 之后，保持所有节点水平方向相对顺序不变且固定节点紧致之后再锚定的条件下，计算所有节点相对于超图中心点的顺序 order_fixed_relative_optimal
            if node['fixed'] == True:
                # print(node['node'])
                # print(f"固定节点：{node['node']}")
                node['order_fixed_relative_optimal'] = node['order_fixed_relative_compact']
            else:
                if node['order_relative_sub_all_nodes'] <= min_order_current_fixed:
                    node['order_fixed_relative_optimal'] = min_order_current_fixed_optimal + node['order_relative_sub_all_nodes'] - min_order_current_fixed
                if node['order_relative_sub_all_nodes'] >= max_order_current_fixed:
                    node['order_fixed_relative_optimal'] = max_order_current_fixed_optimal + node['order_relative_sub_all_nodes'] - max_order_current_fixed
                else:
                    # node['order_fixed_relative_optimal'] = nodes_centerx
                    # 生成间隔为1的区间列表
                    # 从current_group_fixed_nodes列表中提取'order_relative_sub_all_nodes'的值
                    order_relative_sub_all_nodes_values = [item['order_relative_sub_all_nodes'] for item in current_group_fixed_nodes]

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
                                    print(f"找到匹配的节点：{node['node']}，order_fixed_rela_start值为 {order_fixed_rela_start}")
                                    # 计算逻辑：起点的值加上倍数个间隔
                                    node['order_fixed_relative_optimal'] = order_fixed_rela_start + (node['order_relative_sub_all_nodes'] - interval[0])/(interval[1] - interval[0])
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

        # 遍历节点, 计算每个节点的 order_relative_sub_centerx
        for node_data in group_nodes:
            if node_data['fixed'] == True:
                # node_data['order_relative_sub_centerx'] = fixed_order_ori_center_current_group
                node_data['order_relative_sub_centerx'] = node_data['order']
            else:
                # node_data['order_relative_sub_centerx'] = fixed_order_ori_center_current_group
                # 遍历非固定节点的rank值分组
                for rank, nodes in sorted(rank_to_non_fixed_nodes.items()):
                    # 对相同rank值的节点按照order进行排序
                    sorted_non_fixed_nodes = sorted(nodes, key=lambda x: x['order'])

                    # 初始化新的 order_relative_sub_centerx 为 fixed_order_ori_center_current_group
                    order_relative_sub_centerx = fixed_order_ori_center_current_group

                    # 计算具有相同rank的非固定节点数量
                    num_non_fixed_nodes_with_same_rank = len(sorted_non_fixed_nodes)

                    # 计算具有相同rank的非固定节点的中心索引
                    center_index_non_fixed = num_non_fixed_nodes_with_same_rank // 2

                    # 确定节点数量是奇数还是偶数
                    is_even_non_fixed = num_non_fixed_nodes_with_same_rank % 2 == 0

                    # 方法四：计算每个节点的 order_relative_sub_centerx
                    for i, node_data in enumerate(sorted_non_fixed_nodes):
                        # 如果rank值唯一，将order_relative_sub_centerx赋值为nodes_centerx
                        if num_non_fixed_nodes_with_same_rank == 1:
                            node_data['order_relative_sub_centerx'] = fixed_order_ori_center_current_group
                        else:
                            # 根据奇偶性计算 order_relative_sub_centerx
                            if is_even_non_fixed:  # 偶数
                                if i < (center_index_non_fixed - 0.5):
                                    node_data['order_relative_sub_centerx'] = fixed_order_ori_center_current_group - ((center_index_non_fixed - 0.5) - i)
                                else:
                                    node_data['order_relative_sub_centerx'] = fixed_order_ori_center_current_group + (i - (center_index_non_fixed - 0.5))
                            else:  # 奇数
                                # node_data['order_relative_sub_centerx'] = fixed_order_ori_center_current_group + ((i - center_index_non_fixed)  )
                                if i == center_index_non_fixed:
                                    node_data['order_relative_sub_centerx'] = fixed_order_ori_center_current_group
                                elif i < center_index_non_fixed:
                                    node_data['order_relative_sub_centerx'] = fixed_order_ori_center_current_group - (center_index_non_fixed - i)
                                else:
                                    node_data['order_relative_sub_centerx'] = fixed_order_ori_center_current_group + (i - center_index_non_fixed)

        # 遍历rank值分组
        for rank, nodes in sorted(rank_to_nodes.items()):
            # 对相同rank值的节点按照order进行排序
            sorted_nodes = sorted(nodes, key=lambda x: x['order'])
            # print(sorted_nodes)

            # 初始化新的order为0
            new_order = 0
            # # 初始化新的 new_order_relative_centerx 为nodes_centerx
            # new_order_relative_centerx = nodes_centerx

            # 计算具有相同rank的节点数量
            num_nodes_with_same_rank = len(sorted_nodes)

            # 计算具有相同rank的节点的中心索引
            center_index = num_nodes_with_same_rank // 2

            # 确定节点数量是奇数还是偶数
            is_even = num_nodes_with_same_rank % 2 == 0


            # 方法二：计算每个节点的 new_order_relative_centerx
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


                # 打印节点信息
                node = node_data['node']
                print(f'节点 {node}: Rank: {rank}, 子图内所有节点的横向相对顺序（保持各节点在子图中相对于超图的相对位置，紧致；同时向超图的固定节点中心点平移；用于tighten graph）: {node_data["order_relative_sub_centerx_tran_sup_fixed_center"]},子图内同层级的顺序: {node_data["new_order"]}, 相对于超图固定节点中心的新顺序（用于tree graph）: {node_data["new_order_relative_centerx"]}, 相对于子图固定节点中心的新顺序（共用点固定order，非共用点向子图中心移动，用于新 graph）: {node_data["order_relative_sub_centerx"]}, 固定节点锚点并保持水平相对顺序的新顺序（共用点先压缩再固定order，非共用点保持相对顺序-出现了小数，用于新 graph）: {node_data["order_fixed_relative_optimal"]}')

                # 将节点添加到当前组的节点列表中
                current_group_nodes.append(node_data)

        print("当前组的节点列表为：\n{}".format(current_group_nodes))
        print("***********************************************************")

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
all_groups_nodes_new = get_each_dag_nodes_order_new(grouped_data_supergraph, fixed_order_ori_center_supergraph, fixed_nodes_supergraph)  # 为按组区分的dag，每个dag内均有新生成的的nodes列表
print(all_groups_nodes_new)
