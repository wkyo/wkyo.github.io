---
layout: post
title: 在Flask中使用MongoDB：Flask-MongoEngine
categories: python
tags:
  - python
  - flask-mongoengine
  - mongoengine
  - pymongo
---

在Flask中使用MongoEngine，需要通过Flask-MongoEngine包来对MongoEngine进行配置。Flask-MongoEngine是MongoEngine的Flask封装，针对Flask对MongoEngine做出了一些拓展，而MongoEngine则是在PyMongo的基础上构建的一个类似于SQLAlchemy的对象文档映射器（Object-Document Mapper, ODM），为用户提供基本的数据模型以及类型约束，并对PyMongo的数据查询做了进一步的封装，避免直接书写MongoDB查询语句，简化数据查询。

PyMongo是MongoDB官方提供的Python库，将MongoDB CLI中JS风格的查询语句在Python中进行了封装，用户仍然可以在Python中采用和MongoDB CLI中相同的方法操作MongoDB数据库。但PyMongo本身缺乏类型约束、值校验、数据模型等特性支持，每一次的查询操作都需要直接和字典进行交互。

Flask-MongoEngine对MongoEngine做了以下拓展：

1. 从`MONGODB_XXX`格式变量中读取MongoEngine的配置信息，并自动建立连接。
2. 对MongoEngine的查询`QuerySet`进行了拓展，以支持`get_or_404`，`first_or_404`，`paginate`，`paginate_field`。
3. 支持直接从MongoEngine模型中生成WTForms表单。
4. 支持将MongoEngine作为session存储后端。
5. 为`flask_debugtoolbar`提供MongoEngine查询跟踪。
6. 通过`app.json_encoder`对Flask默认的JSON编码器进行拓展，添加了`BaseDocument`和`QuerySet`两个类型的序列化支持。

# 资源

| Item              | Repository                                       | Documents                                |
| ----------------- | ------------------------------------------------ | ---------------------------------------- |
| MongoEngine       | https://github.com/MongoEngine/mongoengine       | https://mongoengine-odm.readthedocs.io/  |
| Flask-MongoEngine | https://github.com/MongoEngine/flask-mongoengine | https://flask-mongoengine.readthedocs.io |

# 快速开始

```py
from flask import Flask
from flask_mongoengine import MongoEngine

app = Flask(__name__)

# 通过MONGODB_SETTINGS配置MongoEngine
app.config.from_mapping({
    MONGODB_SETTINGS = {
        'db': 'test',
        'host': 'localhost',
        'port': 27017,
        'connect': True,
        'username': 'test',
        'password': '123456',
        'authentication_source': 'admin'
    }
})

# 初始化 MongoEngine
db = MongoEngine(app)

# 定义一个文档 User，MongoEngine 会自动在数据库中创建一个名为 user 的集合
class User(db.Document):
    email = db.StringField(required=True)
    username = db.StringField(required=True, max_length=128, unique=True)

    def __repr__(self):
        return 'User(email="{}", username="{}")'.format(self.username, self.password)

# 创建一个User文档实例并存储
user = User(email="xxx@hotmail.com", username="kikyou", password="123456")
user.save()

# 通过 objects 属性访问集合中的所有文档
# objects 是一个 QuerySet 实例
for user in User.objects[: 5]:
    print(user)

# 通过 username 查找用户，并更新 email
user = User.objects(username='kikyou').first()
user.email = '_kikyou_@kikyou.com'
user.save()
```

# Flask-MongonEngine配置

Flask-MongonEngine通过`MONGODB_XXX`格式的配置变量来配置MongoEngine。其支持通过`MONGODB_SETTINGS`来设置MongoEngine的整个配置，也支持通过`MONGODB_DB`等来直接设置`MONGODB_SETTINGS`下的每个子属性。需要注意的是，**只要设置了`MONGODB_SETTINGS`变量，其余的`MONGODB_XXX`变量将被忽略**。

## 通过MONGODB_SETTINGS配置MongoEngine

MONGODB_SETTINGS变量是一个字典，其对应着mongoengine中connect函数支持的所有关键字。一旦该变量被设置，其他基于MONGODB_XXX格式指定的mongoengine配置信息将被忽略。

```py
MONGODB_SETTINGS = {
    'db': 'appdb',
    'host': 'localhost',
    'port': 27017,
    'connect': True,
    'username': 'test',
    'password': '123456',
}
```

完整的参数列表参考`mongoengine.connection.register_connection`以及`pymongo.mongo_client.MongoClient`。

- `alias` 建立的数据库连接的别名，默认为`default`，通过alias机制可以同时访问多个MongoDB数据库。
- `db` 将要访问的数据库名称，默认为`test`
- `host` MongoDB服务器地址，默认为`localhost`
- `port` MongoDB服务器端口，默认为`27017`
- `username` 用户名
- `password` 用户密码
- `authentication_source` 认证源，创建该用户的数据库
- `authentication_mechanism` 认证机制，不需要设置
- `is_mock` 是否使用 mongomock
- `connect` 是否直接连接服务器，如果为false，则直到第一次操作时才会连接服务器
- `tz_aware` 是否自动识别时区，如果为false，则直接使用本地时间，忽略datetime的时区配置

## 通过MONGODB_XXX配置MongoEngine

除了通过MONGODB_SETTTINGS直接配置connect的参数外，还可以通过MONGODB_XXX的形式直接指定参数的值，其中XXX对应MONGODB_SETTTINGS中关键字的大写形式，但目前只支持有限关键字：

- `MONGODB_ALIAS`
- `MONGODB_DB`
- `MONGODB_HOST`
- `MONGODB_IS_MOCK`
- `MONGODB_PASSWORD`
- `MONGODB_PORT`
- `MONGODB_USERNAME`
- `MONGODB_CONNECT`
- `MONGODB_TZ_AWARE`

## Flask-MongoEngine初始化

除了直接使用`db = MongoEngine(app)`进行初始化外，Flask-MongoEngine也像其他Flask扩展一样支持将定义和初始化分离。

```py
# project_dir/__init__.py

from flask import Flask
from flask_mongoengine import MongoEngine

# 定义 MongoEngine
db = MongoEngine()

def create_app():
    app = Flask(__name__)

    # 通过MONGODB_SETTINGS配置MongoEngine
    app.config.from_mapping({
        MONGODB_SETTINGS = {
            'db': 'test',
            'host': 'localhost',
            'port': 27017,
            'connect': True,
            'username': 'test',
            'password': '123456',
            'authentication_source': 'admin'
        }
    })

    db.init(app)
    import .models

    return app
```

```py
# project_dir/models.py

class User(db.Document):
    email = db.StringField(required=True)
    username = db.StringField(required=True, max_length=128, unique=True)

    def __repr__(self):
        return 'User(email="{}", username="{}")'.format(self.username, self.password)
```

## Flask-MongoEngine QeurySet 扩展

Flask-MongoEngine 对 MongoEngine的查询`QuerySet`进行了拓展，以支持`get_or_404`，`first_or_404`，`paginate`，`paginate_field`。

- `get_or_404` 与`QuerySet.get`类似，如果不存在或有两个及以上的匹配项，则会抛出404异常
- `first_or_404` 与`QuerySet.first`类似，如果不存在，则会抛出404异常
- `paginate` 对QuerySet结果进行分页，接受两个参数：`page`和`per_page`，返回一个Pagination对象。
- `paginate_field(field_name, doc_id, page, per_page, total=None)` 与`paginate`类似，对文档的数组类型字段进行分页。这个方法会首先尝试获取“字段名+count”形式的值，如`posts_count`，作为posts的总数，如果不存在则会获取整个文档，然后计算数组类型字段的长度。**不建议使用！**

```py
paged = User.objects.paginate(page=1, per_page=10)
```

`Pagination`支持的属性包括：

- `total` 文档总数
- `pages` 总页数
- `page` 当前页数
- `has_prev` 是否有前一页
- `has_next` 是否有后一页
- `pre_num` 上一页页码
- `next_num` 下一页页码
- `items` 可迭代文档集合

此外，`Pagination`还支持一个`iter_pages`方法，用于为分页器生成编号，被跳过的页码使用`None`表示。

```py
class Pagination(object):
    ...
    def iter_pages(self, left_edge=2, left_current=2, right_current=5, right_edge=2):
        ...
    ...
```
{% raw  %}
```html
{# Display a page of todos #}
<ul>
    {% for todo in paginated_todos.items %}
        <li>{{ todo.title }}</li>
    {% endfor %}
</ul>

{# Macro for creating navigation links #}
{% macro render_navigation(pagination, endpoint) %}
  <div class=pagination>
  {% for page in pagination.iter_pages() %}
    {% if page %}
      {% if page != pagination.page %}
        <a href="{{ url_for(endpoint, page=page) }}">{{ page }}</a>
      {% else %}
        <strong>{{ page }}</strong>
      {% endif %}
    {% else %}
      <span class=ellipsis>…</span>
    {% endif %}
  {% endfor %}
  </div>
{% endmacro %}

{{ render_navigation(paginated_todos, 'view_todos') }}
```
{% endraw %}

# 额外的拓展

## 为Flask-MongoEngine添加额外的JSON序列化类型支持

Flask-MongoEngine默认为Flask添加了`BaseDocument`和`QuerySet`类型的序列化支持，但对于常见的`ObjectId`以及`Datetime`数据类型缺乏支持。

```py
from flask import Flask
from flask_mongoengine import MongoEngine

def override_json_encoder(app: Flask):
    from bson import ObjectId
    from datetime import date

    superclass = app.json_encoder

    class _JsonEncoder(superclass):
        def default(self, o):
            if isinstance(o, ObjectId):
                return str(o)
            if isinstance(o, date):
                return o.isoformat()
            return superclass.default(self, o)

    app.json_encoder = _JsonEncoder


def create_app()
    app = Flask(__name__)

    # 通过MONGODB_SETTINGS配置MongoEngine
    app.config.from_mapping({
        MONGODB_SETTINGS = {
            'db': 'test',
            'host': 'localhost',
            'port': 27017,
            'connect': True,
            'username': 'test',
            'password': '123456',
            'authentication_source': 'admin'
        }
    })

    override_json_encoder(app)

    db.init(app)
    import .models

    return app
```

注：`datetime`是`date`的子类。

# Q&A

## 编辑器/pylint提示“Instance of 'MongoEngine' has no 'StringField' member”

Flask-MongoEngine在初始化时，为MongoEngine类通过`_include_mongoengine`方法动态注入`mongoengine`和`mongoengine.fields`的所有属性，但pylint在进行静态检测时，无法处理动态注入的属性。

```py
def _include_mongoengine(obj):
    """
    Copy all of the attributes from mongoengine and mongoengine.fields
    onto obj (which should be an instance of the MongoEngine class).
    """
    for module in (mongoengine, mongoengine.fields):
        for attr_name in module.__all__:
            if not hasattr(obj, attr_name):
                setattr(obj, attr_name, getattr(module, attr_name))

                # patch BaseField if available
                _patch_base_field(obj, attr_name)

class MongoEngine(object):
    """Main class used for initialization of Flask-MongoEngine."""

    def __init__(self, app=None, config=None):
        _include_mongoengine(self)
        ...
```

解决方法1：直接通过`mongoengine.fields.XXXField`引用。
```py
import mongoengine.fields as fields
class User(db.Document):
    email = fields.StringField(required=True)
    username = fields.StringField(required=True, max_length=128, unique=True)
    password = fields.StringField(max_length=256)
```

解决方法2：禁用pylint错误报告。

```py
# pylint: disable=no-member
value = db.StringField(max_length=200) # no error
```

> 参考：
> - https://stackoverflow.com/questions/61514739/instance-of-mongoengine-has-no-stringfield-member
> - https://github.com/MongoEngine/flask-mongoengine/blob/a0b0cf80ec321d29baca743e4075101db6be7d68/flask_mongoengine/__init__.py#L100


## 数据库连接提示认证失败（认证数据库未配置）

MongoDB支持在不同的数据库上创建不同的用户，即使这些用户的用户名相同。如果将要访问的数据库与用户所在的数据库不一致，而在连接时只配置将要访问的数据库，没有配置认证数据库，将产生认证错误。

需要通过`MONGODB_SETTINGS`变量配置`authentication_source`参数，指定用户所在的数据库。

```py
MONGODB_SETTINGS = {
    'db': 'appdb',
    'host': 'localhost',
    'port': 27017,
    'connect': True,
    'username': 'test',
    'password': '123456',
    'authentication_source': 'admin'
}
```