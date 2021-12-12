---
layout: post
title: Docker容器访问主机网络——Gitea访问主机MySQL数据库
subject
categories: linux
tags:
  - docker
  - mysql
  - gitea
---

受限于服务器资源限制（轻量化服务的I/O性能和CPU性能都比较低），在使用容器方式搭建 Git 服务（Gitea）时，尽可能避免启动新的服务。因此，直接使用本地已有的 MariaDB (MySQL) 服务 ，而非通过 Docker 再单独创建一个 MySQL 容器不再想使用容器版本的 MySQL 服务。Docker 容器访问主机网络主要有以下2种：
1. 将 docker 网络模式设置为 host，**容器将和主机使用同一网络**，所有端口都会暴露，端口映射相关操作将被忽略。
2. 在容器的 `/etc/hosts` 中添加 Docker 桥接网卡地址，可以通过 docker 的 `--add-host <hostname>:<ip>` 或者 docker-compose 的 `extra_hosts:\n- "host.docker.internal:host-gateway"`

# 环境

```sh
$ docker version
Client: Docker Engine - Community
 Version:           20.10.11
 API version:       1.41
 Go version:        go1.16.9
 Git commit:        dea9396
 Built:             Thu Nov 18 00:37:22 2021
 OS/Arch:           linux/amd64
 Context:           default
 Experimental:      true

Server: Docker Engine - Community
 Engine:
  Version:          20.10.8
  API version:      1.41 (minimum version 1.12)
  Go version:       go1.16.6
  Git commit:       75249d8
  Built:            Fri Jul 30 19:52:10 2021
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          1.4.9
  GitCommit:        e25210fe30a0a703442421b0f60afac609f950a3
 runc:
  Version:          1.0.2
  GitCommit:        v1.0.2-0-g52b36a2
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0

$ docker-compose version
docker-compose version 1.21.0, build unknown
docker-py version: 3.4.1
CPython version: 3.7.3
OpenSSL version: OpenSSL 1.1.1d  10 Sep 2019
```

# 问题

默认情况下，Docker 通过桥接网卡进行网络通信，容器无法直接访问主机的本地网络 `127.0.0.1`。

# 解决方法

## 方法1：（主机网络）通过 host 网络直接访问主机本地 MySQL 服务

在 `docker-compose` 文件中添加 `network_mode: host`，等同于 `docker exec --network host`，将容器连接到主机网络。这种情况下，容器可以直接访问主机的所有网络（当然包括 `127.0.0.1`）。

```yaml
version: "3"

services:
  server:
    hostname: vm-light
    image: gitea/gitea:1.15.7
    container_name: gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=mysql
      - GITEA__database__HOST=localhost:3306
      - GITEA__database__NAME=gitea
      - GITEA__database__USER=gitea
      - GITEA__database__PASSWD=gitea
    restart: always
+   network_mode: host
    volumes:
      - ./gitea:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
```

如果想将 Gitea 的绑定到其他端口则需要修改配置文件`./gitea/gitea/conf/app.ini`。

```ini
[server]
APP_DATA_PATH    = /data/gitea
DOMAIN           = gitea.io
SSH_DOMAIN       = gitea.io:2222
HTTP_ADDR        = 0.0.0.0
HTTP_PORT        = 3000
ROOT_URL         = https://gitea.io/git/
DISABLE_SSH      = false
SSH_PORT         = 2222
SSH_LISTEN_PORT  = 2222
```

**注意：** `gitea 1.15.7` 似乎存在一个Bug，当将ssh端口设置为 `2222` 时，程序仍然会尝试去绑定默认的 `22` 端口，因此最好将主机的ssh端口设为 `2222` 或者 `2221`，`gitea` 使用 `22` 端口。

## 方法2：（桥接网络）在容器HOSTS中添加桥接网卡地址访问主机 MySQL 服务

**该方法需要 `Docker 18.03+` 支持。**

### 容器配置

在 `docker-compose` 文件中添加 `extra_hosts`，配置主机与地址的映射 `host.docker.internal:host-gateway`，其中 `host.docker.internal` 是主机域名可以随便设置；`host-gateway` 表示桥接网卡 `docker0` 的地址，这里也可以直接写IP。这样配置后就可以在容器内容通过 `host.docker.internal` 直接访问主机网络。

**注：**
- `extra_hosts` 在 `docker` 中等价于 `docker --add-host=host.docker.internal:host-gateway`。
- 将 `host-gateway` 替换为 `127.0.0.1` 是无效的，`127.0.0.1` 将指向容器内部。

`docker0` 的地址为 `172.17.0.1`，另外两个 `br-xxx` 和 分别是容器内部使用的桥接网卡。

```
$ ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether 52:54:00:04:bd:71 brd ff:ff:ff:ff:ff:ff
    inet 10.0.4.12/22 brd 10.0.7.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::5054:ff:fe04:bd71/64 scope link
       valid_lft forever preferred_lft forever
3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:fc:f6:10:ec brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
24: br-155e1a817bd3: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:4f:9d:10:70 brd ff:ff:ff:ff:ff:ff
    inet 172.24.0.1/16 brd 172.24.255.255 scope global br-155e1a817bd3
       valid_lft forever preferred_lft forever
    inet6 fe80::42:4fff:fe9d:1070/64 scope link
       valid_lft forever preferred_lft forever
32: br-f001f1212e94: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:e1:26:f8:45 brd ff:ff:ff:ff:ff:ff
    inet 172.26.0.1/16 brd 172.26.255.255 scope global br-f001f1212e94
       valid_lft forever preferred_lft forever
    inet6 fe80::42:e1ff:fe26:f845/64 scope link
       valid_lft forever preferred_lft forever
42: vetha96076a@if41: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master br-f001f1212e94 state UP group default
    link/ether 52:06:c7:24:42:7b brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet6 fe80::5006:c7ff:fe24:427b/64 scope link
       valid_lft forever preferred_lft forever
```

进入容器内部，可以看到 `host.docker.internal` 被解析到了 `172.17.0.1`，并写入了 hosts 文件中。

```
$ docker exec -it gitea /bin/bash

# ping -c 4 host.docker.internal
PING host.docker.internal (172.17.0.1): 56 data bytes
64 bytes from 172.17.0.1: seq=0 ttl=64 time=0.072 ms
64 bytes from 172.17.0.1: seq=1 ttl=64 time=0.072 ms
64 bytes from 172.17.0.1: seq=2 ttl=64 time=0.073 ms
64 bytes from 172.17.0.1: seq=3 ttl=64 time=0.075 ms

--- host.docker.internal ping statistics ---
4 packets transmitted, 4 packets received, 0% packet loss
round-trip min/avg/max = 0.072/0.073/0.075 ms

# route
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         172.26.0.1      0.0.0.0         UG    0      0        0 eth0
172.26.0.0      *               255.255.0.0     U     0      0        0 eth0

# cat /etc/hosts
127.0.0.1       localhost
::1     localhost ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
172.17.0.1      host.docker.internal
172.26.0.2      vm-light
```

完整的YAML配置文件如下所示：

```yaml
version: "3"

networks:
  gitea:
    external: false

services:
  server:
    hostname: vm-light
    image: gitea/gitea:1.15.7
    container_name: gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=mysql
      - GITEA__database__HOST=host.docker.internal:3306
      - GITEA__database__NAME=gitea
      - GITEA__database__USER=gitea
      - GITEA__database__PASSWD=gitea
    restart: always
+   extra_hosts:
+     - "host.docker.internal:host-gateway"
    restart: always
    networks:
      - gitea
    volumes:
      - ./gitea:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "127.0.0.1:3000:3000"
      - "2222:22"
```

### MySQL 与 iptables 配置

#### MySQL 绑定地址

经过上面的配置后，我们的 gitea 服务可以通过桥接网卡 `docker0` 来访问主机网络，但默认情况下的MySQL 只监听 `127.0.0.1`，由于MySQL不支持设置多个 IP 地址，这里需要修改 `/etc/mysql/mariadb.conf.d/50-server.cnf`，将监听地址替换为 `0.0.0.0`（监听所有网络）。

```ini
[mysqld]
bind-address            = 0.0.0.0
```

#### iptables 规则

在远程服务器上，为了安全起见，不应将 MySQL 服务暴露在公网上，因此需要通过 iptables 屏蔽来自外网的所有访问，只允许访问固定网口。这里通过 `iptables` 配置访问控制，只允许应用访问 `127.0.0.1` 和 `172.17.0.1` 两个网口，其余网口将被禁止访问。
```
iptables -A INPUT -p tcp --dport 3306 -d 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 3306 -d 172.17.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 3306 -j DROP
```

**注：** 没有特别注明的情况下，`iptables` 默认使用 `filter` 表。

```
# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination
ACCEPT     tcp  --  anywhere             localhost.localdomain  tcp dpt:mysql
ACCEPT     tcp  --  anywhere             172.17.0.1           tcp dpt:mysql
DROP       tcp  --  anywhere             anywhere             tcp dpt:mysql
```

安装 `iptables-persistent` 来保存新增的规则。

```
# apt install -y iptables-persistent
# iptables-save > /etc/iptables/rules.v4
```

编辑 `rules.v4`，删除其中多余的规则。
```
# Generated by xtables-save v1.8.2 on Sun Dec 12 18:48:11 2021
*filter
-A INPUT -d 127.0.0.1/32 -p tcp -m tcp --dport 3306 -j ACCEPT
-A INPUT -d 172.17.0.1/32 -p tcp -m tcp --dport 3306 -j ACCEPT
-A INPUT -p tcp -m tcp --dport 3306 -j DROP
COMMIT
# Completed on Sun Dec 12 18:48:11 2021
```

在重启后，规则将会自动重建。

# 参考

- [Debian Wiki: iptables](https://wiki.debian.org/iptables)
- [Docker Compose](https://docs.docker.com/compose/compose-file/compose-file-v3/)
- [Blog: Forward a TCP port to another IP or port using NAT with Iptables](https://jensd.be/343/linux/forward-a-tcp-port-to-another-ip-or-port-using-nat-with-iptables)
- [Blog: From inside of a Docker container, how do I connect to the localhost of the machine](https://www.tutorialspoint.com/from-inside-of-a-docker-container-how-do-i-connect-to-the-localhost-of-the-machine)
- [stack overflow: From inside of a Docker container, how do I connect to the localhost of the machine?](https://stackoverflow.com/questions/24319662/from-inside-of-a-docker-container-how-do-i-connect-to-the-localhost-of-the-mach)