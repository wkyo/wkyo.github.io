---
layout: page
title: Categories
permalink: /categories
---

<div>
    {% for category in site.categories %}
    {% capture category_name %}{{ category | first }}{% endcapture %}
    <div class="mb-4">
        <h2 class="text-center" id="#{{ category_name | slugify }}">
            <i class="fa fa-folder-open"></i>
            {{ category_name }}
        </h2>
        <ul>
            {% assign posts = category | last %}
            {% for post in posts %}
            <li>{{ post.date | date: '%m-%d' }} <a href="{{ post.url }}">{{ post.title }}</a></li>
            {% endfor %}
        </ul>
    </div>
    {% endfor %}

</div>