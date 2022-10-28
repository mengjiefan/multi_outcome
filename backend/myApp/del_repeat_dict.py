from functools import reduce


# # 定义一个去列表(列表元素是字典)重复的函数
# def list_dict_duplicate_removal(data_list1, data_list2):
#     # newList=[]
#     data_list = data_list1 + data_list2
#     # data_list = [{"a": "123", "b": "321"}, {"a": "123", "b": "321"}, {"b": "321", "a": "123"}]
#     run_function = lambda x, y: x if y in x else x + [y]
#     return reduce(run_function, [[], ] + data_list)
#
#
# if __name__ == '__main__':
#     # print(list_dict_duplicate_removal())
#     data_list1 = [{"id": "frailty_base_tri", "group": 1},
#                   {"id": "MMSE_base_byte", "group": 1},
#                   {"id": "hear", "group": 1},
#                   {"id": "physi_limit_base", "group": 1},
#                   {"id": "education_tri", "group": 1},
#                   {"id": "death", "group": 0}
#                   ]
#     data_list2 = [
#         {"id": "MMSE_base_byte", "group": 1},
#         {"id": "hear", "group": 1},
#         {"id": "physi_limit_base", "group": 1},
#         {"id": "dependence_base", "group": 1},
#         {"id": "frailty_base_tri", "group": 1},
#         {"id": "MMSE_MCI_incid", "group": 0}
#     ]
#
#     print(data_list1 + data_list2)
#     print(list_dict_duplicate_removal(data_list1, data_list2))


def list_dict_duplicate_removal(selection):
    # selection = request.GET.get("selection")  # 前端勾选的数据selection
    # return selection
    # print(len(selection))
    # print(selection)
    # newList=[]

    nodesList = []
    linksList = []
    for i in range(len(selection)):
        nodesList += selection[i].get("nodes")
        linksList += selection[i].get("links")
    # data_list = [{"a": "123", "b": "321"}, {"a": "123", "b": "321"}, {"b": "321", "a": "123"}]
    run_function = lambda x, y: x if y in x else x + [y]
    # return reduce(run_function, [[], ] + nodesList), reduce(run_function, [[], ] + linksList)
    nodesList = reduce(run_function, [[], ] + nodesList)
    linksList = reduce(run_function, [[], ] + linksList)
    print(nodesList)
    print(linksList)
    # return reduce(run_function, [[], ] + linksList)

if __name__ == '__main__':
    selection = [
        {
         "top_factors_list": [ "b11_byte", "frailty_base_tri", "MMSE_base_byte", "hear", "physi_limit_base" ],
         "outcome": "b11_incid",
         "CovariantNum": "5",
         "nodes_list_all": [ "b11_byte", "frailty_base_tri", "MMSE_base_byte", "hear", "physi_limit_base", "b11_incid" ],
         "nodes": [ { "id": "b11_byte", "type": 1 }, { "id": "frailty_base_tri", "type": 1 }, { "id": "MMSE_base_byte", "type": 1 }, { "id": "hear", "type": 1 }, { "id": "physi_limit_base", "type": 1 }, { "id": "b11_incid", "type": 0 } ],
         "links": [ { "source": "b11_byte", "target": "frailty_base_tri", "value": 0.097 }, { "source": "b11_byte", "target": "MMSE_base_byte", "value": 0.036 }, { "source": "hear", "target": "b11_byte", "value": 0.027 }, { "source": "physi_limit_base", "target": "b11_byte", "value": -0.006 }, { "source": "hear", "target": "frailty_base_tri", "value": 0.341 }, { "source": "b11_incid", "target": "frailty_base_tri", "value": -0.123 }, { "source": "hear", "target": "MMSE_base_byte", "value": 0.436 }, { "source": "b11_incid", "target": "MMSE_base_byte", "value": -0.098 }, { "source": "hear", "target": "b11_incid", "value": -0.089 }, { "source": "physi_limit_base", "target": "b11_incid", "value": -0.083 } ]
         },

         {
         "top_factors_list": [ "physi_limit_base", "frailty_base_tri", "dependence_base", "MMSE_base_byte", "hear" ],
         "outcome": "physi_limit_incid",
         "CovariantNum": "5",
         "nodes_list_all": [ "physi_limit_base", "frailty_base_tri", "dependence_base", "MMSE_base_byte", "hear", "physi_limit_incid" ],
         "nodes": [ { "id": "physi_limit_base", "type": 1 }, { "id": "frailty_base_tri", "type": 1 }, { "id": "dependence_base", "type": 1 }, { "id": "MMSE_base_byte", "type": 1 }, { "id": "hear", "type": 1 }, { "id": "physi_limit_incid", "type": 0 } ],
         "links": [ { "source": "physi_limit_base", "target": "frailty_base_tri", "value": 0.437 }, { "source": "dependence_base", "target": "frailty_base_tri", "value": 0.364 }, { "source": "MMSE_base_byte", "target": "frailty_base_tri", "value": 0.402 }, { "source": "hear", "target": "frailty_base_tri", "value": 0.341 }, { "source": "physi_limit_incid", "target": "frailty_base_tri", "value": -0.283 } ]
         }
         ]
    print(list_dict_duplicate_removal(selection))