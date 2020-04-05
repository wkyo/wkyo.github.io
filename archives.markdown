---
layout: page
title: Archives
permalink: /archives
---

<div>
    {% assign postsByYear = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
    {% for year in postsByYear %}
    <div>
        <h2 class="text-center">
            <i class="fa fa-leaf"></i>
            {{ year.name }}
        </h2>
        <ul>
            {% for post in year.items %}
            <li>{{ post.date | date: '%m-%d' }} <a href="{{ post.url }}">{{ post.title }}</a></li>
            {% endfor %}
        </ul>
    </div>
    {% endfor %}

</div>