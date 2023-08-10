---
title: NTEREN北美网络重构
date: 2022-11-12 16:41:15
permalink: /pages/93d7fe/
sidebar: auto
category:
  - 开发
tag:
  - 开发
  - 网络
---

在与[Ayanami Rei IV](https://blog.ayanami-official.net/)达成合作后，我得以将其节点接入NTEREN，并利用这些节点建立NTEREN全球主干网。相应的，NTEREN要向其提供网络基础设施，如IPv6地址，以及网络运维等服务。

作为合作的第一步，目前需要接收其一台San Jose区域的VPS，将其接入NTEREN北美网络，并配置该节点与提供商之间的BGP会话。应要求同步写下这篇文章以作记录。

## 网络结构重构

NTEREN北美网，作为Overlay网络，目前使用Wireguard进行隧道连接。考虑到未来的可扩展性，并且考虑到三层隧道可能带来的问题，本次重构的第一步是将NTEREN北美网迁移至由Zerotier组建的full mesh二层隧道网中。

Zerotier使用官方控制器时，免费套餐允许最多25个节点。以目前可预见的NTEREN网络规模，25个节点应当足够。未来有更多节点需求时再做迁移考虑，可能迁移至自建Zerotier控制器，或其它大二层隧道方案。

此处配置参考Zerotier官方文档即可。节点不需分配IP，后续路由使用基于mac地址产生的IPv6 Link-Local地址进行。

需要注意的是，需要限制Zerotier绑定的IP。不能使Zerotier绑定到网内的IP上，否则会出现路由问题进而导致网络不稳。我限制其绑定在节点的IPv4地址上。

## 动态路由协议重构

原先方案中，每一台单独节点均作为一个Confederation AS实体。现重构为北美网络整体作为一个Confederation AS实体，其中运行全连接的iBGP。在Zerotier组成的大二层隧道中这种方案很容易实现。

同时，Bird的Confederation实现选路时在AS Path中忽略了用于Confederation的AS路径长度。因此在之前的网络结构中，由于高延迟的HKG-LAX隧道，路由路径常常不佳。故本次重构中改用模拟Confederation的方式，仍然使用`425875xxxx`范围的ASN作为Confederation使用，但不在Protocol中激活Bird的Confederation设置，而是在网络对外的Filter中删除路由中`bgp_path`的对应ASN。

## 基于源地址的策略路由

Ayanami Rei IV要求能够同时使用VPS提供商分配的IPv6地址上网。故设置基于源地址的策略路由。

思路为：当源地址为VPS服务商所分配的IPv6地址段内时，匹配一张单独的路由表，内部只有一条默认路由，与VPS服务商下发的相符。

具体设置方法如下：

```bash
ip -6 rule add from 2604:a840:2::/48 table 8 pref 256
ip -6 r add default via 2604:a840:2::1 dev eth0 table 8
```
