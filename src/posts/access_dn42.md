---
title: 加入DN42网络的简明教程
date: 2021-05-17 00:00:00
tag: 
  - 开发
  - 网络
sidebar: auto
category: 
  - 开发
permalink: /pages/9882a3/
---

## DN42是什么

DN42 全称 Decentralized Network 42（42 号去中心网络），是一个大型、去中心化的 VPN 网络。但是与其它传统 VPN 不同的是，DN42 本身不提供 VPN 出口服务，即不提供规避网络审查、流媒体解锁等类似服务。相反，DN42 的目的是模拟一个互联网。它使用了大量在目前互联网骨干上应用的技术（例如 BGP 和递归 DNS），可以很好地模拟一个真实的网络环境。

简而言之，DN42：

  - 不适合单纯想要保护隐私、规避网络审查的用户
  - 不适合在网内消耗大量流量，例如用于解锁流媒体服务的用户
  - 适合想要研究网络技术，练习服务器、路由器等网络设备配置，甚至后续在真实互联网建立 AS 的用户
  - 适合拥有真实 AS，但担心自己配置错误广播出错误路由、干掉半个互联网，希望有个地方测试的用户。

正因为此，使用 DN42 的门槛比较高。就像在真实互联网中一样，你要扮演一个 ISP（互联网服务提供商），注册自己的个人信息，ASN 号码，IPv4 和 IPv6 的地址池，并且使用 BGP 在自己的服务器上广播它们。你还要和其它的用户联系，和他们做 Peering（对接），一步步进入完整的 DN42 网络。

DN42 在 172.20.0.0/14 和 fd00::/8 上运行，而这两个 IP 段都是分配给内网使用的。换句话说，你在 DN42 上怎么折腾，都不会影响到服务器其它的互联网连接。

## 加入DN42网络的前置要求

加入DN42网络需要您有以下的相关能力：

  - 一个长期在线的Linux机器（实体机、虚拟机、VPS甚至路由器都行）
  - 使用Linux的能力，会装包会用编辑器就行
  - 会用Git（会Clone，Pull，Push，Commit就行）
  - 学过计网（其实具有一定相关知识就行，最起码得知道IP、MAC是啥，知道交换机和路由器都是干啥的，会ping/traceroute）
  - 能读得懂英文（或者会用翻译软件）

如果您不具备上述能力，您可能在配置过程中出现问题，给DN42中的其他用户带来麻烦。

## 如何注册DN42的AS

::: tip
DN42的注册过程比较繁琐，可能需要几天（但是没有注册真实的AS那么麻烦），提交信息（发PR）之后可能会被要求修改几次，耐心配合即可。
:::

::: tip
本文信息可能随DN42政策的改变而过时，请优先参考DN42的官方注册流程，此处仅为参考。

[官方Wiki上的注册教程](https://dn42.dev/howto/Getting-Started)
:::

::: tip
请注意更改下面出现的文件中的信息，不要出现这种情况（当事人应该参考的lantian的教程，但是没有改信息，直接白送lantian一个路由）

![wrong_mnt](/img/wrong_mnt.png)
:::

注册流程大致如下：

  - 首先在[官方Wiki](https://git.dn42.dev)上注册一个账户。有关DN42网络的所有信息都在其中的一个仓库内（dn42/registry）
  - 打开[dn42/registry](https://git.dn42.dev/dn42/registry)这个仓库，把它clone下来
  - 新建一个分支，按照`[昵称]-[日期，YYYYMMDD]/[目的]`命名
    - 日期按照什么时区我也不清楚，但肯定不是东八区（我在北京时间2021/05/16 07:00的时候push一个日期字段是20210516的分支被远程拒绝了）
    - 新建完先push到远端，注册后需要等一段时间并在网页上登出后再次登录才有registry仓库的写权限，如果权限没下来，这时就能发现问题）
  - 在clone下来的仓库内，您新建的分支中建立以下文件：
    - `data/mntner/[昵称]-MNT`，这个文件代表您的账户
      - 官方提供的一系列检查/格式化的工具都是基于mntner筛选文件的
      - 文件内容如下：
        ```
        mntner:             [昵称]-MNT
        admin-c:            [昵称]-DN42
        tech-c:             [昵称]-DN42
        mnt-by:             [昵称]-MNT
        source:             DN42
        auth:               pgp-fingerprint 您的40字符的PGP公钥
        remarks:            注释
        ```
      - 各项含义如下
        - `mntner`即Maintainer（维护者），说明这个账户的名称，与文件名相同
        - `admin-c`即admin contact（管理员联系信息），指向后续创建的`person`对象
        - `tech-c`即tech contact（技术员联系信息），也需要指向后续创建的`person`对象
        - `mnt-by`即maintain by（由谁维护），指向这个账户本身
        - `source`固定为`DN42`
        - `auth`为您的个人认证信息，接受两种类型：GPG公钥和SSH公钥
          - 您必须至少选择一种（我推荐GPG公钥，因为签名和认证都方便）
          - 您还需要将您的GPG公钥上传至公开查询服务器，可以参考[阮一峰的这个教程](https://www.ruanyifeng.com/blog/2013/07/gpg.html)
          - 最好可以再上传到官方的git服务器上与您的账户绑定
          - 阅读官方的[身份认证Wiki页面](https://dn42.dev/howto/Registry-Authentication)获取更多信息
        - `remarks`为注释，可选，可出现多次
      - 注意，您填写的位置从第21列开始。中间的空格不能省略或用制表符替换。
        - 格式问题可通过`fmt-my-stuff`这个脚本进行修复
    - `data/person/[昵称]-DN42`
      - 代表个人联系信息
      - 文件内容如下
        ```
        person:             您的昵称
        contact:            您的联系方式（一般为邮箱）
        nic-hdl:            [昵称]-DN42
        mnt-by:             [昵称]-MNT
        source:             DN42
        ```
    - 接下来您需要选择一个未被占用的AS编号，即ASN。DN42在私有ASN范围内选取了一块用作其内部AS的ASN，您可以在`4242420000`-`4242423999`这4000个ASN中选取未被占用的，**注意范围是4000个不是10000个**，然后创建 `/data/aut-num/[您选的ASN]`
      - 文件内容如下
        ```
        aut-num:            AS号，以AS开头后面接10位数字
        as-name:            AS名称，随便写
        descr:              AS简介，随便写
        remarks:            AS注释，随便写，可以没有
        admin-c:            参考上面的同名内容
        tech-c:             参考上面的同名内容
        mnt-by:             参考上面的同名内容
        source:             DN42
        ```
    - 接下来就需要选择IP并建立`data/inetnum/[IP块CIDR,将/换成_]`
      - 选择`172.20.0.0/14`范围内未被占用的IP段。注意：您在DN42中最小能够申请/29的块，一般建议申请/27，能够直接申请的最大地址块是/26
      - DN42 内的 IPv4 地址与公网的 IPv4 地址同样珍贵
      - 如果您要接入的设备**非常多（指超过62台）**，那么/26是不够用的，你需要去IRC频道（可以在Wiki上找到）或邮件组告诉大家您的理由，请求投票同意
      - 文件内容如下
        ```
        inetnum:            IP段第一个地址 - IP段最后一个地址 （注意不是第一个/最后一个可用地址）
        netname:            地址块名称，没啥用，随便取
        remarks:            注释，随便写，可以没有
        descr:              简介，随便写
        country:            国家代号，中国大陆就是CN
        admin-c:            参考上面的同名内容
        tech-c:             参考上面的同名内容
        mnt-by:             参考上面的同名内容
        nserver:            DNS反查服务器的FQDN。如果您不知道这个是什么或暂时不需要可以去掉（建议先不要填，配好网注册完域名配好权威DNS服务器之后再加）
        status:             ASSIGNED
        cidr:               IP段的CIDR
        source:             DN42
        ```
    - 还需要给您的IP地址块建立路由对象`data/route/[IP块CIDR,将/换成_]`
      - 表示授权某个AS使用这个地址段使用这个地址段
      - 文件内容如下
        ```
        route:              地址块CIDR
        descr:              简介，随便写
        origin:             您的ASN
        mnt-by:             参考上面的同名内容
        source:             DN42
        ```
    - 鉴于现在是2021年，建议您再在`/data/inet6num/`和`/data/route6/`文件夹内建立IPv6地址块的相关文件，内容参考上面IPv4的相关文件
      - IPv6地址在`fd00::/8`内
      - DN42内IPv6地址块一般以/48存在，一般一个AS只允许注册一个/48
      - 非常不建议自定义IPv6地址前缀
        - 首先这个做法是违反RFC4193 section 3.2的
        - 其次，DN42和一些类似性质的网络建立了互联关系，因为拿不到这些网络的registry信息，并且都用的是IPv6 ULA地址（即`fd00::8`），您自己选的前缀可能会和别人的冲突
        - 注意：一旦和别人冲突，您（也就是后注册的）可能需要修改整个网络的IPv6地址
          - > Renumbering really isn't fun
  - 现在，您建立完了所有需要的文件，首先在仓库根目录运行`./fmt-my-stuff 你的mntner名字`格式化您的所有文件
  - 然后`git add .`和`git commit -S`来签名commit您的更改
  - 如果您已经commit了多次，注意DN42的PR只接受单个commit，所以需要运行`./squash-my-commits -S`来扁平化您的commit
  - 执行`git push -f`将更改推送至服务器，然后去网页上创建PR
    - 一次注册/信息修改只用发一个PR
    - 如果被要求修改，改完并squash了之后直接`git push -f`就行，**不用关闭并开新的PR**
    - 发PR用英文（但是最近有位国人成为了维护者，如果您实在不懂英文您也可以用中文回复，但是不推荐，因为外国人看不懂）

在您的PR被合并之后，您就拥有了自己的AS和地址块，接下来就可以去找人Peer了

## 如何与别人Peer

### 寻找Peer的节点

DN42是一个去中心化的网络，因此并没有一个中央路由可以让你直接接入，相反，你需要寻找其他DN42上的节点，建立隧道连接和BGP会话，从而建立Peering关系

您可以

 - 使用[DN42 Peerfinder](https://dn42.us/peers)
 - 直接去DN42的[IRC频道](https://wiki.dn42.us/services/IRC)
 - 去这个[非官方的tg群](https://t.me/Dn42Chat)

找人peer，或者直接[找我](/dn42/)

注意，您可以（并且建议）找多人进行peer，以降低网络中心度增加网络稳定性。

找几个离你节点近延迟小的节点（国内节点就找国内的就行了，不强求延迟了:rofl:），然后看下面

### 重要的系统配置

根据DN42 Wiki:

> The first rule of dn42: Always disable `rp_filter`.
>
> The second rule of dn42: Always disable `rp_filter`.
>
> The third rule of dn42: Allow ip forwarding!

**一定关掉`rp_filter`并开启IP forwarding**，具体执行下面的代码：

``` sh
echo "net.ipv4.conf.default.rp_filter=2" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.rp_filter=2" >> /etc/sysctl.conf
sysctl -p
```

``` sh
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
echo "net.ipv6.conf.default.forwarding=1" >> /etc/sysctl.conf
echo "net.ipv6.conf.all.forwarding=1" >> /etc/sysctl.conf
sysctl -p
```

然后**一定**关掉UFW之类的自动配置iptables的东西，以免出现玄学问题

### 选择隧道软件

节点之间一般是没有网线直接拉上的，所以互联基本上就要依靠隧道了。现在DN42社区一般喜欢使用WireGuard和OpenVPN，我也倾向于使用WireGuard。

WireGuard一般配置点对点连接，配置很简单，资源占用少，安全性也不错，但是需要内核模块支持。我一般是这么配置WireGuard隧道的：

``` toml
[Interface]
Address = 我的IPv6 Link-local地址
PrivateKey = 我的私钥
ListenPort = 我的监听端口，一般为对端AS的后5位
Table = off # 一定要加
PostUp = /bin/ip addr add 我的DN42 v4地址 peer 对端的DN42 v4地址 dev %i 

[Peer]
PublicKey = 对面的公钥
Endpoint = 对方提供的endpoint
AllowedIPs = 0.0.0.0/0,::/0
```

然后直接用`wg-quick`启动隧道就建立了互联。

注意一定要加`Table = off`，否则`wg-quick`会给`AllowedIPs`加上路由，鉴于它是0.0.0.0，意味着你把所有的流量都路由给了对端，而对端大概率不会给你转发，然后你的网就炸掉了。往外连的路由表应该用BGP管理，所以这里不需要帮你添加

### 选择BGP软件

我也只用过Bird，而且DN42 Wiki上面也有Bird的配置文件可以直接抄，所以我推荐Bird。

当然，还有别的可以用，但是我没用过，不做推荐

注意：现在Ubuntu的官方仓库中的Bird2是2.0.7版本的，但是Bird官方的ppa上面已经发布了2.0.8的deb包。我推荐2.0.8，因为加入了extended multi hop的支持。

### 内网配置

我建议用wg等隧道软件在每两个节点之间建立一条点对点隧道，即每个节点都能直接连接到其余所有节点，配静态路由。有不需要跑BGP的叶子节点（比如不做peer的家里路由器）的时候，只需把给它的IP的路由设到它的上游节点就行了。OSPF没配懂（而且容易出锅），所以不做说明。

### 进行Peer

BGP软件配好了，内网也配好了，现在就可以开始做Peer了。（当然，你应该先测测内网通不通）

#### 隧道搭建

按照我上面的配置，配好WG连接就行了。注意最好加上`PersistentKeepalive = true`，以进行UDP保活。（注意开防火墙端口）

#### BGP会话配置

一般来说照着DN42 Wiki上的教程抄就行了。根据需要加上`extended next hop`的支持。现在一般喜欢MP-BGP over link-local，双方商量好就行。

可以去[非官方的tg群](https://t.me/Dn42Chat)寻求帮助。

## 接入完成

完成上述操作之后，您就成功的接入了DN42网络。您可以~~开始愉快的Ping了~~（其实DN42里面也有不少服务的）。您可以接着申请域名、搭建权威DNS服务器和DNS反查服务器，在DN42里面搭建博客或者整活了:thinking:![膜](/img/mo.png)

完。
