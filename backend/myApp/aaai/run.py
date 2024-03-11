# coding: utf-8
import pandas as pd
import numpy as np
from .mixed_causal import mixed_causal, \
    prior_knowledge_encode, data_processing, evaluate
import easydict
import chardet

from .const import DEFAULT_MODEL_PARA, DEFAULT_LGBM_PARA, DEFAULT_GAM_PARA

default_index= [
                 "frailty_base_tri",
                 "age_group_decade",
                 "a1_sex",
                 "residenc_byte",
                 "education_tri",
                 "smoke",
                 "drink",
                 "sleep",
                 "sport",
                 "hear",
                 "visual",
                 "BMI_cate",
                 "MMSE_base_byte",
                 "physi_limit_base",
                 "multimorbidity_base",
                 "b11_byte",
                 "b121_byte",
                 "income",
                 "f64_sum",
                 "a51_byte",
                 "f31_sum",
                 "dependence_base",
                 "g15a1_HT",
                 "g15b1_DM",
                 "g15c1_CVD",
                 "g15e1_COPD",
                 "g15n1_RA",
                 "g15o1_dementia",
                 "g15k1_gastric",
                 "g15v1_hepatitis",
                 "eye_base",
                 "g15i1_cancer",
                 "g15l1_parkinson",
                 "g15j1_prostate",
                 "g15p1_mental",
                 "g15r1_others",
                 'death',  'multimorbidity_incid_byte', 'hospital_freq',
                 'MMSE_MCI_incid', 'physi_limit_incid', 'dependence_incid', 'b11_incid', 'b121_incid'
                 ]
ukb_index = [
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
    ]

clhls_index = [
    "frailty_base_tri",
    "a1_sex",
    "residenc_byte",
    "education_tri",
    "smoke",
    "drink",
    "sleep",
    "sport",
    "hear",
    "visual",
    "BMI_cate",
    "MMSE_base_byte",
    "physi_limit_base",
    "b11_byte",
    "b121_byte",
    "income",
    "f64_sum",
    "a51_byte",
    "dependence_base",
    'g15a1_HT', 'g15b1_DM', 'g15c1_CVD', 'g15e1_COPD', 'g15n1_RA', 'g15o1_dementia',
    'g15k1_gastric', 'eye_base', 'g15j1_prostate', 'multimorbidity_base'
]
ukb_file = "./myApp/ukb_8_outcomes_data_nolab_his.csv"
clhls_file = "./myApp/clhls_10_outcomes_data.csv"

args = easydict.EasyDict({
    # 'data_file': 'causal_related_data.csv',  # location and name of data file
    'data_file': '',  # location and name of data file
    'cat_index': [],  # 指定的索引是以字符串形式给出的，而不是整数形式
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


def runAAAI(dataset, target_variables, selMat):
    data_file = "./myApp/MissingValue_fill_data_all.csv"
    if dataset == 'ukb':
        data_file = ukb_file
    elif dataset == 'clhls':
        data_file = clhls_file

    df = pd.read_csv(data_file)
    df = df.sample(n=3000, random_state=42)
    df = df[target_variables]
    index = default_index
    if dataset == 'ukb':
        index = ukb_index
    elif dataset == 'clhls':
        index = clhls_index
    args.cat_index = [col for col in index if col in target_variables]

    model_para_out, base_model_para_out = check_model_para(
        args.model_para, args.base_model, args.base_model_para)
    df, X_encode = data_processing(df, args.cat_index, normalize='biweight')
    prior_adj, prior_anc = prior_knowledge_encode(
        feature_names=df.columns, source_nodes=args.source_nodes,
        direct_edges=args.direct_edges, not_direct_edges=args.not_direct_edges)

    selMat, dag2, dag, step1_time, step2_time, step3_time = mixed_causal(
        df, X_encode, model_para=model_para_out,
        prior_adj=prior_adj, prior_anc=prior_anc,
        base_model_para=base_model_para_out, selMat=None)#之前使用PC算出来的骨架，现在重新计算
    return dag2

