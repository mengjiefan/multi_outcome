#myApp应用的路由文件
from django.urls import path   #re_path指的是匹配正则路由
from . import views   # .指的是上级目录（myApp）

urlpatterns = [
    # path('',views.index,name='index'), #将该路由myproject.urls加入到总路由C:\MyProjects_yuxi\6-comparativeVis\Django+vue前后端交互\multiOutcomeInter\multiOutcomeInter\urls.py中
    # path('add/',views.add,name='add'), #调用views中的add方法
    path("covariant/",views.get_list,name='get_list'),
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
    path("test11/",views.test11),
    path("test22/",views.variable_show),
    # path("find/<int:sid>",views.find),
    # path("find/<int:sid>/<str:name>",views.find,name="find3"),
    # re_path(r"^fun/(?P<yy>[0-9]{4}/(?P<mm>[0-9]{2}$",views.fun),
    # path("edit/",views.update,name="update"),

]  #views.index为调用时的方法