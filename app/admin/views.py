# -*- coding: utf-8 -*-
from flask import render_template, request, redirect, url_for, flash, current_app, jsonify, send_from_directory,send_file
from flask_login import login_user, logout_user, login_required, current_user
from flask import session
from . import admin
from app.extensions import db, app_helper
from .forms import AddAdminForm, LoginForm, AddUserForm, DeleteUserForm, EditUserForm, \
    ChangePasswordForm, AddFolderForm, InvitcodeForm, OnlineToolForm
from app.models import User, AccessLog, InvitationCode, Picture, Annotation
import os
import datetime
from datetime import timedelta
from app.tool import admin_required, isAjax, allowed_file, strip_tags, gen_invit_code
from app.config import config
from sqlalchemy.sql import and_, or_
from app.tool import get_bing_img_url
from app.tool import resize_image, toExcel
from app.tool import draw_pic, draw_pic_online, compare_annotation_info
import json
import threading
import pandas as pd

os.environ['TZ'] = 'Asia/Shanghai'


# 创建一个锁
mu = threading.Lock()


@admin.before_request
def before_request():
    session.permanent = True
    current_app.permanent_session_lifetime = timedelta(days=1)


@admin.route('/', methods=['GET', 'POST'])
@login_required
def index():
    current_user.ping()

    return render_template('admin/index.html')
    

@admin.route('/login', methods=['GET', 'POST'])
def login():
    login_form = LoginForm(prefix='login')
    user = User.query.filter_by(status=True).first()
    bing_img_url = get_bing_img_url()
    if not user:
        add_admin_form = AddAdminForm(prefix='add_admin')
        if add_admin_form.validate_on_submit():
            u = User(username=add_admin_form.username.data.strip(),
                     email=add_admin_form.email.data.strip(),
                     password=add_admin_form.password.data.strip(),
                     status=True, role="root"
                     )
            db.session.add(u)
            db.session.commit()
            login_user(user=u)

            session.permanent = True
            app_helper.app.permanent_session_lifetime = timedelta(minutes=10)        
            return redirect(url_for('admin.index'))
        return render_template('admin/add_admin.html', addAdminForm=add_admin_form, bing_img_url=bing_img_url)
    else:
        if login_form.validate_on_submit():
            u = User.query.filter_by(
                username=login_form.username.data.strip()).first()
            if u is None:
                flash({'error': '帐号未注册！'})
            elif u is not None and u.verify_password(login_form.password.data.strip()) and u.status:
                login_user(user=u, remember=login_form.remember_me.data)
                session.permanent = True
                app_helper.app.permanent_session_lifetime = timedelta(minutes=10)
                # if(u.role == "secondary_annotator"):
                #     return redirect(url_for('main.index'))
                # else:
                return redirect(url_for('admin.index'))
            elif not u.status:
                flash({'error': '用户已被管理员注销！'})
            elif not u.verify_password(login_form.password.data.strip()):
                flash({'error': '密码不正确！'})
    return render_template('admin/login.html', loginForm=login_form, bing_img_url=bing_img_url)


@admin.route('/logout')
@login_required
def logout():
    """
    退出系统
    """
    logout_user()
    return redirect(url_for('main.index'))


@admin.route('/users', methods=['GET', 'POST'])
@login_required
@admin_required
def users():
    add_user_form = AddUserForm(prefix='add_user')
    delete_user_form = DeleteUserForm(prefix='delete_user')
    if add_user_form.validate_on_submit():
        if add_user_form.role.data == '1':
            role = 'primary_annotator'
        elif add_user_form.role.data == '2':
            role = 'secondary_annotator'
        else:
            role = 'reviewer'
        if add_user_form.status.data == 'True':
            status = True
        else:
            status = False
        u = User(username=add_user_form.username.data.strip(), email=add_user_form.email.data.strip(),
                 role=role, status=status, password=add_user_form.password.data.strip())
        db.session.add(u)
        db.session.commit()
        flash({'success': '添加用户<%s>成功！' % add_user_form.username.data.strip()})

    if delete_user_form.validate_on_submit():
        u = User.query.get_or_404(int(delete_user_form.user_id.data.strip()))
        db.session.delete(u)
        flash({'success': '删除用户<%s>成功！' % u.username})
    users = User.query.all()
    return render_template('admin/users.html', users=users, addUserForm=add_user_form,
                           deleteUserForm=delete_user_form)


@admin.route('/user-edit/<user_id>', methods=['GET', 'POST'])
@login_required
@admin_required
def user_edit(user_id):
    user = User.query.get_or_404(user_id)
    edit_user_form = EditUserForm(prefix='edit_user', obj=user)
    if edit_user_form.validate_on_submit():
        user.username = edit_user_form.username.data.strip()
        user.email = edit_user_form.email.data.strip()
        if edit_user_form.role.data == '1':
            user.role = 'primary_annotator'
        elif edit_user_form.role.data == '2':
            user.role = 'secondary_annotator'
        else:
            user.role = 'reviewer'

        if edit_user_form.status.data == 'True':
            user.status = True
        else:
            user.status = False
        flash({'success': '用户资料已修改成功！'})
    return render_template('admin/edit_user.html', editUserForm=edit_user_form, user=user)


@admin.route('/password', methods=['GET', 'POST'])
@login_required
@admin_required
def password():
    change_password_form = ChangePasswordForm(prefix='change_password')
    if change_password_form.validate_on_submit():
        if current_user.verify_password(change_password_form.old_password.data.strip()):
            current_user.password = change_password_form.password.data.strip()
            db.session.commit()
            flash({'success': '您的账户密码已修改成功！'})
        else:
            flash({'error': '无效的旧密码！'})
    return render_template('admin/password.html', changePasswordForm=change_password_form)


@admin.route('/uploads/<path:filename>')
def get_image(filename):
    return send_from_directory(current_app.config['MILAB_UPLOAD_PATH'], filename)


@admin.route('/upload', methods=['POST'])
@login_required
@admin_required
def upload():
    """图片上传处理"""
    file = request.files.get('file')
    if not allowed_file(file.filename):
        res = {
            'code': 0,
            'msg': '图片格式异常!'
        }
        flash("format error!!!")
    else:
        url_path = ''
        url_path_s = ''
        url_path_m = ''
        upload_type = current_app.config.get('MILAB_UPLOAD_TYPE')
        ex = os.path.splitext(file.filename)[1]
        filename = datetime.datetime.now().strftime('%Y%m%d%H%M%S')+ex

        if upload_type is None or upload_type == '' or upload_type == 'local':
            file.save(os.path.join(current_app.config['MILAB_UPLOAD_PATH'], filename))
            filename_s = resize_image(
                file, filename, current_app.config['MILAB_IMG_SIZE']['small'])
            filename_m = resize_image(
                file, filename, current_app.config['MILAB_IMG_SIZE']['medium'])
            url_path = url_for('admin.get_image', filename=filename)
            url_path_s = url_for('admin.get_image', filename=filename_s)
            url_path_m = url_for('admin.get_image', filename=filename_m)
        else:
            flash("上传失败!!!")

        # 返回
        pic = Picture(name=file.filename if len(file.filename) < 32 else filename, \
                            url=url_path, url_s=url_path_s, url_m=url_path_m)
        db.session.add(pic)
        db.session.commit()
        res = {
            'code': 1,
            'msg': u'图片上传成功!',
            'url': url_path,
            'url_s': url_path_s,
            'url_m': url_path_m,
            'name': filename
        }
    return jsonify(res)


@admin.route('/imagehosting')
@login_required
@admin_required
def image_hosting():
    """
    图床
    """
    page = request.args.get('page', 1, type=int)
    imgs = Picture.query.order_by(Picture.id.desc()).paginate(
        page, per_page=8, error_out=False)
    return render_template('admin/image_hosting.html', imgs=imgs)


@admin.route('/accesslogs', methods=['GET'])
@login_required
@admin_required
def access_logs():
    '''
    搜索引擎抓取记录
    '''
    remark = request.args.get('remark', '')
    params = {'remark': remark}
    page = request.args.get('page', 1, type=int)
    logs = AccessLog.query.filter(
        AccessLog.remark.like("%" + remark + "%") if remark is not None else '').order_by(AccessLog.timestamp.desc()). \
        paginate(page, per_page=current_app.config['MILAB_POST_PER_PAGE'], error_out=False)
    return render_template('admin/access_log.html', logs=logs, params=params)


@admin.route('/invitcodes', methods=['GET', 'POST'])
@login_required
@admin_required
def invit_codes():
    '''
    邀请码
    '''
    form = InvitcodeForm()
    if form.validate_on_submit:
        count = int(form.count.data)
        cs = gen_invit_code(count, 15)
        for c in cs:
            ic = InvitationCode(code=c)
            db.session.add(ic)
        db.session.commit()
    page = request.args.get('page', 1, type=int)
    codes = InvitationCode.query.order_by(InvitationCode.id.asc()). \
        paginate(page, per_page=current_app.config['MILAB_POST_PER_PAGE'], error_out=False)
    return render_template('admin/invit_codes.html', codes=codes, form=form)


@admin.route('/settings', methods=['GET', 'POST'])
@login_required
@admin_required
def settings():
    '''
    系统设置
    '''
    return render_template('admin/settings.html')

@admin.route('/ann_data', methods=['GET', 'POST'])
@login_required
def ann_data():

    current_user_name = current_user.username
    if (current_user.role != 'secondary_annotator'):
        ann_lists = Annotation.query.with_entities(Annotation.User).distinct().all()
        # ann_lists = Annotation.query.order_by(Annotation.User.asc()).all()
    else:
        ann_lists = Annotation.query.filter_by(User=current_user_name).all()
        # print('ann_lists', ann_lists)
    if ann_lists == []:
        flag = False
    else:
        flag = True
    return render_template('admin/annotation_data.html', flag=flag, ann_lists=ann_lists)

@admin.route('/annotation_data_query_user', methods=['GET', 'POST'])
@login_required
@admin_required
def annotation_data_query_user():
    target = request.form['username']
    ann_lists_by_user = Annotation.query.filter_by(User=target).all()
    image_list = []
    if ann_lists_by_user != []:
        for ann_lists in ann_lists_by_user:
            image_list.append(ann_lists.ImageName)
        res = {
            'code': 1,
            'image_list': image_list
        }
        return jsonify(res)

@admin.route('/annotation_data_query_user_to_image', methods=['GET', 'POST'])
@login_required
def annotation_data_query_user_to_image():
    username = request.form['username']
    imagename = request.form['imagename']

    print('----', username)

    imagename_result = Picture.query.filter_by(name=imagename).first()
    image_url = imagename_result.url

    annotation_query = Annotation.query.filter_by(User=username, ImageName=imagename).first()
    annotation_data = annotation_query.Tooth_Annotation_Info

    res = {
        'code': 1,
        'msg': u'成功!',
        'url': image_url,
        'annotation_data': annotation_data
    }
    return jsonify(res)


@admin.route('/review', methods=['GET', 'POST'])
@admin_required
@login_required
def review():
    ann_data = Annotation.query.with_entities(Annotation.ImageName).distinct().all()
    if ann_data == []:
        flag = False
    else:
        flag = True
    return render_template('admin/review.html', flag=flag, image_list=ann_data)


@admin.route('/review_query', methods=['GET', 'POST'])
@admin_required
@login_required
def review_query():

    target = request.form['imagename']
    imagename_result = Picture.query.filter_by(name=target).first()
    image_url = imagename_result.url
    tooth_info = dict()   # user 为key
    tooth_age = dict()
    tooth_info_key_tooth_user = dict()
    tooth_info_classify_user = []     # 列表（按用户分）  存储 用户标注项目 字典

    ann_data = Annotation.query.filter_by(ImageName=target).all()
    for ann_item in ann_data:
        # 存在字典里
        tooth_age[ann_item.User] = ann_item.ShootDate
        tooth_info[ann_item.User] = json.loads(ann_item.Tooth_Annotation_Info)
    for user, ann_info in tooth_info.items():
        print('------', type(ann_info))
        for tooth_info_items in ann_info:
            tooth_info_distinguish_user = dict()  # 用户标注项目
            tooth_info_distinguish_user[user] = tooth_info_items
            tooth_info_classify_user = []
            # 对于key error
            if(tooth_info_items['toothPosition'] in tooth_info_key_tooth_user):
                tooth_info_classify_user = tooth_info_key_tooth_user[tooth_info_items['toothPosition']]
                tooth_info_classify_user.append(tooth_info_distinguish_user)
                tooth_info_key_tooth_user[tooth_info_items['toothPosition']] = tooth_info_classify_user
            else:
                tooth_info_classify_user.append(tooth_info_distinguish_user)
                tooth_info_key_tooth_user[tooth_info_items['toothPosition']] = tooth_info_classify_user
    print('tooth_list_key_by_user ', tooth_info_key_tooth_user)
    confirm_annotation_list = compare_annotation_info(tooth_info_key_tooth_user)
    result = {
        'code': 1,
        'url': image_url,
        'data': confirm_annotation_list,
        'tooth_age': tooth_age
    }
    return jsonify(result)




@admin.route('/review_data', methods=['GET', 'POST'])
@admin_required
@login_required
def review_data():
    return render_template('admin/ann_list.html')


@admin.route('/ann_list', methods=['GET', 'POST'])
@login_required
@admin_required
def ann_list():
    '''
    标注列表（简要）
    '''
    current_user_name = current_user.username
    if(current_user.role == 'super_admin'):
        ann_lists = Annotation.query.order_by(Annotation.user.asc())
    else:
        ann_lists = Annotation.query.filter_by(user=current_user_name).all()
    return render_template('admin/ann_list.html', ann_lists=ann_lists)

@admin.route('/ann_list_u_query', methods=['GET', 'POST'])
@login_required
@admin_required
def ann_list_u_query():
    target = request.form['username']
    # print("========================")
    # print(target)
    # print("========================")
    all_ann_lists = Annotation.query.filter_by(user=target).first()

    if (all_ann_lists):
        file_name = toExcel(all_ann_lists.file_name)
        file_path = os.path.join(current_app.config['MILAB_ANNOTATION_PATH'], file_name)
        # print(file_path)
        df = pd.read_excel(file_path)
        data_html = df.to_html()
        # 转json数据
        # df_json = df.to_json(orient='split', force_ascii=False)
        # json1 = json.loads(df_json)
        res = {
            'code': 1,
            'msg': u'查询成功!',
            'df': data_html,
        }
        return jsonify(res)
    else:
        res = {
            'code': 0,
            'msg': u'无法查询!',
        }
        return jsonify(res)

@admin.route('/ann_list_u', methods=['GET', 'POST'])
@login_required
@admin_required
def ann_list_u():
    '''
    标注列表（详细）: 将excel展示网页
    '''
    current_user_name = current_user.username
    if (current_user.role == 'super_admin'):
        result = Annotation.query.order_by(Annotation.user.desc()).with_entities(Annotation.user).distinct().all()
    # 不是超级管理员只查看自己的
    else:
        result = Annotation.query.filter_by(user=current_user_name).all()

    if(result):
        return render_template('admin/ann_list_u.html', flag=True, users=result)
    else:
        return render_template('admin/ann_list_u.html', flag=False)


@admin.route('/return_files/<file_url>', methods=['GET', 'POST'])
@login_required
@admin_required
def return_files(file_url):
    excel_name = toExcel(file_url)
    print("\n-----file_url : ", file_url)
    print("\n-----excel_name : ", excel_name)
    try:
        # must set param cache_timeout
        return send_from_directory(current_app.config['MILAB_ANNOTATION_PATH'], filename=excel_name, as_attachment=True)
    except Exception as e:
        print("\n-----e : ", e)
        return str(e)



@admin.route('/cbct_list', methods=['GET', 'POST'])
@login_required
def cbct_list():
    '''
    全景片列表
    '''
    page = request.args.get('page', 1, type=int)
    imgs= Picture.query.order_by(Picture.id.desc()).paginate(
        page, per_page=8, error_out=False)
    # img_annlist = Annotation.query.join(Picture).all()
    user_to_pic = Annotation.query.all()

    return render_template('admin/cbct_list.html', imgs=imgs, user_to_pic=user_to_pic )


@admin.route('/picture-edit', methods=['GET', 'POST'])
@login_required
@admin_required
def picture_edit():
    pic_id = request.form['pic_id']
    pic_name = request.form['update_name']
    pic = Picture.query.filter_by(id = pic_id).first()
    pic.name = pic_name
    db.session.commit()
    return render_template('admin/edit_user.html')



def add_data(obj):
    try:
        db.session.add(obj)
        db.session.commit()
        
    except Exception as e:
        print(e)
        db.session.rollback()
        flash("添加失败!")


@admin.route('/audit/<path:filename>')
def get_audit_image(filename):
    # print(current_app.config['MILAB_AUDIT_PATH'])
    return send_from_directory(current_app.config['MILAB_AUDIT_PATH'], filename)
