---
layout: post
title: Windows下SSH免密钥访问/Git访问Github
categories: windows
tags:
  - windows
  - git
  - ssh
---

由于安全原因，当前Github已禁用基于HTTPS的仓库推送，当前只能通过SSH方式（`git@github.com:<username>/<reponame>.git`）来进行仓库的推送。因此需要将之前的仓库地址进行变更，并配置SSH免密钥访问。

<!--more-->

# 修改远程仓库地址

首先需要将之前的仓库地址由HTTPS修改为GIT
```sh
# 查看当前远程仓库地址
$ git remote -v
origin  https://github.com/wkyo/wkyo.github.io.git (fetch)
origin  https://github.com/wkyo/wkyo.github.io.git (push)

# 修改远程仓库地址
$ git remote set-url origin git@github.com:wkyo/wkyo.github.io.git

$ git remote -v
origin  git@github.com:wkyo/wkyo.github.io.git (fetch)
origin  git@github.com:wkyo/wkyo.github.io.git (push)
```

# 设置SSH密钥

添加 SSH 密钥（需要确保主机的 `ssh-agent` 服务已经启动）
```sh
$ ssh-add ~/.ssh/uniauth
```
注：PowerShell 中也可以使用 `~` 以及 Unix 风格路径。

这里所使用的密钥来自于另一台Linux服务器，由于没有使用默认的密钥名 `id_rsa`，通过`git pull/push` 拉取或推送仓库更新，将会报错。因为 Windows 上的 SSH 客户端默认情况下只会去查找名为 `id_rsa` 的密钥！
```sh
$ git pull
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
RSA key fingerprint is SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8.
This key is not known by any other names
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'github.com' (RSA) to the list of known hosts.
git@github.com: Permission denied (publickey).

Please make sure you have the correct access rights
and the repository exists.
```

在 `~/.ssh/` 目录下新建一个 `config` 文件，添加如下内容。

```ssh_config
Host github.com
IdentityFile C:\Users\wkyo\.ssh\uniauth
```

也可以通过这种方式为不同的主机设置不同的访问密钥。
```ssh_config
Host host2.somewhere.edu
IdentityFile ~/.ssh/old_keys/host2_key

Host host4.somewhere.edu
IdentityFile ~/.ssh/old_keys/host4_key

Host host6.somewhere.edu
IdentityFile ~/.ssh/old_keys/host6_key
```

此时运行 `git pull` 即可正常工作！
```sh
$ git pull     
Enter passphrase for key 'C:\Users\wkyo\.ssh\uniauth':
Already up to date.
```