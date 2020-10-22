---
layout: post
title: Ubuntu 20.04 在启动界面无限期等待：“a start job is running for hold until boot process finishes”
categories: linux
tags:
  - ubuntu
  - linux
---

在一次更新操作后，进入系统，一直卡在启动动画界面，显式“正在检查磁盘文件系统”。

按方向键（左），进入TTY模式，显示无限期等待。
```
a start job is running for hold until boot process finishes ...
```

此时，出现了两个情况：
1. 按住`CTRL + ALT + F3`进入`TTY3`，然后再按住`CTRL + ALT + F1`切换图像登录界面，系统正常进入`GDM`登录界面。
2. 上述操作后，依旧无法正常进入`GDM`登录界面。强制关闭系统（此时`ALT + PRINT + REISUB`大法也无法正常重启），通过恢复模式进入Ubuntu系统。

猜测可能是系统更新后，GDM配置错误。

打开命令行，键入`dpkg-reconfigure gdm3`，重新配置`GDM`。重启系统，正常进入登录界面。
