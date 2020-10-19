# -*- coding: utf-8 -*-
__author__ = '__imzqqq'

from flask_login import current_user
from flask import url_for, request
import re


def register_template_filter(app):
    '''注册模板过滤器'''
    @app.template_filter('hidden_content')
    def hidden_content(content):
        if current_user.is_authenticated:
            return content.replace('[milab_hidden]', '').replace('[/milab_hidden]', '')
        else:
            login_url = url_for('main.login') + '?next=' + request.path
            repl = '''
            <p class="border border-warning p-2 text-center">
            本文隐藏内容 <a href="{}">登录</a> 后才可以浏览
            </p>
            '''.format(login_url)
            return re.sub('\[milab_hidden\].*?\[/milab_hidden\]', repl, content, flags=re.DOTALL)


if __name__ == '__main__':
    content = '''
    I LOVE MILAB 1
    I LOVE MILAB 2
    I LOVE MILAB 3
    [hidden]
    I LOVE MILAB 4
    I LOVE MILAB 5
    [/hidden]
    '''
    m_tr = re.findall('\[hidden\].*?\[/hidden\]', content, re.DOTALL)
    print(m_tr)
    m_tr = re.sub('\[hidden\].*?\[/hidden\]',\
                  'I LOVE MILAB', content, flags=re.DOTALL)
    print(m_tr)
