---
title: 年轻人的第一个公网AS
date: 2021-06-23 00:00:00
tag: 
  - 开发
  - 网络
sidebar: auto
category: 
  - 开发
permalink: /pages/b2dd1e/
---

## 前言

在加入DN42网络后不久，我通过某个契机获赠了一个公网ASN和一块/44的IPv6地址块。但是这段时间事情比较多，六月初录了个节目，录完就接上了期末考试。今天考试结束了，写篇文章总结一下。

## AS相关介绍

AS（Autonomous System，自治系统）是指在互联网中，一个或多个实体管辖下的所有IP网络和路由器的组合，它们对互联网执行共同的路由策略。一个AS会被分配一些IP地址用于其内部互联网节点的连接。AS之间通过边界网关协议（BGP）互联，而BGP区分AS的方式是通过唯一的自治系统编号，即ASN。ASN由IANA成批分配到各大RIR，再由RIR进行下一级的分配，和IP地址类似。

ASN最初是一个16位长的整数，自2007年起，开始分配32位的ASN。

## 如何注册ASN

现在能注册到的ASN基本上都是32位的了，和16位ASN没有本质区别，唯一的区别可能是在老旧的设备上可能不支持32位ASN。ASN是要向RIR（例如APNIC, RIPE NCC之类）申请的。RIR一般会免费给各自的大会员注册ASN，但是会费一般都不菲。因此我们可以找LIR进行代注册。LIR一般是RIR的大会员，缴纳会费，我们只需要提供需要的资料并且向LIR支付一笔注册费就可以了。

只有ASN还是不能在网络上广播IP的，你还需要自己的IP地址。IPv4地址已经基本分配完毕了，而且价格不菲，而IPv6的地址很多，并且较小的地址块（/44-/48的这种）一般都能免费分配，所以我们使用IPv6地址。一般注册ASN的时候也会一并注册一块地址，流程也是按照LIR的要求进行。

一般来说，注册需要提供的就是whois上面的相关信息了。以APNIC为例，如果以个人注册，你需要提供你的姓名、地址、电话、以及邮箱地址，还需要提供一个abuse邮箱和技术联系邮箱，同时还需要一个AS的名字。提交之后过几天ASN就分配下来了，可以使用whois进行查询。分配给我的ASN就是`142280`，whois信息如下：

::: details

```
╭─root@DESKTOP-OVMSE0A ~
╰─# whois AS142280
% [whois.apnic.net]
% Whois data copyright terms    http://www.apnic.net/db/dbcopyright.html

% Information related to 'AS141626 - AS142649'

as-block:       AS141626 - AS142649
descr:          APNIC ASN block
remarks:        These AS numbers are further assigned by APNIC
remarks:        to APNIC members and end-users in the APNIC region
admin-c:        HM20-AP
tech-c:         HM20-AP
mnt-by:         APNIC-HM
mnt-lower:      APNIC-HM
last-modified:  2020-10-21T04:09:48Z
source:         APNIC

role:           APNIC Hostmaster
address:        6 Cordelia Street
address:        South Brisbane
address:        QLD 4101
country:        AU
phone:          +61 7 3858 3100
fax-no:         +61 7 3858 3199
e-mail:         helpdesk@apnic.net
admin-c:        AMS11-AP
tech-c:         AH256-AP
nic-hdl:        HM20-AP
remarks:        Administrator for APNIC
notify:         hostmaster@apnic.net
mnt-by:         MAINT-APNIC-AP
last-modified:  2013-10-23T04:06:51Z
source:         APNIC

% Information related to 'AS142280'

% Abuse contact for 'AS142280' is 'abuse@naivetomcat.cn'

aut-num:        AS142280
as-name:        NTEREN-BACKBONE
descr:          NaiveTomcat Education and Research Experimental Network Backbone
country:        CN
org:            ORG-WLNT1-AP
admin-c:        YD991-AP
tech-c:         YD991-AP
abuse-c:        AN2919-AP
mnt-routes:     MAINT-LSHIY-CN
mnt-by:         APNIC-HM
mnt-irt:        IRT-NAIVETOMCAT-CN
last-modified:  2021-05-20T01:11:25Z
source:         APNIC

irt:            IRT-NAIVETOMCAT-CN
address:        Xi'an Jiaotong University, Xianning Rd, Beilin District, Xi'an, Shaanxi, China
e-mail:         noc@naivetomcat.cn
abuse-mailbox:  abuse@naivetomcat.cn
admin-c:        YD991-AP
tech-c:         YD991-AP
auth:           # Filtered
mnt-by:         MAINT-LSHIY-CN
last-modified:  2021-05-17T04:24:20Z
source:         APNIC

organisation:   ORG-WLNT1-AP
org-name:       LSHIY Network Technology Limited
country:        CN
address:        LSHIY Group, No. 333 Jianshe Avenue, Jianghan District
phone:          +86-27-59762459
fax-no:         +86-27-59762459
e-mail:         noc@lshiy.com
mnt-ref:        APNIC-HM
mnt-by:         APNIC-HM
last-modified:  2021-04-22T12:57:48Z
source:         APNIC

role:           ABUSE NAIVETOMCATCN
address:        Xi'an Jiaotong University, Xianning Rd, Beilin District, Xi'an, Shaanxi, China
country:        ZZ
phone:          +000000000
e-mail:         noc@naivetomcat.cn
admin-c:        YD991-AP
tech-c:         YD991-AP
nic-hdl:        AN2919-AP
remarks:        Generated from irt object IRT-NAIVETOMCAT-CN
abuse-mailbox:  abuse@naivetomcat.cn
mnt-by:         APNIC-ABUSE
last-modified:  2021-05-20T01:11:25Z
source:         APNIC

person:         Yitong Dang
address:        Xi'an Jiaotong University, Xianning Rd, Beilin District, Xi'an, Shaanxi, China
country:        CN
phone:          +86-17782596129
e-mail:         tomdang@naivetomcat.cn
nic-hdl:        YD991-AP
mnt-by:         MAINT-LSHIY-CN
last-modified:  2021-05-17T04:22:57Z
source:         APNIC

% This query was served by the APNIC Whois Service version 1.88.15-SNAPSHOT (WHOIS-AU3)
```

:::

## 如何接入互联网并广播自己的IP

这一步和DN42的步骤就很相似了，但是找到愿意和你peer的公网AS不是一件简单的事。vultr和buyvm支持BGP Session，可以在这两家的VPS上使用自己的IP地址（当然，要用BGP）。具体可以参考这两家的文档，我就不多赘述了。

如果你愿意和我进行Peer，欢迎联系我。目前仅能提供一台洛杉矶的节点进行Peer。
