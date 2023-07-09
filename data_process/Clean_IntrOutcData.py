# 该文件用于清洗 'IntrOutcData_varName.csv'，包括：去掉重复的列，空值处理，值域映射
import pandas as pd

# 处理内容
"""
（1） 改列名：
    "f.eid"列名改为 "ID"； “Age at recruitment”改为 “Age”； “Current tobacco smoking”改为“Smoke”，“Alcohol drinker status”改为“Drink”
（2） 删掉列：
    删掉 Diagnoses - ICD10； Diagnoses - main ICD10， Year of birth，  Pack years adult smoking as proportion of life span exposed to smoking， Smoking status， Salad / raw vegetable intake， Dried fruit intake， Non-oily fish intake，
        Age when last ate meat， Never eat eggs, dairy, wheat, sugar， Never eat eggs, dairy, wheat, sugar (pilot)， Milk type used， Spread type， Non-butter spread type details， Spread type (pilot)，
        Bread intake， Bread type， Bread type/intake (pilot)， Cereal type， Coffee type， Hot drink temperature， Water intake， Major dietary changes in the last 5 years， Variation in diet， Variation in diet (pilot)，
        Alcohol intake frequency. Haematocrit percentage， High light scatter reticulocyte percentage， Mean corpuscular haemoglobin concentration， Platelet distribution width， Red blood cell (erythrocyte) distribution width， 
        Reticulocyte count， HLA imputation values
    填充率过低的删掉：
        Access to services score (Scotland)， Community safety score (Wales)， Physical environment score (Wales)， Diastolic blood pressure, manual reading， Pulse rate (during blood-pressure measurement)，  Systolic blood pressure, manual reading
        Rheumatoid factor 类风湿因子 （8582）-- 【IntrOutcData_varName_mannual.csv文件比其副本少 类风湿因子 这个变量】
    相近的删掉：
        Poultry intake， Beef intake，  Lamb/mutton intake， Pork intake， （只保留了Processed meat intake） 
        
上述（1）和 （2） 已经通过 'IntrOutcData_varName.csv' 文件手动完成

（3） 值域映射：
Sleeplessness / insomnia : Never/rarely-0, Prefer not to answer-0, Sometimes-1, Usually-2, 
Salt added to food : Never/rarely-0, Prefer not to answer-0, Sometimes-1, Usually-2, Always-3

Smoke : No-0, Only occasionally-1, Prefer not to answer-0, Yes, on most or all days-1, 

Drink : Never-0, Prefer not to answer-0, Current-1, Previous-1

Sex : Male-1  Female-2

Oily fish intake : Never-0, Do not know-0, Less than once a week-1, Once a week-2, Once or more daily-3, 2-4 times a week-4, 5-6 times a week-5, Prefer not to answer-0
Processed meat intake : Never-0, Do not know-0, Less than once a week-1, Once a week-2, Once or more daily-3, 2-4 times a week-4, 5-6 times a week-5, Prefer not to answer-0
Cheese intake: Never-0, Do not know-0, Less than once a week-1, Once a week-2, Once or more daily-3, 2-4 times a week-4, 5-6 times a week-5, Prefer not to answer-0

Illnesses of father: 
Illnesses of mother: Alzheimer's disease/dementia-1, Bowel cancer-2, Chronic bronchitis/emphysema-3, Diabetes-4, High blood pressure-5, Heart disease-6, Lung cancer-7, Parkinson's disease-8,
                        Prostate cancer-9, Stroke-10, Severe depression-11, Breast cancer-12, Prefer not to answer (group 1)-0,  Do not know (group 1)-0, None of the above (group 1)-0, 
Illnesses of siblings: 疾病列空值应该用0来填充


（4） 补全空值：
在数据分析中，根据不同的变量类型和数据特征，可以选择不同的方法来补全空值。
  1、数值型变量：
    1.1 均值/中位数/众数填充：对于连续型数值变量，可以使用均值、中位数或众数等统计量来填充空值。
    1.2 固定值填充：对于某些特定的数值型变量，可以使用固定的值来填充空值，例如填充为0或-1。
    1.3 插值方法：对于时间序列或具有趋势性的数值型变量，可以使用插值方法（如线性插值、样条插值等）来估计缺失值。
  2、类别型变量：
    2.1 众数填充：对于类别型变量，可以使用众数（出现频率最高的值）来填充空值。
    2.2 固定值填充：对于某些特定的类别型变量，可以使用固定的值（如'Unknown'）来填充空值。 
  3、文本型变量：
    3.1 固定值填充：对于文本型变量，可以使用固定的值（如'Unknown'）来填充空值。
    3.2 自然语言处理方法：对于一些特定的文本型变量，可以使用自然语言处理技术（如文本分类、文本生成）来推测缺失值。
  4、时间型变量：
    4.1 前向填充/后向填充：对于时间序列数据，可以使用前一个非空值或后一个非空值来填充空值。
    4.2 插值方法：对于具有趋势性的时间序列数据，可以使用插值方法（如线性插值、样条插值等）来估计缺失值。

我们的变量基本上就是数值型或者是类别型变量，故我们统一选择用【众数】来填充
疾病列空值应该用0来填充 
Oestradiol 雌二醇（12399）-- 【40岁以下女性：正常范围为 15-350 pg/mL。 40岁以上女性：正常范围为 10-60 pg/mL。】
Microalbumin in urine （35401）
"""

# 经过（1）和 （2） 对 IntrOutcData_varName.csv 进行手动处理过后得到 'IntrOutcData_varName_mannual.csv'（数据量为 98530 * 76） 文件：
# selected_variants = pd.read_csv('IntrOutcData_varName_mannual.csv')  # 98530 * 76
# （3） 值域映射：
# 读取原始CSV文件
df = pd.read_csv('IntrOutcData_varName_mannual.csv')
# 定义映射字典1
# Sleeplessness / insomnia : Never/rarely-0, Prefer not to answer-0, Sometimes-1, Usually-2,
# Salt added to food : Never/rarely-0, Prefer not to answer-0, Sometimes-1, Usually-2, Always-3
mapping_dict1 = {
    "Never/rarely": 0,
    "Prefer not to answer": 0,
    "Sometimes": 1,
    "Usually": 2,
    "Always": 3
}
# 映射变量 "Sleeplessness / insomnia" 的值
df["Sleeplessness / insomnia"] = df["Sleeplessness / insomnia"].map(mapping_dict1)
# 映射变量 "Salt added to food" 的值
df["Salt added to food"] = df["Salt added to food"].map(mapping_dict1)

# 定义映射字典2
# Oily fish intake : Never-0, Do not know-0, Less than once a week-1, Once a week-2, Once or more daily-3, 2-4 times a week-4, 5-6 times a week-5, Prefer not to answer-0
# Processed meat intake : Never-0, Do not know-0, Less than once a week-1, Once a week-2, Once or more daily-3, 2-4 times a week-4, 5-6 times a week-5, Prefer not to answer-0
# Cheese intake: Never-0, Do not know-0, Less than once a week-1, Once a week-2, Once or more daily-3, 2-4 times a week-4, 5-6 times a week-5, Prefer not to answer-0
mapping_dict2 = {
    "Never": 0,
    "Do not know": 0,
    "Prefer not to answer": 0,
    "Less than once a week": 1,
    "Once a week": 2,
    "Once or more daily": 3,
    "2-4 times a week": 4,
    "5-6 times a week": 5
}
# 映射变量 "Oily fish intake" 的值
df["Oily fish intake"] = df["Oily fish intake"].map(mapping_dict2)
# 映射变量 "Processed meat intake" 的值
df["Processed meat intake"] = df["Processed meat intake"].map(mapping_dict2)
# 映射变量 "Cheese intake" 的值
df["Cheese intake"] = df["Cheese intake"].map(mapping_dict2)

# 定义映射字典3
# Illnesses of father:
# Illnesses of mother: Alzheimer's disease/dementia-1, Bowel cancer-2, Chronic bronchitis/emphysema-3, Diabetes-4, High blood pressure-5, Heart disease-6, Lung cancer-7, Parkinson's disease-8,
#                         Prostate cancer-9, Stroke-10, Severe depression-11, Breast cancer-12, Prefer not to answer (group 1)-0,  Do not know (group 1)-0, None of the above (group 1)-0,
# Illnesses of siblings: 疾病列空值应该用0来填充
mapping_dict3 = {
    "None of the above (group 1)": 0,
    "Do not know (group 1)": 0,
    "Prefer not to answer (group 1)": 0,
    "Alzheimer's disease/dementia": 1,
    "Bowel cancer": 2,
    "Chronic bronchitis/emphysema": 3,
    "Diabetes": 4,
    "High blood pressure": 5,
    "Heart disease": 6,
    "Lung cancer": 7,
    "Parkinson's disease": 8,
    "Prostate cancer": 9,
    "Stroke": 10,
    "Severe depression": 11,
    "Breast cancer": 12
}
# 映射变量 "Illnesses of father" 的值
df["Illnesses of father"] = df["Illnesses of father"].map(mapping_dict3)
# 映射变量 "Illnesses of mother" 的值
df["Illnesses of mother"] = df["Illnesses of mother"].map(mapping_dict3)
# 映射变量 "Illnesses of siblings" 的值
df["Illnesses of siblings"] = df["Illnesses of siblings"].map(mapping_dict3)

# 定义映射字典4
# Smoke : No-0, Only occasionally-1, Prefer not to answer-0, Yes, on most or all days-1,
mapping_dict4 = {
    "No": 0,
    "Prefer not to answer": 0,
    "Only occasionally": 1,
    "Yes, on most or all days": 1,
}
# 映射变量 "Smoke" 的值
df["Smoke"] = df["Smoke"].map(mapping_dict4)

# 定义映射字典5
# Drink : Never-0, Prefer not to answer-0, Current-1, Previous-1
mapping_dict5 = {
    "Never": 0,
    "Prefer not to answer": 0,
    "Current": 1,
    "Previous": 1,
}
# 映射变量 "Drink" 的值
df["Drink"] = df["Drink"].map(mapping_dict5)

# 定义映射字典6
# Sex : Male-1  Female-2
mapping_dict6 = {
    "Male": 1,
    "Female": 2,
}
# 映射变量 "Sex" 的值
df["Sex"] = df["Sex"].map(mapping_dict6)

# 将结果保存到新的CSV文件
df.to_csv("mapped_data.csv", index=False)  # 98530 * 76
