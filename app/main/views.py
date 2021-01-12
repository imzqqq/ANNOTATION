# -*-coding:utf-8-*-
from flask import render_template, redirect, request, current_app, url_for, g,\
     send_from_directory, abort, flash, Flask, make_response, jsonify, send_file, session
from flask_login import login_user, logout_user, login_required, current_user
from . import main
from app.models import User, InvitationCode, Picture, Annotation, Review_Annotation, Final_Review_Annotation
from .forms import LoginForm, RegistForm, PasswordForm, InviteRegistForm
from app.extensions import db
from app.tool import get_bing_img_url, resize_image
from sqlalchemy.sql import and_ , or_
import datetime
import codecs
import sys
import hashlib
import json
import threading
import time
import os
import argparse
import traceback
from werkzeug.utils import secure_filename
from PIL import Image
import app.config as sys_config
import app.tool as tool
from app.tool import toExcel, compute_tooth_age
from datetime import date
from datetime import datetime
from datetime import timedelta
from datetime import timezone
import re
from flask_bootstrap import Bootstrap


# 创建一个锁
mu = threading.Lock()
# 允许上传的type
ALLOWED_EXTENSIONS = set(
    ['png', 'jpg', 'bmp', 'jpeg', "PNG", "JPG", 'BMP', 'JPEG'])  # 大写的.JPG是不允许的
imagename_gb = ""


#日期合法性
def isValidDate(year, month, day):
    try:
        date(year, month, day)
        return True
    except:
        return False


#文件名合法性
def allowed_name(filename):
    name_without_suffix = (filename.split('-', 1)[0])
    print(name_without_suffix)
    re_item_number = re.sub("\D", "", name_without_suffix)
    print(re_item_number)
    try:
        if(len(re_item_number) == 8):
            re_item_year = int(re_item_number[0:4])
            re_item_month = int(re_item_number[4:6])
            re_item_day = int(re_item_number[6:8])
            if(isValidDate(re_item_year,re_item_month,re_item_day)):
                return True
            else:
                return False
        else:
            return False
    except:
        return False

#文件大小格式化
def size_format(size):
    if size < 1000:
        return '%i' % size + 'size'
    elif 1000 <= size < 1000000:
        return '%.1f' % float(size/1000) + 'KB'
    elif 1000000 <= size < 1000000000:
        return '%.1f' % float(size/1000000) + 'MB'
    elif 1000000000 <= size < 1000000000000:
        return '%.1f' % float(size/1000000000) + 'GB'
    elif 1000000000000 <= size:
        return '%.1f' % float(size/1000000000000) + 'TB'


def allowed_file(filename):
    # 圆括号中的1是分割次数
    return '.' in filename and filename.split('.', 1)[1] in ALLOWED_EXTENSIONS


@main.before_request
def before_request():
    """
    This function is only executed before each request that is handled by a function of that blueprint.

    Refuses all attempts to request either of/CSS/JS /img/ from clients
    """
    if '/css/' in request.path or '/js/' in request.path or '/img/' in request.path:
        return


@main.route('/', methods=['POST', 'GET'])
@login_required
def index():
    global imagename_gb
    imagename_gb = ""
    return render_template('index.html')


@main.route('/login', methods=['GET', 'POST'])
def login():
    login_form = LoginForm(prefix='login')
    if login_form.validate_on_submit():
        u = User.query.filter_by(username=login_form.username.data.strip()).first()
        if u is None:
            flash({'error': '帐号未注册！'})
        elif u is not None and u.verify_password(login_form.password.data.strip()) and u.status:
            login_user(user=u, remember=login_form.remember_me.data)
            flash({'success':'欢迎{}登录成功！'.format(u.username)})
            return redirect(request.args.get('next',url_for('main.index')))
        elif not u.status:
            flash({'error': '用户已被管理员注销！'})
        elif not u.verify_password(login_form.password.data.strip()):
            flash({'error': '密码不正确！'})
    return render_template('login.html', form=login_form)


@main.route('/register', methods=['GET', 'POST'])
def register():
    '''
    注册
    '''
    is_use_invite_code = current_app.config['MILAB_REGISTER_INVITECODE']
    form = RegistForm(prefix='register')
    if is_use_invite_code:
        form = InviteRegistForm(prefix='register')
    if form.validate_on_submit():
        u = User(username=form.username.data.strip(),
                email=form.email.data.strip(),
                password=form.password.data.strip(),
                status=True, role=False)
        db.session.add(u)
        db.session.commit()
        if is_use_invite_code:
            ic = InvitationCode.query.filter(InvitationCode.code == form.code.data.strip()).first()
            if ic :
                ic.user = u.username
                ic.state = False
        db.session.commit()
        login_user(user=u)
        flash({'success':'欢迎{}注册成功！'.format(u.username)})
        return redirect(request.args.get('next', url_for('main.index')))
    return render_template('register.html', form=form)


@main.route('/logout')
@login_required
def logout():
    """退出系统"""
    logout_user()
    return redirect(url_for('main.index'))


@main.route('/about/', methods=['GET', 'POST'])
def about():
    return render_template('about.html')

@main.route('/about_page/', methods=['GET', 'POST'])
def about_page():
    return render_template('about_1.html')

@main.route('/about_user/', methods=['GET', 'POST'])
def about_user():
    return render_template('about_2.html')

@main.route('/about_annotation/', methods=['GET', 'POST'])
def about_annotation():
    return render_template('about_3.html')

@main.route('/about_pic/', methods=['GET', 'POST'])
def about_pic():
    return render_template('about_4.html')

@main.route('/about_list/', methods=['GET', 'POST'])
def about_list():
    return render_template('about_5.html')

@main.route('/profile/', methods=['GET'])
def profile():
    '''个人信息'''
    return render_template('profile.html')


@main.route('/password', methods=['GET', 'POST'])
def password():
    '''修改密码'''
    form = PasswordForm()
    if form.validate_on_submit():
        u = User.query.filter_by(username=form.cur_user_name.data.strip()).first()
        if u is None:
            flash({'error': '帐号未注册！'})
        elif not u.status:
            flash({'error': '用户已被管理员注销！'})
        elif not u.verify_password(form.pwd.data.strip()):
            flash({'error': '密码不正确！'})
        elif u is not None and u.verify_password(form.pwd.data.strip()) and u.status:
            u.password = form.password.data
            db.session.commit()

        flash({'success':'修改密码成功'})
        return redirect(url_for('.profile'))
    return render_template('password.html', form=form)


@main.route('/bing_bg')
def bing_bg():
    '''
    获取背景地址
    '''
    return redirect(get_bing_img_url())


@main.route('/imagehosting')
@login_required
def image_hosting():
    """
    图床
    """
    print('------request')
    global imagename_gb
    user_to_pic = Annotation.query.all()
    if (imagename_gb == "" or imagename_gb is None):
        if (current_user.role == 'secondary_annotator' or current_user.role == 'reviewer'):
            page = request.args.get('page', 1, type=int)
            img_annlist = Picture.query.join(Review_Annotation).paginate(
                page, per_page=8, error_out=False)
            user_to_pic = Review_Annotation.query.all()
            return render_template('image_hosting.html', imgs=img_annlist, review_flag=True, user_to_pic=user_to_pic)
            # print(img_annlist)
            # imgs = Picture.query.order_by(Picture.id.desc()).paginate(
            #     page, per_page=8, error_out=False)
            # 表连接
            # img_annlist = Annotation.query.join(Picture).all()
            # return render_template('image_hosting.html', imgs=img_annlist)
        else:
            page = request.args.get('page', 1, type=int)
            imgs = Picture.query.order_by(Picture.id.desc()).paginate(
                page, per_page=8, error_out=False)
            # img_annlist = Annotation.query.join(Picture).all()
            return render_template('image_hosting.html', imgs=imgs, review_flag=False, user_to_pic=user_to_pic)
    else:
        if (current_user.role == 'secondary_annotator' or current_user.role == 'reviewer'):
            # 搜索关键词
            page = request.args.get('page', 1, type=int)
            print("\n------------imagename_gb, ", imagename_gb)
            imgs = Picture.query.filter(Picture.name.like('%' + imagename_gb + '%')).join(Review_Annotation).paginate(
                page, per_page=8, error_out=False)
            user_to_pic = Review_Annotation.query.all()
            return render_template('image_hosting.html', imgs=imgs, review_flag=True, user_to_pic=user_to_pic)
        else:
            # 搜索关键词
            page = request.args.get('page', 1, type=int)
            print("\n------------imagename_gb, ", imagename_gb)
            imgs = Picture.query.filter(Picture.name.like('%' + imagename_gb + '%')).paginate(
                page, per_page=8, error_out=False)
            user_to_pic = Annotation.query.all()
            return render_template('image_hosting.html', imgs=imgs, review_flag=False, user_to_pic=user_to_pic)


# 查找
@main.route('/imagehosting/query', methods=['GET', 'POST'])
@login_required
def image_hosting_query():
    kw = request.form['imagename']
    print("-------", kw)
    global imagename_gb
    imagename_gb = kw
    res = {
        'code': 1,
        'msg': u'图片检索成功!',
        'imagename': kw
    }
    return jsonify(res)

# @main.route('/image_hosting_query_callback/', methods=['GET', 'POST'])
# @login_required
def image_hosting_query_callback(imagename_gb):
    # 搜索关键词
    page = request.args.get('page', 1, type=int)
    print("\n------------imagename_gb, " , imagename_gb)
    # if(imagename_gb=="" or imagename_gb==None):
    #     imagename_gb = request.args.get('imagename')
    imgs = Picture.query.filter(Picture.name.like('%'+ imagename_gb +'%')).paginate(
         page, per_page=8, error_out=False)
    # print("\n------------imagename, " , imagename_gb)

    # #image = imgs.order_by(Picture.id.desc()).paginate(
    #     page, per_page=8, error_out=False)
    # 表连接
    user_to_pic = Annotation.query.all()
    # img_annlist = Annotation.query.join(Picture).all()
    # print("-------imgs: ", imgs.items)
    # print("-------user_to_pic:", user_to_pic)
    # query_ann = user_to_pic
    return render_template('image_hosting.html', imgs=imgs, user_to_pic=user_to_pic)


@main.route('/upload_query', methods=['POST'])
@login_required
def query_pic():
    url_path = request.form['url']
    # 'http://127.0.0.1:5000/uploads/20201013191128.bmp' , 寻找本地路径
    tmp_url_ = url_path.split("/")
    local_url_path = tmp_url_[-2] + "/" + tmp_url_[-1]
    original_file_aps = local_url_path.split('.')
    file_name = original_file_aps[0]
    ext = original_file_aps[1]
    original_url = file_name.split('_')[0] + '.' + ext
    filesize = size_format(os.path.getsize(original_url))

    # 获取图片的分辨率
    # from PIL import Image
    # img_resolution = list(Image.open(local_url_path).size)  # 宽高

    import cv2
    img = cv2.imread(original_url)

    sp = img.shape
    height = sp[0]  # height(rows) of image
    width = sp[1]  # width(colums) of image

    res = {
        'code': 1,
        'msg': u'图片上传成功!',
        'url': original_url,
        'size': filesize,
        'img_resolution_w': width,
        'img_resolution_h': height,
    }

    return jsonify(res)


@main.route('/uploads/<path:filename>')
def get_image(filename):
    return send_from_directory(current_app.config['MILAB_UPLOAD_PATH'], filename)


@main.route('/upload', methods=['POST'])
@login_required
def upload():
    """图片上传处理"""
    res = {}
    files = request.files.getlist('files')
    for file in files:
        if not allowed_file(file.filename):
            res = {
                'code': 0,
                'msg': '图片格式异常!'
            }
            flash("format error!!!")
        elif not allowed_name(file.filename):
            res = {
                'code': 0,
                'msg': '图片名不合法!'
            }
            flash("filename error!!!")
        else:
            url_path = ''
            url_path_s = ''
            url_path_m = ''
            upload_type = current_app.config.get('MILAB_UPLOAD_TYPE')
            ex = os.path.splitext(file.filename)[1]
            ct = time.time()
            data_head = datetime.now().strftime('%Y%m%d%H%M%S')
            data_secs = (ct - int(ct)) * 1000
            time_stamp = "%s%05d" % (data_head, data_secs)
            filename = time_stamp + ex
            time.sleep(0.001)

            if upload_type is None or upload_type == '' or upload_type == 'local':
                file.save(os.path.join(current_app.config['MILAB_UPLOAD_PATH'], filename))
                filename_s = resize_image(file, filename, current_app.config['MILAB_IMG_SIZE']['small'])
                filename_m = resize_image(file, filename, current_app.config['MILAB_IMG_SIZE']['medium'])

                url_path = url_for('main.get_image', filename=filename)
                url_path_s = url_for('main.get_image', filename=filename_s)
                url_path_m = url_for('main.get_image', filename=filename_m)
            else:
                flash("上传失败!!!")

            # 返回   文件名不带空格！
            pic = Picture(name=file.filename.replace(" ", "").strip() if len(file.filename) < 32 else filename, url=url_path, url_s=url_path_s,
                          url_m=url_path_m)
            try:
                db.session.add(pic)
                db.session.commit()
                res = {
                    'code': 1,
                    'msg': u'图片上传成功！',
                    'url': url_path,
                    'url_s': url_path_s,
                    'url_m': url_path_m,
                    'name': filename
                }
            except:
                db.session.rollback()
                flash("请勿重复上传!")
                res = {
                    'code': 0,
                    'msg': '请勿重复上传！！！'
                }
    return jsonify(res)


@main.route('/<template>')
def route_template(template):
    return render_template(template)


# 读取类别标签
@main.route('/api/annotation/labels', methods=['GET'])
def get_labels():
    #label字典
    label_json = tool.get_labels()
    result = dict()
    result['message'] = '保存成功！'
    result['data'] = label_json
    if(current_user.role == 'secondary_annotator'):
        result['role'] = 'secondary_annotator'
    else:
        result['role'] = 'other'
    return jsonify(result)


# 读取标注样本图片
@main.route('/api/annotation/sample', methods=['GET'])
def get_sample():
    #对前端返回的request数据处理
    if 'index' in request.args:
        # img_name需要request里面的index字段的值
        img_name = request.args['index']
        img_path = os.path.join(current_app.config['SAMPLE_FILE_PATH'], img_name)
        # Sends the contents of a file to the client.
        return send_file(img_path, mimetype='application/octet-stream',
                         as_attachment=True, attachment_filename=img_name)
    else:
        result = dict()
        result['message'] = 'failure'
        return jsonify(result)


# 标注保存接口
@main.route('/api/annotation/save', methods=['POST'])
def save_annotation():
    print('正在保存')
    ann_info = request.form['ann_info']
    user_name = request.form['user']
    pic_name = request.form['pic_name']
    shoot_date = request.form['shoot_date']
    annotation_date = request.form['ann_date']

    # print(ann_info)
    # print('------', shoot_date)

    tooth_age = compute_tooth_age(pic_name, shoot_date)

    ann_query = Annotation.query.filter_by(ImageName=pic_name, User=user_name).first()
    if ann_query is None:
        new_ann_item = Annotation(ImageName=pic_name, User=user_name, Tooth_Annotation_Info=ann_info,
                                  ShootDate=shoot_date,
                                  AnnotationDate=annotation_date, Tooth_Age=tooth_age)
        db.session.add(new_ann_item)
        db.session.commit()
    else:
        ann_query.Tooth_Annotation_Info = ann_info
        ann_query.ShootDate = shoot_date
        ann_query.AnnotationDate = annotation_date
        ann_query.Tooth_Age = tooth_age
        db.session.commit()
    result = dict()
    result['message'] = '保存成功！'
    return jsonify(result)

# 标注保存接口
@main.route('/api/annotation/save/review', methods=['POST'])
def save_review_annotation():
    print('正在保存')
    review_info = request.form['review_info']
    pic_name = request.form['pic_name']
    user_name = request.form['reviewer']
    shootdate = request.form['shootdate']

    # print(ann_info)
    # print('------', shoot_date)
    tooth_age = compute_tooth_age(pic_name, shootdate)

    review_query = Review_Annotation.query.filter_by(ImageName=pic_name, Reviewer=user_name).first()
    if review_query is None:
        new_review_item = Review_Annotation(ImageName=pic_name, Reviewer=user_name, ShootDate=shootdate,
                                            Tooth_Annotation_Info=review_info, Tooth_Age=tooth_age, flag_review=False)
        db.session.add(new_review_item)
        db.session.commit()
    else:
        review_query.Tooth_Annotation_Info = review_info
        review_query.Reviewer = user_name
        review_query.ShootDate = shootdate
        review_query.Tooth_Age = tooth_age
        review_query.flag_review = False
        db.session.commit()
    result = dict()
    result['message'] = '保存成功！'
    return jsonify(result)


@main.route('/api/annotation/save/final/review', methods=['POST'])
def save_final_review_annotation():
    # print('正在保存')
    review_info = request.form['review_info']
    pic_name = request.form['pic_name']
    user_name = request.form['reviewer']
    # print('user_name')
    shootdate = request.form['shootdate']
    annotation_length = request.form['annotation_length']
    print(type(annotation_length))
    # print(ann_info)
    # print('------', shoot_date)
    tooth_age = compute_tooth_age(pic_name, shootdate)

    review_query = Final_Review_Annotation.query.filter_by(ImageName=pic_name, Reviewer=user_name).first()
    if review_query is None:
        new_review_item = Final_Review_Annotation(ImageName=pic_name, Reviewer=user_name, ShootDate=shootdate,
                                                  Tooth_Annotation_Info=review_info, Tooth_Age=tooth_age,
                                                  flag_review=True)
        db.session.add(new_review_item)
        db.session.commit()
    else:
        review_query.Tooth_Annotation_Info = review_info
        review_query.Reviewer = user_name
        review_query.ShootDate = shootdate
        review_query.Tooth_Age = tooth_age
        review_query.flag_review = True
        db.session.commit()
    result = dict()
    result['message'] = '保存成功！'
    cur_imagename = Picture.query.filter_by(name=pic_name).first()
    if annotation_length == '32':
        cur_imagename.remark = 'finish'
    else:
        cur_imagename.remark = 'missing'
    db.session.commit()
    return jsonify(result)


# 标注载入接口
@main.route('/api/annotation/reload', methods=['POST'])
def reload_annotation():
    user_name = request.form['user']
    pic_name = request.form['pic_name']

    if current_user.role != 'secondary_annotator' and current_user.role != 'reviewer':
        ann_data = Annotation.query.filter_by(ImageName=pic_name, User=user_name).first()
        if ann_data is None:
            result = {
                'code': 0,
                'msg': u'未查询到标注数据!'
            }
        else:
            annotation_box = ann_data.Tooth_Annotation_Info
            shoot_date = ann_data.ShootDate
            # print('---', shoot_date)
            result = {
                'code': 1,
                'msg': u'载入成功！',
                'annotation_box': annotation_box,
                'shoot_date': shoot_date,
                'review_flag': False
            }
        return jsonify(result)
    else:
        # 当前图片审核状态
        cur_image = Picture.query.filter_by(name=pic_name).first()
        remark = cur_image.remark
        print(remark)
        review_data = Review_Annotation.query.filter_by(ImageName=pic_name, flag_review=1).first()
        review_box = review_data.Tooth_Annotation_Info
        shoot_date = review_data.ShootDate
        # shoot_date = review_data.ShootDate
        # print('---', shoot_date)
        if current_user.role == 'secondary_annotator':
            annotation_data = Review_Annotation.query.filter_by(ImageName=pic_name, Reviewer=user_name).first()
            if annotation_data is None:
                annotation_box = None
            else:
                annotation_box = annotation_data.Tooth_Annotation_Info
            role = 'secondary_annotator'
            # print('=========annotation_box', annotation_data)
        else:
            if remark is not None:
                annotation_data = Final_Review_Annotation.query.filter_by(ImageName=pic_name, Reviewer=user_name).first()
                review_box = None
            else:
                annotation_data = Review_Annotation.query.filter_by(ImageName=pic_name, flag_review=0).first()
            # 获取数据
            if annotation_data is None:
                annotation_box = None
            else:
                annotation_box = annotation_data.Tooth_Annotation_Info
            role = 'reviewer'
        result = {
            'code': 1,
            'msg': u'载入成功！',
            'review_box': review_box,
            'annotation_box': annotation_box,
            'shoot_date': shoot_date,
            'role': role,
            'review_flag': True
        }
    return jsonify(result)


@main.route('/return-files/')
def return_files_tut():
    if mu.acquire(True):
        path_annotation = 'annotation/annotation.txt'
        toExcel(path_annotation)
        mu.release()
    try:
        return send_file('annotation/annotation.xlsx', attachment_filename='annotation.xlsx')
    except Exception as e:
        return str(e)


def add_data(obj):
    try:
        db.session.add(obj)
        db.session.commit()
    except Exception as e:
        print(e)
        db.session.rollback()
        flash("添加失败!")


@main.errorhandler(403)
def not_found_error(error):
    return render_template('page_403.html'), 403


@main.errorhandler(404)
def not_found_error(error):
    return render_template('page_404.html'), 404


@main.errorhandler(500)
def internal_error(error):
    return render_template('page_500.html'), 500
