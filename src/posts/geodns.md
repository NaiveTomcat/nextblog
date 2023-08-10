---
title: 使用PowerDNS搭建全球分地区DNS解析服务
date: 2023-01-29 23:23:30
permalink: /pages/33420f/
sidebar: auto
category:
  - 随笔
  - 网络
tag:
  - DNS
---

## 介绍

当网络中提供相同服务的服务器分布在不同的地区时，为了提高用户访问速度，需要将用户的请求转发到最近的服务器上。如果不使用开销（资金开销）很大的Anycast技术，就需要一个全球分地区的DNS解析服务，将用户的请求转发到最近的服务器上。

PowerDNS是一个开源的DNS服务器实现，支持权威名称服务器的搭建。配有多种存储后端，如Bind、gmysql等，辅以DNS的AXFR进行Master-Slave同步，可以方便的搭建全球多节点DNS权威服务器。同时配合PowerDNS的Lua Record和geoip后端，可以实现基于请求者IP进行区分的DNS应答。

同时，PowerDNS还有诸如PowerDNS Admin等管理面板，可以实现方便的DNS管理。

## 全球多节点DNS权威服务器搭建

### 安装PowerDNS

PowerDNS的安装较为简便，提供了各大发行版的安装包，可以直接使用包管理器进行安装。需要注意，发行版官方仓库的PowerDNS版本通常较老，建议使用PowerDNS仓库进行安装。具体安装流程可在[这里](https://doc.powerdns.com/authoritative/installation.html)查看。

此处需要安装`pdns-server`、`pdns-backend-geoip`和对应所需的存储后端。

### 安装GeoIP数据库

PowerDNS的geoip后端需要使用GeoIP数据库，建议使用`geoipupdate`进行更新。GeoIP数据库的下载地址为[这里](https://dev.maxmind.com/geoip/geoip2/geolite2/)，需要注册账号后才能下载。

### 配置PowerDNS

在主服务器上配置Master支持：

```
#################################
# master        Act as a master
#
master=yes

#################################
# allow-axfr-ips        Allow zonetransfers only to these subnets
#
allow-axfr-ips=[从机IP]
```

从服务器使用Bind后端。

在从服务器上配置Slave支持：

```
#################################
# slave Act as a slave
#
slave=yes
```

创建和主服务器同步的zone：

```
# named.conf
zone "example.net" {
    file "/var/lib/powerdns/zones.slave.d/example.net.zone";
    type slave;
    masters { 192.0.2.1; [2001:db8::1]; };
};
```

在所有服务器上配置GeoIP后端：

```
launch+=geoip
geoip-database-files=/path/to/GeoLite2-City.mmdb
```

在所有服务器上配置Lua Record：

如对所有DNS Zone启用Lua Record则：

```
#################################
# enable-lua-records    Process LUA records for all zones (metadata overrides this)
#
enable-lua-records=yes
```

否则对指定的DNS Zone修改其metadata启用Lua Record。

## Lua记录设置

### Lua记录基本语法

PowerDNS使用`LUA`作为`record type`标志该条记录为LUA记录。记录的`record data`为：`[TYPE] [Lua Script]`，其中`TYPE`为该条记录的类型，`Lua Script`为LUA脚本。为简化多数情况的脚本编写，PowerDNS默认会在`[Lua Script]`前添加`return`，因此可以仅编写返回的表达式。如果要进行复杂的内容编写可在脚本前方添加`;`来禁用默认的`return`。注意返回的表达式的类型必须为字符串。

### 简单的Lua记录

本例中，我们设置一个`TXT`记录，使`datetime.nteren.net`的`TXT`记录返回请求时间。

使用Lua的`os.date`函数格式化并返回当前时间字符串。

相对应的bind zone file为：

``` bind
datetime        60      LUA     TXT "os.date('!%a %b %d %X %Y UTC')"
```

### 基于请求IP的Lua记录

#### 通过`bestwho`获得请求IP

PowerDNS提供了`bestwho`变量来获取客户的IP地址信息。如果递归解析器使用了EDNS Client Subnet功能，`bestwho`将返回客户端的IP地址，否则返回递归解析器的IP地址。

下面的zone file配置`whoami.nteren.net`的`A`记录返回请求IP的IPv4地址，`AAAA`记录返回请求IP的IPv6地址，`TXT`记录返回请求的地址和端口。

``` bind
whoami  60      LUA     A ";if(bestwho:isIPv4()) then return bestwho:toString() else return '0.0.0.0' end"
whoami  60      LUA     AAAA ";if(bestwho:isIPv6()) then return bestwho:toString() else return '::' end"
whoami  60      LUA     TXT "bestwho:toStringWithPort()"
```

#### 通过GeoIP获得客户端的地理位置

PowerDNS的GeoIP后端为Lua Record提供了查询客户端地理位置的相关函数。`latlon()`返回客户端的经纬度，`latlonloc()`以DNS LOC记录的格式返回客户端位置信息，`continentCode()`返回客户端所在的大陆代码，`countryCode()`返回客户端的国家代码，`regionCode()`返回客户端地区代码的地区部分。

下面的zone file配置`location.nteren.net`的TXT记录返回客户端请求IP和地理位置信息，`whoami.nteren.net`的LOC记录返回客户端的位置信息。

``` bind
location        60      LUA     TXT "bestwho:toString() .. ' ' .. continentCode() .. '-' .. countryCode() .. '-' .. regionCode()"
whoami  60      LUA     LOC "latlonloc()"
```

#### 通过客户端位置进行条件判断

PowerDNS的GeoIP后端同样提供了基于客户端地理位置进行条件判断的相关函数。如：`country('CN')`返回客户端是否来自中国，`region('SN')`返回客户端是否来自陕西省，`continent('AS')`返回客户端是否来自亚洲。类似的，也可以接受由字符串构成的数组，此时当客户位于任何一个区域内即返回`true`。

下面的zone file是一个简单的展示该特性的demo，配置了`test.nteren.net`的TXT记录，当请求来自中国大陆时返回`CN`，否则返回`IDK`。

``` bind
test    60      LUA     TXT ";if(country('CN')) then return 'CN' else return 'IDK' end"
```

#### 基于地理距离优选IP

PowerDNS的GeoIP后端也提供了基于客户端IP和候选IP距离返回最优结果的函数`pickclosest()`。该函数接受一个数组，返回与`bestwho`在地理位置上最接近的地址。

同时，PowerDNS也提供了`ifportup(portnum, addresses[, options])`函数。该函数接受需测试的端口、候选IP地址数组和可选的参数。可选参数中可指定选择器，如`pickclosest`。如果指定了选择器，`ifportup`将返回选择器返回的结果，否则返回随机一个可用的IP地址。

该配置也可结合上述的客户端位置判断特性，实现基于地理位置的负载均衡。下面即为一个简单的配置案例

``` bind
blog.naivetomcat        60      LUA     A ";if country('CN') then return 'ip1' else return ifportup(443, {'ip2', 'ip3', 'ip4'}, {selector='pickclosest'}) end"
blog.naivetomcat        60      LUA     AAAA "if country('CN') return 'ip61' else return ifportup(443, {'ip62', 'ip63', 'ip64'}, {selector='pickclosest'}) end"
```

## 参考资料

更多资料以及PowerDNS Lua Record参考可以在PowerDNS的官方文档中找到。

  * [PowerDNS官方文档](https://doc.powerdns.com)
  * [PowerDNS Lua Record参考](https://doc.powerdns.com/authoritative/lua-records/index.html)
