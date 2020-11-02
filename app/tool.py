# -*- coding: UTF-8 -*-
import re
import pandas as pd
import datetime
import codecs
import hashlib
import traceback
import os
import json
import random
import app.config
from flask import request, current_app
from flask import abort
from flask_login import current_user
from functools import wraps
import requests
import logging
import PIL
from PIL import Image


def admin_required(func):
    """ 检查管理员权限 """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if current_user.is_admin() == "normal_user":
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator(func)


def isAjax():
    '''
    判断是否是ajax请求
    '''
    ajax_header = request.headers.get('X-Requested-With')
    if ajax_header and ajax_header == 'XMLHttpRequest':
        return True
    return False


def pretty_date(time=False):
    """
    Get a datetime object or a int() Epoch timestamp and return a
    pretty string like 'an hour ago', 'Yesterday', '3 months ago',
    'just now', etc
    """
    from datetime import datetime
    now = datetime.now()
    if type(time) is int:
        diff = now - datetime.fromtimestamp(time)
    elif isinstance(time, datetime):
        diff = now - time
    elif not time:
        diff = now - now
    second_diff = diff.seconds
    day_diff = diff.days

    if day_diff < 0:
        return ''

    if day_diff == 0:
        if second_diff < 10:
            return "just now"
        if second_diff < 60:
            return str(second_diff) + " seconds ago"
        if second_diff < 120:
            return "a minute ago"
        if second_diff < 3600:
            return str(int(second_diff / 60)) + " minutes ago"
        if second_diff < 7200:
            return "an hour ago"
        if second_diff < 86400:
            return str(int(second_diff / 3600)) + " hours ago"
    if day_diff == 1:
        return "Yesterday"
    if day_diff < 7:
        return str(day_diff) + " days ago"
    if day_diff < 31:
        return str(int(day_diff / 7)) + " weeks ago"
    if day_diff < 365:
        return str(int(day_diff / 30)) + " months ago"
    return str(int(day_diff / 365)) + " years ago"


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower(
           ) in current_app.config['MILAB_ALLOWED_IMAGE_EXTENSIONS']


def strip_tags(string, allowed_tags=''):
    """
    去除html标签
    """
    if allowed_tags != '':
        # Get a list of all allowed tag names.
        allowed_tags = allowed_tags.split(',')
        allowed_tags_pattern = ['</?'+allowed_tag +
                                '[^>]*>' for allowed_tag in allowed_tags]
        all_tags = re.findall(r'<[^>]+>', string, re.I)
        not_allowed_tags = []
        tmp = 0
        for tag in all_tags:
            for pattern in allowed_tags_pattern:
                rs = re.match(pattern, tag)
                if rs:
                    tmp += 1
                else:
                    tmp += 0
            if not tmp:
                not_allowed_tags.append(tag)
            tmp = 0
        for not_allowed_tag in not_allowed_tags:
            string = re.sub(re.escape(not_allowed_tag), '', string)
        print(not_allowed_tags)
    else:
        # If no allowed tags, remove all.
        string = re.sub(r'<[^>]*?>', '', string)

    return string


def gen_invit_code(count, long):
    '''
    生成邀请码
    count 数量
    long 长度
    '''
    import string
    import random
    r = []
    base_string = string.digits + string.ascii_letters
    for i in range(count):
        card_code = ''
        for j in range(long):
            card_code += random.choice(base_string)
        r.append(card_code)
    return r


def get_bing_img_url(format='js', idx=0):
    '''
    获取bing每日壁纸url
    '''
    url = 'https://cn.bing.com/HPImageArchive.aspx?format={}&idx={}&n=1'.format(
        format, idx)
    resp = requests.get(url, timeout=5).text
    data = json.loads(resp)
    return 'https://cn.bing.com{}'.format(data['images'][0]['url'])


def validate_request(ip, url):
    return True


# 保存进程PID到PID文件
def save_pid(path, pid):
    with open(path, 'w') as fp:
        fp.write(str(pid))


#将label_config里面的标签名字和描述按行读出并写入到字典中
def get_labels():
    label_file = codecs.open('annotation/label_config.txt', mode='r', encoding='utf-8')
    lines = label_file.readlines()
    label_file.close()
    labels = []
    for line in lines:
        if line.startswith('#'): 
            continue
        values = line.strip().split(':')
        label_name = values[0].strip()
        label_desc = values[1].strip()
        label = dict()
        label['name'] = label_name
        label['desc'] = label_desc
        labels.append(label)
    return labels


def convert_to_voc2007(file_path='annotation/annotation.txt'):
    """转换标注数据为VOC2007格式"""
    with codecs.open(file_path,mode='r', encoding='utf-8') as file:
        lines = file.readlines()
    annotations = dict()
    for line in lines:
        if line.strip()=='':continue
        values = line.strip().split(',')
        name = values[0]
        type = values[5]
        object = dict()
        object['name'] = type
        object['pose'] = 'Unspecified'
        object['truncated'] = 0
        object['difficult'] = 0
        object['bndbox'] = dict()
        object['bndbox']['xmin'] = values[1]
        object['bndbox']['ymin'] = values[2]
        object['bndbox']['xmax'] = values[3]
        object['bndbox']['ymax'] = values[4]
        if name not in annotations:
            annotation = dict()
            annotation['folder'] = 'VOC2007'
            annotation['filename'] = name
            annotation['size'] = dict()
            annotation['size']['width'] = 1000  # 若样本未统一尺寸，请根据实际情况获取
            annotation['size']['height'] = 600  # 若样本未统一尺寸，请根据实际情况获取
            annotation['size']['depth'] = 3
            annotation['segmented'] = 0
            annotation['object'] = [object]
            annotations[name] = annotation
        else:
            annotation = annotations[name]
            annotation['object'].append(object)
    names = []
    path = 'annotation/VOC2007/'
    if not os.path.exists(path+'Annotations'):
        os.mkdir(path+'Annotations')
    for annotation in annotations.items():
        filename = annotation[0].split('.')[0]
        names.append(filename)
        dic = {'annotation':annotation[1]}
        #将xml转成dict
        convertedXml = xml2dict.unparse(dic)
        xml_nohead = convertedXml.split('\n')[1]
        file = codecs.open(path + 'Annotations/'+filename + '.xml', mode='w', encoding='utf-8')
        file.write(xml_nohead)
        file.close()
    random.shuffle(names)
    if not os.path.exists(path+'ImageSets'):
        os.mkdir(path+'ImageSets')
    if not os.path.exists(path+'ImageSets/Main'):
        os.mkdir(path+'ImageSets/Main')
    file_train = codecs.open(path+'ImageSets/Main/train.txt',mode='w',encoding='utf-8')
    file_test = codecs.open(path + 'ImageSets/Main/test.txt', mode='w', encoding='utf-8')
    file_train_val = codecs.open(path + 'ImageSets/Main/trainval.txt', mode='w', encoding='utf-8')
    file_val = codecs.open(path + 'ImageSets/Main/val.txt', mode='w', encoding='utf-8')
    count = len(names)
    count_1 = 0.25 * count
    count_2 = 0.5 * count
    for i in range(count):
        if i < count_1:
            file_train_val.write(names[i]+'\n')
            file_train.write(names[i] + '\n')
        elif count_1 <= i <count_2:
            file_train_val.write(names[i] + '\n')
            file_val.write(names[i] + '\n')
        else:
            file_test.write(names[i] + '\n')
    file_train.close()
    file_test.close()
    file_train_val.close()
    file_val.close()


def toExcel(path_annotation):
    dir_path_annotation = 'annotation/' + path_annotation
    # 文件名->不带后缀
    path_name = path_annotation.split('.')[0]
    global_all_line = []
    global_all_line_item = []
    all_item_name_with_user = []

    re_all_item = []
    result_dict = dict()  # 字典
    result_list = []

    # 读取标注文件
    with open(dir_path_annotation, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for line in lines:
            global_all_line.append(line)
    # print("\n---\n", global_all_line, "\n---\n")

    # 把每一项读取出来，逗号是分隔符
    for i in global_all_line:
        line_item = i.split(',')
        global_all_line_item.append(line_item)
    # print("\n---\n", global_all_line_item, "\n---\n")
    # ['F张三19910708-20200128.bmp', '2020-01-28', '649', '459', '649', '459', ' 18', ' 1', ' dadsada\n']

    # 获取所有条目对应的文件名（不带后缀），和标注用户
    for each_line_item in global_all_line_item:
        pic_name = []
        pic_name.append(each_line_item[0])
        pic_name.append(each_line_item[-2].replace(" ", "").strip())
        all_item_name_with_user.append(pic_name)
    # print(all_item_name_without_suffix, "\n\n---\n")

    # 文件名清洗，获得“姓名、性别、年、月、日”
    for each_item in all_item_name_with_user:
        name_without_suffix = each_item[0].split('.')[0]
        re_item_name = re.sub("[A-Za-z0-9\!\%\[\]\,\.\-]", "", name_without_suffix)
        re_item_sex = ''.join(re.findall(r'[A-Za-z]', name_without_suffix))
        re_item_number = re.sub("\D", "", name_without_suffix)

        re_item_year = re_item_number[0:4]
        re_item_month = re_item_number[4:6]
        re_item_day = re_item_number[6:8]

        file_name = each_item[0]
        # 加入标注用户字段
        tmp_combine = [file_name, re_item_name, re_item_sex,
                       re_item_year, re_item_month, re_item_day, each_item[1]]
        re_all_item.append(tmp_combine)

    # print(re_all_item, "\n\n---\n")
    # ['F黄大明20081106.bmp', '黄大明', 'F', '2008', '11', '06', 'admin']
    # print(len(re_all_item))

    # TODO文件名去重，判断是否有多个标注者，若有则加到需要复核的列表中；
    # 先把列表中每个元素转化为tuple，因为list不可哈希但是tuple可哈希
    deduplication_re_all_item = []
    for re_item in re_all_item:
        if re_item not in deduplication_re_all_item:
            deduplication_re_all_item.append(re_item)

    # print(deduplication_re_all_item, "\n\n---\n")
    # print(len(deduplication_re_all_item))
    # [['F张三19910708-20200128.bmp', '张三', 'F', '1991', '07', '08']]

    # TODO若同一个文件漏标，则添加到漏标列表中；
    # 将同一个文件名的条目拼接，“唯一数字id、文件名、姓名、性别、年龄、年、月、日、坐标、牙评分（18-28-48-38）”
    all_patient_score = dict()

    for drai in deduplication_re_all_item:
        review_flag = False
        each_patient_score = dict()
        shoot_date = ''
        annotation_date = ''
        annotation_user = ''
        for gali in global_all_line_item:
            # 注意空格 -> 文件名相等并且标注用户相等
            if drai[0] == gali[0] and drai[-1] == gali[-2].replace(" ", "").strip():
                shoot_date = gali[1]
                annotation_date = gali[-1].replace("\n", "").strip()
                each_patient_score[gali[-4].strip()] = gali[-3].strip()
                annotation_user = gali[-2].replace("\n", "").strip()

        if ('18' not in each_patient_score):
            each_patient_score['18'] = 'NaN'
            review_flag = True
        if ('17' not in each_patient_score):
            each_patient_score['17'] = 'NaN'
            review_flag = True
        if ('16' not in each_patient_score):
            each_patient_score['16'] = 'NaN'
            review_flag = True
        if ('15' not in each_patient_score):
            each_patient_score['15'] = 'NaN'
            review_flag = True
        if ('14' not in each_patient_score):
            each_patient_score['14'] = 'NaN'
            review_flag = True
        if ('13' not in each_patient_score):
            each_patient_score['13'] = 'NaN'
            review_flag = True
        if ('12' not in each_patient_score):
            each_patient_score['12'] = 'NaN'
            review_flag = True
        if ('11' not in each_patient_score):
            each_patient_score['11'] = 'NaN'
            review_flag = True
        if ('21' not in each_patient_score):
            each_patient_score['21'] = 'NaN'
            review_flag = True
        if ('22' not in each_patient_score):
            each_patient_score['22'] = 'NaN'
            review_flag = True
        if ('23' not in each_patient_score):
            each_patient_score['23'] = 'NaN'
            review_flag = True
        if ('24' not in each_patient_score):
            each_patient_score['24'] = 'NaN'
            review_flag = True
        if ('25' not in each_patient_score):
            each_patient_score['25'] = 'NaN'
            review_flag = True
        if ('26' not in each_patient_score):
            each_patient_score['26'] = 'NaN'
            review_flag = True
        if ('27' not in each_patient_score):
            each_patient_score['27'] = 'NaN'
            review_flag = True
        if ('28' not in each_patient_score):
            each_patient_score['28'] = 'NaN'
            review_flag = True
        if ('48' not in each_patient_score):
            each_patient_score['48'] = 'NaN'
            review_flag = True
        if ('47' not in each_patient_score):
            each_patient_score['47'] = 'NaN'
            review_flag = True
        if ('46' not in each_patient_score):
            each_patient_score['46'] = 'NaN'
            review_flag = True
        if ('45' not in each_patient_score):
            each_patient_score['45'] = 'NaN'
            review_flag = True
        if ('44' not in each_patient_score):
            each_patient_score['44'] = 'NaN'
            review_flag = True
        if ('43' not in each_patient_score):
            each_patient_score['43'] = 'NaN'
            review_flag = True
        if ('42' not in each_patient_score):
            each_patient_score['42'] = 'NaN'
            review_flag = True
        if ('41' not in each_patient_score):
            each_patient_score['41'] = 'NaN'
            review_flag = True
        if ('31' not in each_patient_score):
            each_patient_score['31'] = 'NaN'
            review_flag = True
        if ('32' not in each_patient_score):
            each_patient_score['32'] = 'NaN'
            review_flag = True
        if ('33' not in each_patient_score):
            each_patient_score['33'] = 'NaN'
            review_flag = True
        if ('34' not in each_patient_score):
            each_patient_score['34'] = 'NaN'
            review_flag = True
        if ('35' not in each_patient_score):
            each_patient_score['35'] = 'NaN'
            review_flag = True
        if ('36' not in each_patient_score):
            each_patient_score['36'] = 'NaN'
            review_flag = True
        if ('37' not in each_patient_score):
            each_patient_score['37'] = 'NaN'
            review_flag = True
        if ('38' not in each_patient_score):
            each_patient_score['38'] = 'NaN'
            review_flag = True
        each_patient_score['review_flag'] = review_flag
        each_patient_score['shoot_date'] = shoot_date
        each_patient_score['annotation_user'] = annotation_user
        each_patient_score['annotation_date'] = annotation_date
        name_index = drai[0] + '*' + drai[-1]
        all_patient_score[name_index] = each_patient_score

    # print(all_patient_score, "\n\n---\n")
    # print(len(all_patient_score))
    # {'F黄大明20081106.bmp*admin': {'18': '1', ... ,
    #                             'review_flag': False, 'shoot_date': '2020-10-31', 'annotation_user': 'admin',
    #                             'annotation_date': '2020-10-31'},

    # 判断是否闰年
    def is_leap(year):
        if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):
            return True
        else:
            return False

    # 计算
    month_days = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31,
                  6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31}

    def minus_result(first_year, second_year):
        y = first_year.year - second_year.year
        m = first_year.month - second_year.month
        d = first_year.day - second_year.day
        if d < 0:
            if second_year.month == 2:
                if is_leap(second_year.year):
                    month_days[2] = 29
            d += month_days[second_year.month]
            m -= 1
        if m < 0:
            m += 12
            y -= 1
        return y, m, d

    # 计算牙龄  根据shoot_date 和 birth_date
    i = 1
    for aps in all_patient_score.items():
        tmp_aps = dict()
        for drai2 in deduplication_re_all_item:

            if aps[0].split('*')[0] == drai2[0] and aps[0].split('*')[1] == drai2[-1].replace(" ", "").strip():
                # print(aps)
                # print("====")
                # print(drai2)
                tmp_aps = aps[1]
                cur_shoot_date_year = tmp_aps["shoot_date"].split('-')[0]
                cur_shoot_date_month = tmp_aps["shoot_date"].split('-')[1]
                cur_shoot_date_day = tmp_aps["shoot_date"].split('-')[2]
                cur_year = drai2[3]
                cur_month = drai2[4]
                cur_day = drai2[5]
                # print(cur_day,cur_month,cur_year)
                # print(cur_shoot_date_day,cur_shoot_date_month,cur_shoot_date_year)

                cur_birth_date = datetime.date(int(cur_year), int(cur_month), int(cur_day))
                cur_shoot_date = datetime.date(int(cur_shoot_date_year), int(cur_shoot_date_month),
                                               int(cur_shoot_date_day))

                y, m, d = minus_result(cur_shoot_date, cur_birth_date)
                tmp_aps["patient_name"] = drai2[1]
                tmp_aps["sex"] = drai2[2]
                tmp_aps["year_age"] = y
                tmp_aps["month_age"] = m
                tmp_aps["day_age"] = d
                tmp_aps["file_name"] = aps[0].split('*')[0]
                tmp_aps["id"] = i
                i = i + 1
                # print(tmp_aps)
        result_list.append(tmp_aps)

    # print(len(result_list))
    # for item in result_list:
    #     print("\n\n---\n", item)

    pf = pd.DataFrame(result_list)
    order = ['id', 'file_name', "patient_name", 'sex', 'year_age', 'month_age', 'day_age', 'shoot_date', 'review_flag',
             'annotation_user', 'annotation_date',
             '18', '17', '16', '15', '14', '13', '12', '11',
             '21', '22', '23', '24', '25', '26', '27', '28',
             '48', '47', '46', '45', '44', '43', '42', '41',
             '31', '32', '33', '34', '35', '36', '37', '38']
    pf = pf[order]
    file_path = pd.ExcelWriter('annotation/' + path_name + '.xlsx')  # 打开excel文件
    # 替换空单元格
    pf.fillna(' ', inplace=True)
    # 输出
    pf.to_excel(file_path, encoding='utf-8', index=False, sheet_name="sheet1")
    file_path.save()
    return path_name + '.xlsx'


def resize_image(image, filename, base_width):
    """[优化图片存储]

    Args:
        image ([type]): [description]
        filename ([type]): [description]
        base_width ([type]): [description]
    """
    filename, ext = os.path.splitext(filename)
    img = Image.open(image)
    if img.size[0] <= base_width:
        return filename + ext
    w_percent = (base_width / float(img.size[0]))
    h_size = int((float(img.size[1]) * float(w_percent)))
    img = img.resize((base_width, h_size), PIL.Image.ANTIALIAS)

    filename += current_app.config['MILAB_IMG_SUFFIX'][base_width] + ext
    img.save(os.path.join(
        current_app.config['MILAB_UPLOAD_PATH'], filename), optimize=True, quality=85)
    return filename
