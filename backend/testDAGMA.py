import torch
import numpy
from dagma import utils
from dagma.linear import DagmaLinear
from dagma.nonlinear import DagmaMLP, DagmaNonlinear
# Import pandas
import pandas as pd
import statsmodels.api as sm
import networkx as nx
from matplotlib import pyplot as plt
import math

# filename = "./clhls_10_outcomes_data.csv"
filename = "./ukb_8_outcomes_data_nolab_his.csv"

# reading csv file
# df = pd.read_csv("./clhls_10_outcomes_data.csv")
# df = df.replace({'yes': 1, 'no': 0})
# # Remove column name 'Unnamed: 0'
# df = df.drop(columns=df.columns[0],axis=1)
# print(df.head())
CovariantNum = 6
outcome = "Hypertension"
dataset = pd.read_csv(filename)
print(dataset.head())
# results = ['g15a1_HT', 'g15b1_DM', 'g15c1_CVD', 'g15e1_COPD',
#            'g15n1_RA', 'g15o1_dementia', 'g15k1_gastric', 'eye_base', 'g15j1_prostate', 'multimorbidity_base']
results = ['Hypertension', 'Diabetes', 'BreastMalignancy', 'ProstateMalignancy',
           'Hypothyroidism', 'NutritionalAnaemias', 'InfectiousGastroenteritis', 'Septicemia']

labels = list(dataset.columns.values)
num_results = len(results)
factors = list(set(labels) - set(results))
num_factors = len(factors)

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
# df.drop(columns=list(top_factors)[int(CovariantNum):], inplace=True)  # 此时顺序不太对

df = df[nodes_list_all]
# print(df)
# df.to_csv('causal_related_data_dagma.csv', index=False)  # 使用 index=False 参数，可以防止保存时生成额外的索引列。


# convert to nparray
arr = df.to_numpy()
arrFloat = arr.astype('float')

# treating as categorical-binary data
# model = DagmaLinear(loss_type='logistic') # create a linear model with least squares loss
model = DagmaLinear(loss_type='l2') # create a linear model with least squares loss
# W_est = model.fit(arr,lambda1=0.02) # fit the model with L1 reg. (coeff. 0.02)
W_est = model.fit(arrFloat,lambda1=0.02) # fit the model with L1 reg. (coeff. 0.02)
print(W_est)
graph = nx.DiGraph()
# iterating the columns
nodeNames = df.columns.to_numpy()
print(nodeNames)
for col in df.columns:
    print(col)
rows = int(W_est.size/nodeNames.size)
print(rows)
for r in range(rows):
    row = W_est[r]
    print(r)
    for c in range(row.size):
        val = W_est[r,c]
        if val != 0.0:
            edge = (nodeNames[r], nodeNames[c])
            print(f"Edge: {edge}, Weight: {val}")
            graph.add_edge(*edge, weight=val)

print(graph)
plt.tight_layout()
nx.draw_networkx(graph, arrows=True)
# plt.savefig("graph.png")
# plt.savefig("graph_l2.png")
plt.savefig("graph_l2_ukb.png")


# acc = utils.count_accuracy(B_true, W_est != 0) # compute metrics of estimated adjacency matrix W_est with ground-truth
# print(acc)