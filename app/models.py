# -*- coding: utf-8 -*-
__author__ = '__imzqqq'

from . import db
from flask import current_app
from flask_login import UserMixin, AnonymousUserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import hashlib
import os
#import markdown


class User(UserMixin, db.Model):
    __tablename__ = 'user'
    __table_args__ = {"mysql_charset" : "utf8"}
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True)
    email = db.Column(db.String(64), unique=True, index=True)
    password_hash = db.Column(db.String(128))
    member_since = db.Column(db.DateTime(), default=datetime.now)
    last_seen = db.Column(db.DateTime(), default=datetime.now)
    status = db.Column(db.Boolean, default=False)
    role = db.Column(db.String(64), default=False) # super_admin, normal_admin 

    @property
    def password(self):
        raise ArithmeticError('非明文密码，不可读。')

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password=password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password=password)

    def is_admin(self):
        return self.role

    def ping(self):
        self.last_seen = datetime.now()
        db.session.add(self)

    def __repr__(self):
        return '<User %r>' % self.username


class AnonymousUser(AnonymousUserMixin):
    def is_admin(self):
        return False


class Picture(db.Model):
    '''
    图片
    '''
    __tablename__ = 'picture'
    __table_args__ = {"mysql_charset" : "utf8"}
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(64))
    timestamp = db.Column(db.DateTime, default=datetime.now)
    url = db.Column(db.String(120))
    url_s = db.Column(db.String(120))
    url_m = db.Column(db.String(120))
    remark = db.Column(db.String(32))


class AccessLog(db.Model):
    '''
    请求日志
    '''
    __tablename__ = 'access_log'
    __table_args__ = {"mysql_charset" : "utf8"}
    id = db.Column(db.Integer, primary_key=True)
    ip = db.Column(db.String(20))
    url = db.Column(db.String(120))
    timestamp = db.Column(db.DateTime, default=datetime.now)
    remark = db.Column(db.String(32))


class InvitationCode(db.Model):
    '''
    邀请码
    '''
    __tablename__ = 'invitation_code'
    __table_args__ = {"mysql_charset" : "utf8"}
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(64), unique=True, nullable=False)
    user = db.Column(db.String(64))
    state = db.Column(db.Boolean, default=True)



class Annotation(db.Model):
    '''
    标注文件
    '''
    __tablename__ = 'annotation_list'
    __table_args__ = {"mysql_charset" : "utf8"}
    id = db.Column(db.Integer,primary_key=True)
    user = db.Column(db.String(64),nullable=False)
    date = db.Column(db.String(64))
    size = db.Column(db.String(64))
    txt_file_url = db.Column(db.String(256))
    file_name = db.Column(db.String(256))


