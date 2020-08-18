import codecs
import hashlib
import json
import threading
import time
import os
import argparse
import traceback
from flask import Flask, render_template, request, flash, make_response, redirect, url_for, jsonify, send_file
from werkzeug.utils import secure_filename
from PIL import Image
import config as sys_config
import utils.tool as tool

app = Flask(__name__)
app.config.from_object('config')
# 创建一个锁
mu = threading.Lock()  
#允许上传type
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'bmp', 'jpeg', "PNG", "JPG", 'BMP', 'JPEG']) #大写的.JPG是不允许的

#check type
def allowed_file(filename):
    # 圆括号中的1是分割次数
    return '.' in filename and filename.split('.', 1)[1] in ALLOWED_EXTENSIONS 

#upload path和云端保存路径是分开的
UPLOAD_FOLDER = './uploads'

# Route to any template
@app.route('/', methods=['POST', 'GET'])
def index():
    """"目前只支持上传英文名"""
    flag_upload_successed = False
    print("REQUEST METHOD: ", request.method, "\nREQUEST: ", request, "\nREQUEST FILES: ", request.files)
    if request.method == 'POST':
        #获取上传文件
        files = []
        files = request.files.getlist('image_uploads')
        #检查文件对象是否存在且合法
        for file in files:
            if file and allowed_file(file.filename): 
                #把汉字文件名抹掉了，所以下面多一道检查
                # filename = secure_filename(file.filename) 
                filename = file.filename
                if filename != file.filename:
                    flash("file name error!!!")
                    return render_template('index.html')            
                #save
                try:
                    #现在不会出现重复上传同名文件的问题
                    file.save(os.path.join(UPLOAD_FOLDER, filename)) 
                    copy_photo_to_static(filename) 
                except FileNotFoundError:
                    os.mkdir(UPLOAD_FOLDER)
                    file.save(os.path.join(UPLOAD_FOLDER, filename))
                flag_upload_successed = True
            else:
                return 'Upload Failed'
        if flag_upload_successed:
            return redirect(url_for('update', fileName = filename))
    else:
        #GET方法
        return render_template('index.html')

def copy_photo_to_static(filename):
    """每次调用都将上传的图片复制到static/images中"""
    #上传文件夹和static分离
    img = Image.open(os.path.join(UPLOAD_FOLDER, filename))
    img.save(os.path.join('./static/images', filename)) 

@app.route('/upload/<path:fileName>', methods=['GET'])
def update(fileName):
    """输入url加载图片；上传图片，也会重定向到这里"""
    result = dict()
    result['message'] = 'saved successfully'
    return jsonify(result)

@app.route('/<template>')
def route_template(template):
    return render_template(template)

# 读取类别标签
@app.route('/api/annotation/labels', methods=['GET'])
def get_labels():
    #label字典
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
        # img_name需要request里面的index字段的值
        img_name = request.args['index']
        img_path = os.path.join(sys_config.SAMPLE_FILE_PATH, img_name)
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
        #除图片名字之外的都分割到一起
        values = tag.split(',', maxsplit=1)
        tags_new += values[0]  + ',' + values[1]+'\n'

    path_annotation = 'annotation/annotation.txt'
    try:
        # lock
        if mu.acquire(True):
            if not os.path.exists(path_annotation):
                file = codecs.open(path_annotation, mode='a+', encoding='utf-8')
                file.close()
            file = codecs.open(path_annotation, mode='a+', encoding='utf-8')
            file.write(tags_new)
            file.close()
            mu.release()
    except Exception as e:
        print("Exception: ", e, "!!!")
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