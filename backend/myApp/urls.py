#myApp应用的路由文件
from django.urls import path   #re_path指的是匹配正则路由
from . import views   # .指的是上级目录（myApp）

urlpatterns = [
    # path('',views.index,name='index'), #将该路由myproject.urls加入到总路由C:\MyProjects_yuxi\6-comparativeVis\Django+vue前后端交互\multiOutcomeInter\multiOutcomeInter\urls.py中
    # path('add/',views.add,name='add'), #调用views中的add方法
    path("covariant/",views.get_list,name='get_list'),
    path("get_correlation", views.get_correlation, name='get_correlation'),
    path("get_aaai_result", views.get_aaai, name='get_aaai'),
    path("start_loop", views.start_loop, name='start_loop'),
    path("checkpoint_result", views.get_temp_result, name='get_temp_result'),
    path("stop_loop", views.stop_loop, name='stop_loop'),
    path("pause_loop", views.pause_loop, name='pause_loop'),
    path("continue_loop", views.continue_loop, name='continue_loop'),
    path("linksnodes/",views.list_dict_duplicate_removal,name='list_dict_duplicate_removal'),
    path("getLink/",views.get_causal_edges,name='get_causal_edges'),
    path('getValues/', views.get_values_for_node, name='get_values_for_node'),
    path('recaculate_Links/', views.get_value_of_graph, name='get_value_of_graph'),
    path('calculate_tree_layout',views.calculate_tree_layout, name = 'calculate_tree_layout'),
    path('calculate_center_layout', views.calculate_center_layout, name='calculate_center_layout'),
    path('calculate_aggregate_layout', views.calculate_aggregate_layout, name='calculate_aggregate_layout'),
    path('calculate_relative_layout', views.calculate_relative_layout, name='calculate_relative_layout'),
    path('get_outcomes', views.get_outcomes, name='get_outcomes'),
    path('get_factors', views.get_factors, name='get_factors'),
    path('get_index', views.get_index, name='get_index'),
    path('get_all_dataset', views.get_all_dataset, name='get_all_dataset'),
    path('get_csv_data', views.get_csv_data, name='get_csv_data'),
    path('save_new_data', views.save_new_data, name='save_new_data')
]  #views.index为调用时的方法