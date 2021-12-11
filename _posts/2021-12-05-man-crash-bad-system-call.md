---
layout: post
title: Debian 10 下 man 异常退出“exited with status 159”，提示“bad system call”
categories: Linux
tags:
  - linux
---

Debian 10 下 `man` （man 2.8.5） 命令异常退出（status 159），提示 `preconv: Bad system call`。

# 环境

```sh
$ uname -a
Linux VM-4-12-debian 4.19.0-11-amd64 #1 SMP Debian 4.19.146-1 (2020-09-17) x86_64 GNU/Linux

$ lsb_release -a
Distributor ID: Debian
Description:    Debian GNU/Linux 10 (buster)
Release:        10
Codename:       buster

$ man --version
man 2.8.5
```

# 问题

执行`man ls`命令发生异常，提示：
```
man: preconv: Bad system call
man: tbl: Bad system call
man: nroff: Bad system call

man: command exited with status 159: (cd /usr/share/man && /usr/lib/man-db/zsoelim) | (cd /usr/share/man && /usr/lib/man-db/manconv -f UTF-8:ISO-8859-1 -t UTF-8//IGNORE) | (cd /usr/share/man && preconv -e UTF-8) | (cd /usr/share/man && tbl) | (cd /usr/share/man && nroff -mandoc -rLL=143n -rLT=143n -Tutf8)
```

# 解决方法

执行man命令前，添加 `MAN_DISABLE_SECCOMP=1`
```sh
$ MAN_DISABLE_SECCOMP=1 man man
```

如果想避免每次都输入`MAN_DISABLE_SECCOMP=1`，可以在`~/.bashrc`中添加全局变量。
```sh
$ export MAN_DISABLE_SECCOMP=1 
```

# 原因

`man 2.8` 与 Linux 的 SECCOMP 机制有冲突。

# 参考

- FS#57557 - `[man-db]` man: tbl: Bad system call (core dumped) https://bugs.archlinux.org/task/57557
- https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=889608
- https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=890861
- linux man手册返回错误 man: command exited with status 159 https://blog.csdn.net/weilin731/article/details/120646356
- Man doesn't work on Ubuntu 18.04 https://askubuntu.com/questions/1228660/man-doesnt-work-on-ubuntu-18-04
