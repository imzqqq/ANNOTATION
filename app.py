import codecs
import hashlib
import json
import threading
import time
import os
import argparse
import traceback
import requests
from flask import Flask, render_template, jsonify, send_file
from flask import request
import config as sys_config
import utils.tool as tool

app = Flask(__name__)
app.config.from_object('config')
mu = threading.Lock()  # 创建一个锁


# Route to any template
@app.route('/')
def index():
    names = [name for name in os.listdir(sys_config.SAMPLE_FILE_PATH) \
             if name.split('.')[-1].lower() in sys_config.SAMPLE_TYPE_SET]
    return render_template('index.html', \
                           sample_type=sys_config.SAMPLE_FILE_TYPE)


@app.route('/<template>')
def route_template(template):
    return render_template(template)


# 读取类别标签
@app.route('/api/annotation/labels', methods=['GET'])
def get_labels():
    label_json = tool.get_labels()
    result = dict()
    result['message'] = '保存成功！'
    result['data'] = label_json
    return jsonify(result)


# 读取标注样本图片
@app.route('/api/annotation/sample', methods=['GET'])
def get_sample():
    #对前端返回的request数据处理
    if 'index' in request.args:
        print("---request---", request)
        # img_name需要request里面的index字段的值
        img_name = request.args['index']
        print("---img_name---", img_name)
        img_path = os.path.join(sys_config.SAMPLE_FILE_PATH, img_name)
        print("---img_path---", img_path)
        # Sends the contents of a file to the client.
        return send_file(img_path, mimetype='application/octet-stream',
                         as_attachment=True, attachment_filename=img_name)
    else:
        result = dict()
        result['message'] = 'failure'
        return jsonify(result)


# 标注保存接口
@app.route('/api/annotation/save', methods=['POST'])
def save_annotation():
    tags = request.form['tags']
    tags_new = ''
    for tag in tags.split('\n'):
        if tag == '':
            continue
        values = tag.split(',', maxsplit=1)
        tags_new += values[0] + '.' + sys_config.SAMPLE_FILE_TYPE + ',' + values[1]+'\n'

    path_annotation = 'annotation/annotation.txt'
    try:
        if mu.acquire(True):
            if not os.path.exists(path_annotation):
                file = codecs.open(path_annotation, mode='a+', encoding='utf-8')
                file.close()
            file = codecs.open(path_annotation, mode='a+', encoding='utf-8')
            file.write(tags_new)
            file.close()
            mu.release()
    except Exception as e:
        print(e)
    result = dict()
    result['message'] = '保存成功！'
    return jsonify(result)


# Errors
@app.errorhandler(403)
def not_found_error(error):
    return render_template('page_403.html'), 403


@app.errorhandler(404)
def not_found_error(error):
    return render_template('page_404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    return render_template('page_500.html'), 500


def run():
    app.run(debug=sys_config.DEBUG, host='0.0.0.0', port=sys_config.SERVER_PORT, threaded=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Object detection annotation service.')
    parser.add_argument('--start', action='store_true', help='running background')
    parser.add_argument('--stop', action='store_true', help='shutdown process')
    parser.add_argument('--restart', action='store_true', help='restart process')
    parser.add_argument('--daemon', action='store_true', help='restart process')
    parser.add_argument('--convert2voc', action='store_true', help='restart process')

    FLAGS = parser.parse_args()
    if FLAGS.start:
        if FLAGS.daemon:
            tool.start_daemon_service(run, sys_config.PID_FILE)
        else:
            tool.start_service(run, sys_config.PID_FILE)
    elif FLAGS.stop:
        tool.shutdown_service(sys_config.PID_FILE)
    elif FLAGS.restart:
        tool.shutdown_service(sys_config.PID_FILE)
        if FLAGS.daemon:
            tool.start_daemon_service(run, sys_config.PID_FILE)
        else:
            tool.start_service(run, sys_config.PID_FILE)
    elif FLAGS.convert2voc:
        tool.convert_to_voc2007()