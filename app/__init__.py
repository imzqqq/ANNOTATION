# -*- coding: utf-8 -*-
__author__ = '__imzqqq'

import os
import logging
import click
from logging.handlers import RotatingFileHandler
from flask import Flask, render_template, request
from flask_sqlalchemy import get_debug_queries
from flask_wtf.csrf import CSRFError
from app.tool import pretty_date
from app.extensions import db, sitemap, login_manager, migrate, app_helper
from app.config import config
from app.template_filter import register_template_filter
from app.models import AccessLog


basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_CONFIG', 'development')

    """ 使用工厂函数初始化程序实例"""
    app = Flask(__name__)
    app.config['CONFIG_NAME'] = config_name
    app.config.from_object(config[config_name])

    register_logging(app)
    register_extensions(app)
    register_blueprints(app)
    register_commands(app)
    register_errors(app)
    register_shell_context(app)
    register_jiaja2_filters(app)
    register_template_filter(app)
    return app


def register_logging(app):
    class RequestFormatter(logging.Formatter):
        def format(self, record):
            record.url = request.url
            record.remote_addr = request.remote_addr
            return super(RequestFormatter, self).format(record)

    request_formatter = RequestFormatter(
        '[%(asctime)s] %(remote_addr)s requested %(url)s\n'
        '%(levelname)s in %(module)s: %(message)s'
    )

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    file_handler = RotatingFileHandler(os.path.join(
        basedir, 'logs/milab_annotation.log'), maxBytes=10 * 1024 * 1024, backupCount=10)
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)
    if not app.debug:
        app.logger.addHandler(file_handler)


# 注册插件
def register_extensions(app):
    db.init_app(app)
    login_manager.init_app(app)
    sitemap.init_app(app)
    migrate.init_app(app, db=db)
    app_helper.init_app(app)


# 蓝本->模块化开发
def register_blueprints(app):
    # 注册蓝本：main
    from app.main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    # 注册蓝本：admin
    from app.admin import admin as admin_blueprint
    app.register_blueprint(admin_blueprint, url_prefix='/admin')


# 注册上下文
def register_shell_context(app):
    @app.shell_context_processor
    def make_shell_context():
        from app.models import User
        return dict(db=db, User=User, AccessLog=AccessLog)


def register_errors(app):
    pass


def register_jiaja2_filters(app):
    env = app.jinja_env
    env.filters['pretty_date'] = pretty_date 


# 第一次运行或后期迁移时初始化数据库
def register_commands(app):
    @app.cli.command()
    @click.option('--drop', is_flag=True, help='Create after drop.')
    def initdb(drop):
        """Initialize the database."""
        if drop:
            click.confirm(
                'This operation will delete the database, do you want to continue?', abort=True)
            db.drop_all()
            click.echo('Drop tables.')
        db.create_all()
        click.echo('Initialized database.')
