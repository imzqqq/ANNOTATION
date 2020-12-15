# -*- coding: utf-8 -*-
from flask import url_for
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, IntegerField, HiddenField, \
    BooleanField, SubmitField, SelectField, TextAreaField, DateTimeField
from wtforms.validators import DataRequired, Length, Email, Regexp, EqualTo
from wtforms import ValidationError
from ..models import User
from datetime import datetime


class LoginForm(FlaskForm):
    username = StringField('帐号', validators=[DataRequired()])
    password = PasswordField('密码', validators=[DataRequired()])
    remember_me = BooleanField(label='记住我', default=False)
    submit = SubmitField('登 录')


class AddAdminForm(FlaskForm):
    username = StringField(
        '用户名', validators=[DataRequired(), Length(1, 16, message='用户名长度要在1和16之间')])
    email = StringField('邮箱', validators=[DataRequired(), Length(6, 64, message='邮件长度要在6和64之间'),
                                          Email(message='邮件格式不正确！')])
    password = PasswordField(
        '密码', validators=[DataRequired(), EqualTo('password2', message='密码必须一致！')])
    password2 = PasswordField('重输密码', validators=[DataRequired()])
    submit = SubmitField('注 册')

    def validate_username(self, field):
        if User.query.filter_by(username=field.data).first():
            raise ValidationError('用户名已被注册！')

    def validate_email(self, field):
        if User.query.filter_by(email=field.data).first():
            raise ValidationError('邮箱已被注册！')


class ChangePasswordForm(FlaskForm):
    old_password = PasswordField('旧密码', validators=[DataRequired()])
    password = PasswordField(
        '密码', validators=[DataRequired(), EqualTo('password2', message='密码必须一致！')])
    password2 = PasswordField('重输密码', validators=[DataRequired()])
    submit = SubmitField('更新密码')


class AddUserForm(FlaskForm):
    username = StringField('用户名', validators=[
        DataRequired(), Length(1, 64, message='用户名长度要在1和64之间')])
    password = StringField(
        '密码', validators=[DataRequired(), Length(1, 128, message='密码长度要在1和64之间')])
    email = StringField('邮箱', validators=[DataRequired(), Length(6, 64, message='邮件长度要在6和64之间'),
                                          Email(message='邮件格式不正确！')])
    role = SelectField(
        label='权限', validators=[DataRequired()],
        render_kw={
            'class': 'form-control'
        }, choices=[('1', '一级标注者'), ('2', '二级标注者'), ('3', '审核员')], default=3, coerce=str)
    status = SelectField('状态', choices=[('True', '正常'), ('False', '注销')])
    submit = SubmitField('添加用户')

    def validate_username(self, field):
        if User.query.filter_by(username=field.data).first():
            raise ValidationError('用户名已被注册！')

    def validate_email(self, field):
        if User.query.filter_by(email=field.data).first():
            raise ValidationError('邮箱已被注册！')


class DeleteUserForm(FlaskForm):
    user_id = StringField()


class EditUserForm(FlaskForm):
    username = StringField('用户名', validators=[
        DataRequired(), Length(1, 64, message='姓名长度要在1和64之间')])
    email = StringField('邮箱', validators=[DataRequired(), Length(6, 64, message='邮件长度要在6和64之间'),
                                          Email(message='邮件格式不正确！')])
    role = SelectField(
        label='权限', validators=[DataRequired()],
        render_kw={
            'class': 'form-control'
        }, choices=[('1', '一级标注者'), ('2', '二级标注者'), ('3', '审核员')], default=3, coerce=str)
    status = SelectField('状态', choices=[('True', '正常'), ('False', '注销')])
    submit = SubmitField('修改用户')

#
# class EditPicForm(FlaskForm):
#     picname = StringField('图片名称', validators=[
#         DataRequired(), Length(1, 64, message='姓名长度要在1和64之间')])
#     submit = SubmitField('修改图片')
#
#     def validate_picname(self, field):



class DeletePicForm(FlaskForm):
    pic_name = StringField()


class OnlineToolForm(FlaskForm):
    id = HiddenField('id')
    title = StringField('标题', validators=[DataRequired()])
    desp = StringField('描述', validators=[DataRequired()])
    url = StringField('链接', validators=[DataRequired()], default='#')
    sn = IntegerField('排序', default=0)
    img = StringField('图片', validators=[DataRequired()])
    state = SelectField('状态', choices=[('1', '正常'), ('0', '停止')])
    submit = SubmitField('提交')


class InvitcodeForm(FlaskForm):
    count = IntegerField('数量', default=0, validators=[DataRequired()])
    submit = SubmitField('提交')


class AddFolderForm(FlaskForm):
    directory = StringField('文件夹')
    submit = SubmitField('确定')
