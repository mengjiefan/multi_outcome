export const defaultFactors = [
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
  "g511_sbp",
  "g512_sbp",
  "g521_dbp",
  "g522_dbp",
  "g71_hr",
  "g72_hr",
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
  "f5_whocaresick",
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
  "g15r1_others"
]
export const clhlsFactors = [
  "frailty_base_tri",
  "trueage",
  "a1_sex",
  "residenc_byte",
  "education_tri",
  "smoke",
  "drink",
  "sleep",
  "sport",
  "hear",
  "visual",
  "g511_sbp",
  "g512_sbp",
  "g521_dbp",
  "g522_dbp",
  "g71_hr",
  "g72_hr",
  "BMI_cate",
  "MMSE_base_byte",
  "physi_limit_base",
  "b11_byte",
  "b121_byte",
  "income",
  "f64_sum",
  "a51_byte",
  "f31_sum",
  "f5_whocaresick",
  "dependence_base"
]
export const ukbFactors= [
  "Age",
  "Sex",
  "BMI",
  "Crime score",
  "Education score",
  "Employment score",
  "Health score",
  "Housing score",
  "Income score",
  "Index of Multiple Deprivation",
  "Living environment score",
  "Sleep duration",
  "Insomnia",
  "Smoke",
  "Cooked vegetable intake",
  "Fresh fruit intake",
  "Oily fish intake",
  "Processed meat intake",
  "Cheese intake",
  "Cereal intake",
  "Salt added to food",
  "Tea intake",
  "Alcohol",
  "famHisHypertension",
  "famHisDiabetes",
  "famHisBreastMalignancy",
  "famHisProstateMalignancy"
]
export const defaultResults = [
  'death', 'follow_dura', 'multimorbidity_incid_byte', 'hospital_freq',
  'MMSE_MCI_incid', 'physi_limit_incid', 'dependence_incid', 'b11_incid', 'b121_incid'
];
export const clhlsResults = [
  'g15a1_HT', 'g15b1_DM', 'g15c1_CVD', 'g15e1_COPD', 'g15n1_RA', 'g15o1_dementia',
  'g15k1_gastric', 'eye_base', 'g15j1_prostate', 'multimorbidity_base'
];
export const ukbResults = [
  'Hypertension',
  'Diabetes',
  'BreastMalignancy',
  'ProstateMalignancy',
  'Hypothyroidism',
  'NutritionalAnaemias',
  'InfectiousGastroenteritis',
  'Septicemia',
]
export const default_index= [
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
export const ukb_index = [
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

export const clhls_index = [
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

export const getIndexOfDataset = async (dataset) => {
  try {
    let response = await axios({
      method: "GET",
      url: "http://localhost:8000/api/get_index",
      params: {
        dataset,
      },
    });
    return response.data.index;
  } catch (error) {
    console.log("请求失败了", error);
  }
};