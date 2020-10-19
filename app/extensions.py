# -*- coding: utf-8 -*-
__author__ = '__imzqqq'

from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_sitemap import Sitemap
from flask_migrate import Migrate

class AppHelper(object):
    def init_app(self, app, db=None, directory=None, **kwargs):
        self.app = app


db = SQLAlchemy()
sitemap = Sitemap()
login_manager = LoginManager()
migrate = Migrate()
app_helper = AppHelper()


# 加载用户
@login_manager.user_loader
def load_user(user_id):
    from app.models import User
    return User.query.get(int(user_id))


login_manager.session_protection = 'strong'
login_manager.login_view = 'admin.login'
login_manager.login_message = '请登录！'
login_manager.login_message_category = 'warning'
