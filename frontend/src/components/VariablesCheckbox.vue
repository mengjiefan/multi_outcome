<template>
    <div class = "VariablesCheckbox" >
        <h5>VariablesCheckbox</h5>
        <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">Select All</el-checkbox>
        <div style="margin: 15px 0;"></div>
        <el-checkbox-group v-model="checkedVariables" @change="handleCheckedVariablesChange">
            <el-checkbox v-for="Variable in Variables" :label="Variable" :key="Variable">{{Variable}}</el-checkbox>
        </el-checkbox-group>
    </div>
  
</template>
<script>
  const VariablesOptions = ['frailty_base_tri', 'age_group_decade', 'a1_sex', 'residenc_byte',"education_tri","smoke",
                            'drink','sleep','sport','hear','visual','g511_sbp','g521_dbp','g71_hr','BMI_cate',
                            'MMSE_base_byte','physi_limit_base','multimorbidity_base','b11_byte','b121_byte',
                            'income','f64_sum','a51_byte','f31_sum','f5_whocaresick','dependence_base',
                            'g15a1_HT','g15b1_DM','g15c1_CVD','g15e1_COPD','g15n1_RA','g15o1_dementia',
                            'g15k1_gastric','g15v1_hepatitis','eye_base','g15i1_cancer','g15l1_parkinson',
                            'g15j1_prostate','g15p1_mental','g15r1_others'
                          ];
  export default {
    name: "VariablesCheckbox",
    data() {
      return {
        checkAll: false,
        checkedVariables: ['frailty_base_tri', 'age_group_decade'],
        Variables: VariablesOptions,
        isIndeterminate: true
      };
    },
    methods: {
      handleCheckAllChange(val) {
        this.checkedVariables = val ? VariablesOptions : [];
        this.isIndeterminate = false;
      },
      handleCheckedVariablesChange(value) {
        let checkedCount = value.length;
        this.checkAll = checkedCount === this.Variables.length;
        this.isIndeterminate = checkedCount > 0 && checkedCount < this.Variables.length;
      }
    }
  };
</script>