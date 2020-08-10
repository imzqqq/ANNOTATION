#导入表单基类
from flask_wtf import FlaskForm
#导入需要用到的表格类型
from wtforms import StringField, PasswordField, SubmitField
#导入需要用的验证方式
from wtforms.validators import DataRequired, EqualTo, Length, Email


#用户注册表单
class RegisterForm(FlaskForm):
    userName = StringField(
        label = '用户名',
        validators = [DataRequired()]
    )
    passWord = PasswordField(
        label = '密码',
        validators = [DataRequired(), Length(6, 16, message='密码长度应在6-16位')]
    )
    eMail = StringField(
        label = '邮箱',
        validators = [DataRequired(), Email(message='邮箱不合法')]
    )
    submit = SubmitField(
        label = '注册'
    )


#登录表单
class LoginForm(FlaskForm):
    userName = StringField(
        label = '用户名',
        validators = [
            DataRequired()
        ]
    )
    passWord = PasswordField(
        label = '密码',
        validators = [Length(6, 16, message='密码长度应在6-16位')]
    )
    submit = SubmitField(
        label = '登录'
    )

