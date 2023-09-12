#myApp应用的路由文件
from django.urls import path   #re_path指的是匹配正则路由
from . import views   # .指的是上级目录（myApp）

urlpatterns = [
    # path('',views.index,name='index'), #将该路由myproject.urls加入到总路由C:\MyProjects_yuxi\6-comparativeVis\Django+vue前后端交互\multiOutcomeInter\multiOutcomeInter\urls.py中
    # path('add/',views.add,name='add'), #调用views中的add方法
    path("covariant/",views.get_list,name='get_list'),
    path("linksnodes/",views.list_dict_duplicate_removal,name='list_dict_duplicate_removal'),
    path("getLink/",views.get_causal_edges,name='get_causal_edges'),
    path('recaculate_Links/', views.get_value_of_graph, name='get_value_of_graph'),
    path('calculate_layout',views.calculate_layout, name = 'calculate_layout'),
    path("test11/",views.test11),
    path("test22/",views.variable_show),
    # path("find/<int:sid>",views.find),
    # path("find/<int:sid>/<str:name>",views.find,name="find3"),
    # re_path(r"^fun/(?P<yy>[0-9]{4}/(?P<mm>[0-9]{2}$",views.fun),
    # path("edit/",views.update,name="update"),

]  #views.index为调用时的方法