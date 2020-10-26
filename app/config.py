# -*- coding: UTF-8 -*-
import os
import sys
import hashlib

basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

WIN = sys.platform.startswith('win')
if WIN:
    prefix = 'sqlite:///'
else:
    prefix = 'sqlite:////'


class BaseConfig(object):
    # Flask
    DEBUG = True

    # 日志配置
    LOG_DIR = os.path.join(basedir, 'logs')
    LOG_FORMAT = '%(asctime)s %(levelname)s: %(message)s [in %(module)s.%(funcName)s:%(lineno)d]'
    LOG_LEVEL = 'info'

    if not os.path.exists(LOG_DIR):
        os.mkdir(LOG_DIR)

    # 节点配置
    PID_FILE = 'od-annotation.pid'

    # 标注配置
    SAMPLE_TYPE_SET = ['jpg', 'jpeg', 'png', 'bmp']
    # 样本图片格式
    SAMPLE_FILE_TYPE = 'bmp'
    # 样本图片存放目录
    SAMPLE_FILE_PATH = os.path.join(basedir, 'uploads')


    SECRET_KEY = os.getenv('SECRET_KEY') or hashlib.new(name='md5', string='milab python@#').hexdigest()

    DEBUG_TB_INTERCEPT_REDIRECTS = False

    SQLALCHEMY_TRACK_MODIFICATIONS = True
    SQLALCHEMY_COMMIT_ON_TEARDOWN = True
    SQLALCHEMY_RECORD_QUERIES = True
    SQLALCHEMY_ECHO = True
    SECRET_KEY = '_SDKFJGK_SFDGHKjhbcgSJDFHNKBNBGFJKD'

    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = 465
    MAIL_USE_SSL = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = ('MILAB Admin', MAIL_USERNAME)

    MILAB_TITLE = os.getenv('MILAB_TITLE', 'MILAB')
    MILAB_DOMAIN = os.getenv('MILAB_DOMAIN', 'www.milab.com')
    MILAB_KEYWORDS = os.getenv('MILAB_KEYWORDS', '  ')
    MILAB_DESCRIPTION = os.getenv('MILAB_DESCRIPTION', 'Machine Intelligence Lab')
    MILAB_EMAIL = os.getenv('MILAB_EMAIL')
    MILAB_POST_PER_PAGE = 10
    MILAB_MANAGE_POST_PER_PAGE = 15
    MILAB_COMMENT_PER_PAGE = 15
    MILAB_SLOW_QUERY_THRESHOLD = 1
    MILAB_REGISTER_INVITECODE = True

    MILAB_ANNOTATION_PATH = os.path.join(basedir, 'annotation')

    MILAB_UPLOAD_TYPE = os.getenv('MILAB_UPLOAD_TYPE', '')
    MILAB_UPLOAD_PATH = os.path.join(basedir, 'uploads')
    MILAB_ALLOWED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp']

    MILAB_IMG_SIZE = {'small': 400,
                     'medium': 800}
    MILAB_IMG_SUFFIX = {
        MILAB_IMG_SIZE['small']: '_s', 
        MILAB_IMG_SIZE['medium']: '_m',
    }

    MAX_CONTENT_LENGTH = 32 * 1024 * 1024

    SITEMAP_URL_SCHEME = os.getenv('SITEMAP_URL_SCHEME', 'http')
    SITEMAP_MAX_URL_COUNT = os.getenv('SITEMAP_MAX_URL_COUNT', 100000)


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'mysql://root:MiLab2020@172.17.0.40:3306/MILAB_ANN'


class TestingConfig(BaseConfig):
    TESTING = True
    WTF_CSRF_ENABLED = False
    SQLALCHEMY_DATABASE_URI = 'mysql://root:MiLab2020@172.17.0.40:3306/MILAB_ANN'


class ProductionConfig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = 'mysql://root:MiLab2020@172.17.0.40:3306/MILAB_ANN'


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig
}


if __name__ == "__main__":
    pass
