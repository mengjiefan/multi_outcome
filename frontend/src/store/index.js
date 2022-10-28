//该文件用于创建Vuex中最为核心的store

//引入Vue
import Vue from 'vue'
//引入Vuex
import Vuex from 'vuex'
//使用Vuex插件
Vue.use(Vuex)

//准备actions--用于响应组件中的动作
const actions = {

}
//准备mutations--用于操作数据（state），记住这里写方法！
const mutations = {
    // GET_JSON_RESULT(state, value) {
    //     console.log("mutations中的GET_JSON_RESULT被调用了")
    //     // console.log(state)
    //     // console.log(value)
    //     state.multipleSearchValue = value
    //     // let selection = this.$refs.multipleTable.selection;
    //     // let selection = this.multipleTable;
    //     // console.log('选中的比较结局数据为：',selection);
    //     // state.multipleSearchValue.push(value) // 尾部添加数组元素
    //     // state.multipleSearchValue.unshift(value) // 头部添加数组元素
    //     // state.multipleSearchValue = state.multipleSearchValue.unshift(value)[0]
    //     // console.log(state.multipleSearchValue[0])
        

    //     // state.selection(value)
    //     // console.log('tableData')
    // }
    GET_JSON_RESULT(state, value) {
        console.log("mutations中的GET_JSON_RESULT被调用了")
        // console.log(state)
        // console.log(value)
        state.multipleSearchValue = value
        // state.nodesList = nodesList
        // state.linksList = linksList
    }
}
//准备state--数据仓库，存储公用数据的地方
const state = {
    // multipleSearchValue: []
    // multipleTable:[]
    // this.$refs.multipleTable.selection
    // tableData
    // selection:[]
    multipleSearchValue: { 
        "nodesList": [ { "id": "MMSE_base_byte", "type": 1 }, { "id": "hear", "type": 1 }, { "id": "physi_limit_base", "type": 1 }, { "id": "dependence_base", "type": 1 }, { "id": "frailty_base_tri", "type": 1 }, { "id": "education_tri", "type": 1 }, { "id": "MMSE_MCI_incid", "type": 0 }, { "id": "g15c1_CVD", "type": 1 }, { "id": "multimorbidity_base", "type": 1 }, { "id": "g15a1_HT", "type": 1 }, { "id": "eye_base", "type": 1 }, { "id": "g15b1_DM", "type": 1 }, { "id": "g15n1_RA", "type": 1 }, { "id": "multimorbidity_incid_byte", "type": 0 } ], 
        "linksList": [ { "source": "MMSE_base_byte", "target": "hear", "value": 0.436 }, { "source": "MMSE_base_byte", "target": "physi_limit_base", "value": 0.368 }, { "source": "MMSE_base_byte", "target": "dependence_base", "value": 0.268 }, { "source": "MMSE_base_byte", "target": "frailty_base_tri", "value": 0.402 }, { "source": "MMSE_base_byte", "target": "education_tri", "value": -0.27 }, { "source": "hear", "target": "physi_limit_base", "value": 0.318 }, { "source": "MMSE_MCI_incid", "target": "hear", "value": -0.096 }, { "source": "dependence_base", "target": "physi_limit_base", "value": 0.368 }, { "source": "physi_limit_base", "target": "frailty_base_tri", "value": 0.437 }, { "source": "education_tri", "target": "physi_limit_base", "value": -0.135 }, { "source": "dependence_base", "target": "frailty_base_tri", "value": 0.364 }, { "source": "dependence_base", "target": "education_tri", "value": -0.077 }, { "source": "MMSE_MCI_incid", "target": "dependence_base", "value": -0.081 }, { "source": "education_tri", "target": "frailty_base_tri", "value": -0.235 }, { "source": "multimorbidity_base", "target": "g15c1_CVD", "value": 0.421 }, { "source": "g15a1_HT", "target": "g15c1_CVD", "value": 0.206 }, { "source": "eye_base", "target": "g15c1_CVD", "value": 0.103 }, { "source": "g15b1_DM", "target": "g15c1_CVD", "value": 0.141 }, { "source": "g15n1_RA", "target": "g15c1_CVD", "value": 0.057 }, { "source": "g15c1_CVD", "target": "multimorbidity_incid_byte", "value": 0.322 }, { "source": "multimorbidity_base", "target": "eye_base", "value": 0.32 }, { "source": "multimorbidity_base", "target": "multimorbidity_incid_byte", "value": 0.716 }, { "source": "g15a1_HT", "target": "eye_base", "value": 0.045 }, { "source": "g15a1_HT", "target": "multimorbidity_incid_byte", "value": 0.271 }, { "source": "g15n1_RA", "target": "eye_base", "value": 0.108 }, { "source": "eye_base", "target": "multimorbidity_incid_byte", "value": 0.217 } ] },
    nodesList:[],
    linksList:[]
}
//准备getters--用于将state中的数据进行加工
const getters = {

}

//创建并暴露store
export default new Vuex.Store({
    actions,
    mutations,
    state,
    getters
})
