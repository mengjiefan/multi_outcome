"""
这个程序可以根据结局和不同因素线性回归的p值大小，筛选出
和结局相关性最大的N个因素变量，并输出为csv表格
"""

import statsmodels.api as sm
# from cdt import SETTINGS
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import sys
import io
from pickle import load
import matplotlib.image as mpimg
import matplotlib.pyplot as plt

from causallearn.score.LocalScoreFunction import local_score_BDeu
from causallearn.utils.GraphUtils import GraphUtils

from causallearn.search.ScoreBased.GES import ges
from causallearn.search.ConstraintBased.PC import pc
from causallearn.utils.cit import chisq, fisherz, gsq, kci, mv_fisherz

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

# print("当前为{}的结果".format(outcome))
df.drop(columns=list(top_factors)[int(CovariantNum):], inplace=True)
# df.to_csv(outcome + '.csv')
#
data = df.to_numpy()

# ges算法
Record = ges(data, 'local_score_BDeu', maxP=5)
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
print(Record['G'])
print(Record['update1'])
print(Record['update2'])
print(Record['G_step1'])
print(Record['G_step2'])
print(Record['score'])

# PC算法
# cg = pc(data, 0.05, fisherz, True, 0, 3)
# result_data = cg.G
# print(result_data)

# visualization using networkx
# Record.to_nx_graph()
# Record.draw_nx_graph(skel=False)
# plt.savefig(result + "111.png", format="PNG")