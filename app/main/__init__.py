# -*- coding: utf-8 -*-
__author__ = '__imzqqq'

from flask import Blueprint

main = Blueprint('main', __name__, template_folder="templates/main", \
                 static_url_path='', static_folder='static')

from . import views, errors