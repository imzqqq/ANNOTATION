# -*- coding: utf-8 -*-
from flask import Blueprint

admin = Blueprint('admin', __name__, template_folder="templates", static_url_path='', static_folder='static')

from . import views, errors
