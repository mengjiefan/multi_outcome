# Visual Analysis of Multi-outcome Causal Graphs
This visual analysis tool supports the causal analysis of single and multiple outcomes.

Our visual analysis method includes two stages. In the first stage, users can explore and edit single causal graphs based on our progressive comparative visualization of various causal discovery methods combined with their domain knowledge. In the second stage, users can select graphs of interested outcomes and compare them using the supergraph or subgraphs with the new comparable graph layout. Our method features several new techniques that address general issues in causal analysis and visual comparison.

More information can be found in the paper "Visual Analysis of Multi-outcome Causal Graphs" by Mengjie Fan, Jinlu Yu, Daniel Weiskopf, Nan Cao, Huai-Yu Wang, and Liang Zhou. (IEEE VIS 2024).

If you use our approach, please cite our paper: 
@ARTICLE{Fan2024,
  author={Fan, Mengjie and Yu, Jinlu and Weiskopf, Daniel and Cao, Nan and Wang, Huai-Yu and Zhou, Liang},
  journal={IEEE Transactions on Visualization and Computer Graphics}, 
  title={Visual Analysis of Multi-outcome Causal Graphs}, 
  year={2024},
  volume={},
  number={},
  pages={1-11},
  keywords={Visualization;Data visualization;Layout;Cause effect analysis;Medical diagnostic imaging;Diseases;Cognition;Causal graph visualization and visual analysis;causal discovery;comparative visualization;visual analysis in medicine},
  doi={10.1109/TVCG.2024.3456346}}


# Installations
Before running our program, the visualizations need to be build and installed. Our program was tested on Windows.
Install the visualizations:

```python
pip install -r requirements.txt
```
```javascript
npm install
```

# How to Run?

Our analysis is based on two health research datasets ([clhls](https://opendata.pku.edu.cn/dataset.xhtml?persistentId=doi:10.18170/DVN/WBO7LK), [ukb](https://www.ukbiobank.ac.uk/)) (permissions obtained). Users can execute and test the tool directly, they can also upload their own data for analysis. The detailed interactive operation process can be found in the MultioutcomeCausality_VIS2024_rev_suppl_video (.mp4).

## Start the backend 

```python
cd backend
pip install -r requirements.txt
python manage.py runserver
```



## Start the frontend

```javascript
cd frontend
npm install
npm run serve
```

When shown on the console, open [http://localhost:8080/](http://localhost:8080/), then the user can execute the tool.

