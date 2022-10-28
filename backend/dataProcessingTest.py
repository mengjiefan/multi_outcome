'''
Graph Nodes:
X1;X2;X3;X4;X5;X6

Graph Edges:
1. X2 --> X1
2. X3 --> X1
3. X1 --- X4
4. X5 --> X1
5. X1 --> X6
6. X2 --- X3
7. X2 --> X4
8. X2 --> X6
9. X3 --> X4
10. X3 --> X6
11. X5 --> X4
12. X4 --> X6
'''
import json
with open('hospital_freq_cg.txt','r',encoding='utf-8')as f:                     #打开txt文件
    for line in f:
        d = {}
        d['content'] = line.rstrip('\n')                      #line表示txt文件中的一行，将每行后面的换行符去掉，并将其作为字典d的content键的值
        with open('file.json','a',encoding='utf-8')as file:   #创建一个json文件，mode设置为'a'
            json.dump(d,file,ensure_ascii=False)              #将字典d写入json文件中，并设置ensure_ascii = False,主要是因为汉字是ascii字符码,若不指定该参数，那么文字格式就会是ascii码
            file.write('\n')


'''
结局变量为：dependence_incid,最相关的8个变量为:['dependence_base', 'age_group_decade', 'f31_sum', 'a1_sex', 'b11_byte', 'education_tri', 'BMI_cate', 'eye_base']
初始节点为:['dependence_incid']
最终节点为:['dependence_base', 'age_group_decade', 'f31_sum', 'a1_sex', 'b11_byte', 'education_tri', 'BMI_cate', 'eye_base', 'dependence_incid']
Depth=6, working on node 8: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 9/9 [00:00<?, ?it/s] 
Graph Nodes:
X1;X2;X3;X4;X5;X6;X7;X8;X9

Graph Edges:
1. X2 --> X1
2. X3 --> X1
3. X6 --> X1
4. X7 --> X1
5. X1 --> X9
6. X3 --> X2
7. X4 --> X2
8. X7 --> X2
9. X8 --> X2
10. X2 --> X9
11. X3 --- X4
12. X3 --> X5
13. X3 --> X6
14. X3 --> X7
15. X4 --> X6
16. X4 --> X9
17. X5 --> X6
18. X5 --> X8
19. X9 --> X5
20. X7 --> X6
21. X8 --> X6
22. X9 --> X6
23. X7 --> X8
24. X9 --> X7
25. X8 --> X9

结局变量为：hospital_freq,最相关的8个变量为:['multimorbidity_base', 'g15c1_CVD', 'hear', 'sleep', 'MMSE_base_byte', 'frailty_base_tri', 'g15a1_HT', 'g15e1_COPD']
初始节点为:['hospital_freq']
最终节点为:['multimorbidity_base', 'g15c1_CVD', 'hear', 'sleep', 'MMSE_base_byte', 'frailty_base_tri', 'g15a1_HT', 'g15e1_COPD', 'hospital_freq']
Depth=7, working on node 8: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 9/9 [00:00<?, ?it/s] 
Graph Nodes:
X1;X2;X3;X4;X5;X6;X7;X8;X9

Graph Edges:
1. X1 --> X2
2. X1 --> X3
3. X1 --> X4
4. X1 --> X5
5. X1 --> X9
6. X3 --> X2
7. X5 --> X2
8. X6 --> X2
9. X8 --> X2
10. X2 --> X9
11. X4 --> X3
12. X3 --> X9
13. X7 --> X4
14. X4 --> X9
15. X6 --> X5
16. X7 --> X5
17. X8 --> X5
18. X5 --> X9
19. X6 --- X7
20. X6 --> X9
21. X7 --> X9
22. X8 --> X9
'''



