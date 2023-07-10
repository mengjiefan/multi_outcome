import pandas as pd
import re

# 读取本地csv文件
file_path = "clhls_2008_2018_savTOcsv.csv"
all_2018Vis_data = pd.read_csv(file_path)  # 16954 * 4022  data = all_2018Vis_data
# 利用 .shape 方法获取数据的大小
# all_2018Vis_data_shape = all_2018Vis_data.shape
# num_rows, num_columns = all_2018Vis_data_shape
# print("Number of rows:", num_rows)  # 16954
# print("Number of columns:", num_columns)  # 4022

# 处理数据
# print(all_2018Vis_data.head())  # 打印前几行数据

# 保留'id'列
result = all_2018Vis_data[['id']]

# 使用正则表达式匹配以_18结尾的变量名，表明2018年仍然存活，并且再次接受调查的受访者变量
pattern = r'.*_18$'
# 选择满足正则表达式 且非 dth14_18 的列并将它们添加到结果中
matching_columns = [col for col in all_2018Vis_data.columns if col != 'dth14_18' and bool(re.match(pattern, col))]
# print(matching_columns)
# print(len(matching_columns))

selected_data = pd.concat([result, all_2018Vis_data[matching_columns]], axis=1)
# 检查matching_columns中的所有列是否为空
selected_data = selected_data.dropna(subset=matching_columns, how='all')  # 2454 * 755#
print(selected_data.head())
selected_data_shape = selected_data.shape
num_rows, num_columns = selected_data_shape
print("Number of rows:", num_rows)  # 16954经过移除matching_columns中所有变量均为空的数据行之后，数据量应在2440。目前所得数据行为2454
print("Number of columns:", num_columns)  # 756
# 保存为CSV文件
selected_data.to_csv("selected_horizonData_2018.csv", index=False)