# coding: utf-8
import pandas as pd
import numpy as np
from mixed_causal import mixed_causal, \
    prior_knowledge_encode, data_processing, evaluate
import easydict
import chardet

from const import DEFAULT_MODEL_PARA, DEFAULT_LGBM_PARA, DEFAULT_GAM_PARA

args = easydict.EasyDict({
    # 'data_file': 'causal_related_data.csv',  # location and name of data file
    'data_file': 'ukb_8_outcomes_data_nolab_his.csv',  # location and name of data file
    'ukb_index': [
        "Sex",
        "Insomnia",
        "Smoke",
        "Salt added to food",
        "Alcohol",
        "Illnesses of father",
        "Illnesses of mother",
        "Illnesses of siblings",
        "famHisHypertension",
        "famHisDiabetes",
        "famHisBreastMalignancy",
        "famHisProstateMalignancy",
        'Hypertension',
        'Diabetes',
        'BreastMalignancy',
        'ProstateMalignancy',
        'Hypothyroidism',
        'NutritionalAnaemias',
        'InfectiousGastroenteritis',
        'Septicemia',
    ],
    'cat_index': ['2', '3', '4', '7', '8', '10', '11', '13', '16', '17', '18', '19', '21', '22', '27', '33', '36',
                  '37'],  # 指定的索引是以字符串形式给出的，而不是整数形式
    # 'true_G':'alarm.csv',  # location and name of true graph
    'true_G': '',
    'model_para': {'step1_maxr': 1, 'step3_maxr': 3, 'num_f': 100,
                   'num_f2': 20, 'indep_pvalue': 0.05, 'downsampling': False,
                   'cv_split': 5, 'll_type': 'local', 'alpha': 0.0,
                   'maxNumParents': 10, 'score_type': 'bic'
                   },
    # can used for test step 2's performance with different setting. i.e.,
    # if you already have skeleton file 'alaram_simulate_skl.csv'
    # then you can use it to avoid run step 1 again
    'skl_file': './alram_simulate_skl.csv',
    # 'skl_file': '',
    'base_model': 'lgbm',  # 'lgbm' or 'gam'
    # 'base_model':'gam',
    'base_model_para': {},
    'source_nodes': [],
    'direct_edges': {},
    'not_direct_edges': {},
    'happen_before': {},
})


def check_model_para(model_para, base_model, base_model_para):
    model_para_out = {}
    for para in DEFAULT_MODEL_PARA:
        if para in model_para:
            model_para_out[para] = model_para[para]
        else:
            model_para_out[para] = DEFAULT_MODEL_PARA[para]
    base_model_para_out = {}
    base_model_para_out['base_model'] = base_model
    if base_model == 'lgbm':
        for para in DEFAULT_LGBM_PARA:
            if para in base_model_para:
                base_model_para_out[para] = base_model_para[para]
            else:
                base_model_para_out[para] = DEFAULT_LGBM_PARA[para]
    elif base_model == 'gam':
        for para in DEFAULT_GAM_PARA:
            if para in base_model_para:
                base_model_para_out[para] = base_model_para[para]
            else:
                base_model_para_out[para] = DEFAULT_GAM_PARA[para]
    else:
        raise NotImplementedError(
            f"currently we only support 'lgbm' and 'gam'.")
    return model_para_out, base_model_para_out


def runAAAI(target_variables):
    # 列出需要进行编码处理的变量列表
    args.cat_index = [col for col in args.ukb_index if col in target_variables]
    # # 读取数据文件，获取列的名称
    df = pd.read_csv(args.data_file)
    df = df.sample(n=3000, random_state=42)
    df = df[target_variables]

    print(df.columns)
    print(df.columns.values)
    model_para_out, base_model_para_out = check_model_para(
        args.model_para, args.base_model, args.base_model_para)

    # 将原始数据 df 传递给 data_processing 函数进行处理，对指定的列进行编码，并使用 'biweight' 方法对数据进行归一化。处理后的数据保存在 X_encode 变量中。
    # data_processing 是对数据进行处理的函数。通常，这个函数可能包含了一系列数据预处理的步骤，比如数据清洗、特征编码、特征选择等。
    # args.cat_index: 这个参数指定了需要进行编码的列的索引。这个索引列表表示了需要对 DataFrame 的哪些列进行编码。编码通常指的是将分类变量转换成数值变量，以便于机器学习算法的处理。
    # normalize='biweight': 这个参数是对数据进行归一化的方式，其中 'biweight' 是一种可能的归一化方法。归一化是指将数据缩放到一个特定的范围，以消除不同特征之间的量纲影响，使得模型训练更稳定。
    df, X_encode = data_processing(df, args.cat_index, normalize='biweight')
    prior_adj, prior_anc = prior_knowledge_encode(
        feature_names=df.columns, source_nodes=args.source_nodes,
        direct_edges=args.direct_edges, not_direct_edges=args.not_direct_edges)

    selMat = [0, 0, 1, 0, 0, 0,
              1, 0, 0, 1, 1, 1,
              1, 0, 0, 1, 0, 1,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0]
    selMat = np.array([True if element == 1 else False for element in selMat])
    selMat = selMat.reshape(len(df.columns), len(df.columns))

    selMat, dag2, dag, step1_time, step2_time, step3_time = mixed_causal(
        df, X_encode, model_para=model_para_out,
        prior_adj=prior_adj, prior_anc=prior_anc,
        base_model_para=base_model_para_out, selMat=selMat)
    print(dag)
    # np.savetxt(args.data_file[:-4]+'_skl.csv', selMat, delimiter=",")
    np.savetxt(args.data_file[:-4] + '_dag2.csv', dag2, delimiter=",")
    np.savetxt(args.data_file[:-4] + '_dag.csv', dag, delimiter=",")
    if args.true_G != '':
        trueG = pd.read_csv(args.true_G).values
        skl_result, dag2_result, dag_result = evaluate(trueG, selMat, dag2, dag)
        print(skl_result)
        print(dag2_result)
        print(dag_result)
        # print(trueG)
        # print(dag)


if __name__ == '__main__':
    target_variables = ["NutritionalAnaemias", "Age", "Alcohol", 'Sex', "Oily fish intake", "Health score"]
    runAAAI(target_variables)
