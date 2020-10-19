# Demirjian's评分标注工具

采用python-flask框架开发，基于B/S方式交互，支持多人同时标注。

## 特点
* B/S方式交互
* 支持多人同时标注（可分配不同标注人员的标注范围，或不同人员标注不同类别）
* 类别采用选择方式，免去手工输入类别工作
* 支持拖拽方式修正标注区域
* 支持键盘方向键切换标注样本
* 支持多类别多目标标注


## 使用方法
1. 根据`requirements.txt`安装环境依赖
```build
$ pip3 install -r requirements.txt
$ flask initdb  (optional arg: --drop, for the first time use only)
$ flask run
```