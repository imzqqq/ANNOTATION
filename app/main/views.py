#-*-coding:utf-8-*-
from flask import render_template, redirect, request, current_app, url_for, g,\
     send_from_directory, abort, flash, Flask, make_response, jsonify, send_file, session
from flask_login import login_user, logout_user, login_required, current_user
from . import main
from app.models import User, InvitationCode, Picture, Annotation
from .forms import LoginForm, RegistForm, PasswordForm, InviteRegistForm
from app.extensions import db
from app.tool import get_bing_img_url
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
from app.tool import toExcel
from datetime import date
import re
from flask_bootstrap import Bootstrap


# 创建一个锁
mu = threading.Lock()
# 允许上传的type
ALLOWED_EXTENSIONS = set(
    ['png', 'jpg', 'bmp', 'jpeg', "PNG", "JPG", 'BMP', 'JPEG'])  # 大写的.JPG是不允许的


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
    page = request.args.get('page', 1, type=int)
    imgs = Picture.query.order_by(Picture.id.desc()).paginate(
        page, per_page=20, error_out=False)
    return render_template('image_hosting.html', imgs=imgs)


@main.route('/upload_query', methods=['POST'])
@login_required
def query_pic():
    url_path = request.form['url']
    # 'http://127.0.0.1:5000/uploads/20201013191128.bmp' , 寻找本地路径
    tmp_url_ = url_path.split("/")
    local_url_path = tmp_url_[-2] + "/" + tmp_url_[-1]
    filesize = size_format(os.path.getsize(local_url_path))

    # 获取图片的分辨率
    from PIL import Image
    img_resolution  = list(Image.open(local_url_path).size)  # 宽高
    # print("\n------------img_resolution: ", img_resolution[0])

    res = {
        'code': 1,
        'msg': u'图片上传成功!',
        'url': url_path,
        'size': filesize,
        'img_resolution_w':img_resolution[0],
        'img_resolution_h':img_resolution[1]
    }
    return jsonify(res)


@main.route('/uploads/<path:filename>')
def get_image(filename):
    return send_from_directory(current_app.config['MILAB_UPLOAD_PATH'], filename)


@main.route('/upload', methods=['POST'])
@login_required
def upload():
    """图片上传处理"""
    file = request.files.get('file')
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
        filename = datetime.datetime.now().strftime('%Y%m%d%H%M%S')+ex

        if upload_type is None or upload_type == '' or upload_type == 'local':
            file.save(os.path.join(current_app.config['MILAB_UPLOAD_PATH'], filename))
            filename_s = "resize_image(file, filename, current_app.config['MILAB_IMG_SIZE']['small'])"
            filename_m = "resize_image(file, filename, current_app.config['MILAB_IMG_SIZE']['medium'])"

            url_path = url_for('main.get_image', filename=filename)
            url_path_s = url_for('main.get_image', filename=filename_s)
            url_path_m = url_for('main.get_image', filename=filename_m)
        else:
            flash("上传失败!!!")

        # 返回
        pic = Picture(name=file.filename if len(file.filename) < 32 else filename, \
                            url=url_path, url_s=url_path_s, url_m=url_path_m)
        db.session.add(pic)
        res = {
            'code': 1,
            'msg': u'图片上传成功!',
            'url': url_path,
            'url_s': url_path_s,
            'url_m': url_path_m,
            'name': filename
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
    tags = request.form['tags']
    user_name = request.form['user']
    tags_new = ''
    for tag in tags.split('\n'):
        if tag == '':
            continue
        #除图片名字之外的都分割到一起
        values = tag.split(',', maxsplit=1)
        tags_new += values[0] + ',' + values[1]+'\n'

    today = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    path_annotation = os.path.join(current_app.config['MILAB_ANNOTATION_PATH'], 'annotation.txt')
    # file name -> group by user name
    name_annotation = user_name + '_' + str(today) + '.txt'
    path_annotation_user = os.path.join(current_app.config['MILAB_ANNOTATION_PATH'], name_annotation)
    # all in one txt file
    name_annotation_total = 'annotation.txt'

    try:
        if mu.acquire(True):
            if not os.path.exists(path_annotation):
                file = codecs.open(
                    path_annotation, mode='a+', encoding='utf-8')
                file.close()
            file = codecs.open(path_annotation, mode='a+', encoding='utf-8')
            file.write(tags_new)
            file.close()
            mu.release()

        if mu.acquire(True):
            if not os.path.exists(path_annotation_user):
                file = codecs.open(
                    path_annotation, mode='a+', encoding='utf-8')
                file.close()
            file = codecs.open(path_annotation_user, mode='a+', encoding='utf-8')
            file.write(tags_new)
            file.close()
            mu.release()

        # 返回
        filesize = size_format(os.path.getsize(path_annotation_user))
        a = Annotation.query.filter_by(txt_file_url=path_annotation_user).first()
        if a is None:
            ann = Annotation(user=user_name, date=str(today), size=filesize, txt_file_url=path_annotation_user, file_name= name_annotation)
            db.session.add(ann)
        elif a is not None:
            a.size = filesize
            db.session.commit()

        #总标注列表
        filesize_total = size_format(os.path.getsize(path_annotation))
        a_total = Annotation.query.filter_by(txt_file_url=path_annotation).first()
        if a_total is None:
            ann = Annotation(user='all user annotation', date=str(today), size=filesize_total, txt_file_url= path_annotation, file_name = name_annotation_total)
            db.session.add(ann)
        elif a_total is not None:
            a_total.size = filesize_total
            db.session.commit()

    except Exception as e:
        print("Exception: ", e, "!!!")
    result = dict()
    result['message'] = '保存成功！'
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
