#!/usr/bin/env python
# -*-coding: utf-8-*-
import xlsxwriter
import codecs
import hashlib
import json
import threading
import time
import os
import argparse
import traceback
from flask import Flask, render_template, request, flash, make_response, redirect, url_for, jsonify, send_file
from werkzeug.utils import secure_filename
from PIL import Image
import re
import csv
import codecs
import xlwt
import pandas as pd

def toExcel(path_annotation):
    global_all_line = []
    global_all_line_item = []
    all_item_name_without_suffix = []
    re_all_item = []
    result_dict = dict()
    result_list = []
    #加载标注文件
    with open(path_annotation, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for line in lines:
            global_all_line.append(line)
            
    #获取所有标注条目，并按照“文件名，坐标，牙位，评分”存储在同一个list中
    for i in global_all_line:
        line_item = i.split(',')
        global_all_line_item.append(line_item)
    # print("\n---\n", global_all_line_item, "\n---\n")

    #获取所有条目对应的文件名，并除去后缀
    for each_line_item in global_all_line_item:
        all_item_name_without_suffix.append(each_line_item[0].split('.')[0])
    # print(all_item_name_without_suffix, "\n\n---\n")
        
    #文件名清洗，获得“性别、年龄、年、月、日”
    for each_item in all_item_name_without_suffix:
        tmp_all_item = []
        #过滤字符串中的英文与符号，保留汉字
        re_item_name = re.sub("[A-Za-z0-9\!\%\[\]\,\。]", "", each_item)
        #从字符串中提取字母字符串
        re_item_sex = ''.join(re.findall(r'[A-Za-z]', each_item)) 
        #从字符串中提取数字
        tmp_item_number = re.sub("\D", "", each_item) 
        re_item_age = tmp_item_number[0:2]
        re_item_year = tmp_item_number[2:6]
        re_item_month = tmp_item_number[6:8]
        re_item_day = tmp_item_number[8:10]
        file_name = each_item + ".bmp"
        tmp_combine = [file_name, re_item_name, re_item_sex, re_item_age, re_item_year, re_item_month, re_item_day]
        re_all_item.append(tmp_combine)
    # print(re_all_item, "\n\n---\n")

    #TODO文件名去重，判断是否有多个标注者，若有则加到需要复核的列表中；
    # 先把列表中每个元素转化为tuple，因为list不可哈希但是tuple可哈希
    deduplication_re_all_item = []
    for re_item in re_all_item:
        if re_item not in deduplication_re_all_item:
            deduplication_re_all_item.append(re_item)
    # print(deduplication_re_all_item, "\n\n---\n")

    #TODO若同一个文件漏标，则添加到漏标列表中；
    #将同一个文件名的条目拼接，“唯一数字id、文件名、姓名、性别、年龄、年、月、日、坐标、牙评分（18-28-48-38）”
    all_patient_score = dict()
    for drai in deduplication_re_all_item:
        review_flag = False
        each_patient_score = dict()
        for gali in global_all_line_item:
            if(drai[0] == gali[0]):
                each_patient_score[gali[-1].replace("\n", "")] = gali[-2]
        if('18' not in each_patient_score):
            each_patient_score['18'] = 'NaN'
            review_flag = True
        if('17' not in each_patient_score):
            each_patient_score['17'] = 'NaN'
            review_flag = True
        if('16' not in each_patient_score):
            each_patient_score['16'] = 'NaN'
            review_flag = True
        if('15' not in each_patient_score):
            each_patient_score['15'] = 'NaN'
            review_flag = True
        if('14' not in each_patient_score):
            each_patient_score['14'] = 'NaN'
            review_flag = True
        if('13' not in each_patient_score):
            each_patient_score['13'] = 'NaN'
            review_flag = True
        if('12' not in each_patient_score):
            each_patient_score['12'] = 'NaN'
            review_flag = True
        if('11' not in each_patient_score):
            each_patient_score['11'] = 'NaN'
            review_flag = True
        if('21' not in each_patient_score):
            each_patient_score['21'] = 'NaN'
            review_flag = True
        if('22' not in each_patient_score):
            each_patient_score['22'] = 'NaN'
            review_flag = True
        if('23' not in each_patient_score):
            each_patient_score['23'] = 'NaN'
            review_flag = True
        if('24' not in each_patient_score):
            each_patient_score['24'] = 'NaN'
            review_flag = True
        if('25' not in each_patient_score):
            each_patient_score['25'] = 'NaN'
            review_flag = True
        if('26' not in each_patient_score):
            each_patient_score['26'] = 'NaN'
            review_flag = True
        if('27' not in each_patient_score):
            each_patient_score['27'] = 'NaN'
            review_flag = True
        if('28' not in each_patient_score):
            each_patient_score['28'] = 'NaN'
            review_flag = True
        if('48' not in each_patient_score):
            each_patient_score['48'] = 'NaN'
            review_flag = True
        if('47' not in each_patient_score):
            each_patient_score['47'] = 'NaN'
            review_flag = True
        if('46' not in each_patient_score):
            each_patient_score['46'] = 'NaN'
            review_flag = True
        if('45' not in each_patient_score):
            each_patient_score['45'] = 'NaN'
            review_flag = True
        if('44' not in each_patient_score):
            each_patient_score['44'] = 'NaN'
            review_flag = True
        if('43' not in each_patient_score):
            each_patient_score['43'] = 'NaN'
            review_flag = True
        if('42' not in each_patient_score):
            each_patient_score['42'] = 'NaN'
            review_flag = True
        if('41' not in each_patient_score):
            each_patient_score['41'] = 'NaN'
            review_flag = True
        if('31' not in each_patient_score):
            each_patient_score['31'] = 'NaN'
            review_flag = True
        if('32' not in each_patient_score):
            each_patient_score['32'] = 'NaN'
            review_flag = True
        if('33' not in each_patient_score):
            each_patient_score['33'] = 'NaN'
            review_flag = True
        if('34' not in each_patient_score):
            each_patient_score['34'] = 'NaN'
            review_flag = True
        if('35' not in each_patient_score):
            each_patient_score['35'] = 'NaN'
            review_flag = True
        if('36' not in each_patient_score):
            each_patient_score['36'] = 'NaN'
            review_flag = True
        if('37' not in each_patient_score):
            each_patient_score['37'] = 'NaN'
            review_flag = True
        if('38' not in each_patient_score):
            each_patient_score['38'] = 'NaN'
            review_flag = True
        each_patient_score['review_flag'] = review_flag
        all_patient_score[drai[0]] = each_patient_score
    # print(all_patient_score, "\n\n---\n")

    for aps in all_patient_score.items():
        tmp_aps = dict()
        for drai2 in deduplication_re_all_item:
            if(aps[0] == drai2[0]):
                tmp_aps = aps[1]
                tmp_aps["patient_name"] = drai2[1]
                tmp_aps["sex"] = drai2[2]
                tmp_aps["age"] = drai2[3]
                tmp_aps["year"] = drai2[4]
                tmp_aps["month"] = drai2[5]
                tmp_aps["day"] = drai2[6]
                tmp_aps["file_name"] = aps[0]
        result_list.append(tmp_aps)
    print(result_list, "\n\n---\n")


    pf = pd.DataFrame(result_list)
    # print(pf)
    order = ['file_name', "patient_name", "age", 'sex', 'year', 'month', 'day', 'review_flag',
            '18', '17', '16', '15', '14', '13', '12', '11',
            '21', '22', '23', '24', '25', '26', '27', '28',
            '48', '47', '46', '45', '44', '43', '42', '41',
            '31', '32', '33', '34', '35', '36', '37', '38']  # 指定列的顺序
    pf = pf[order]
    file_path = pd.ExcelWriter('annotation/annotation.xlsx')  # 打开excel文件
    # 替换空单元格
    pf.fillna(' ', inplace=True)
    # 输出
    pf.to_excel(file_path, encoding='utf-8', index=False, sheet_name="sheet1")
    file_path.save()


path_annotation = 'annotation/annotation.txt'
toExcel(path_annotation)

