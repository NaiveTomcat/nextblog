---
title: 从 Moo Converter 到武汉金读：Epubor 贴牌矩阵调查
date: 2026-09-16 20:00:00
permalink: /pages/3f9c2b/
sidebar: false
category:
  - 开发
tag:
  - 杂项
  - 逆向
  - DRM
  - OSINT
---

::: info AIGC 声明

本文由 AI 辅助生成与整理。文中事实与数据均给出可核验的来源（见文末「参考资料」）。本文不构成法律意见。

:::

## TL;DR

- **Moo Converter 不是独立产品**，而是 Epubor 多品牌贴牌矩阵中的一支；同一套引擎还挂着 `imElfin`、`Sososofty`、`Hisoftmate`。
- 这些品牌共用授权服务器、更新清单与下载基础设施——`jp`/`download.epubor.com`、`moo-dao`、`sososofty`、`hisoftmate` 指向**同一台 Linode 美国 VPS**。
- 官网宣称的离岸主体是香港的 `Innovate Software Limited`（创新软件有限公司，2024 年新设），实际研发在武汉（`武汉金读科技有限公司`，2012 年成立）。
- 安装包**无签名、未公证、以 root 安装**，且安装脚本会**静默删除机器上已有的应用**。
- 结论：**别买**。

## 起因

### 一个太整齐的搜索结果

我本来只是想看看 Readmoo 的 DRM 是怎么实现的。搜索的时候却碰上一件怪事：结果出奇地整齐——翻来覆去就那么一款工具：Moo-Dao 的 **Moo Converter**，而且几乎每篇推荐都在重复同一句话：它是「市面上**唯一一款**」能处理 Readmoo 电子书的软件。

一个小众需求能养活一个「唯一」的商业产品，本身没什么问题。但那种全网口吻一致的推荐，读起来更像 SEO 软文矩阵，而不是用户口碑。我于是留了个心眼。

### 第一个疑点：它是个 pkg，而且没签名

下载下来一看，它不是常见的「`.dmg` 里装一个 `.app`」，而是一个 **`.pkg` 安装包**。这就有点奇怪了——一个电子书转换工具，把 app 拖进 Applications 就完事了，为什么要动用 `.pkg` 这种高权限安装器？

所以我先不装，先验签名和公证。结果很难看：

```text
$ pkgutil --check-signature MDReadmoo.pkg
Package "MDReadmoo.pkg":
   Status: no signature

$ spctl -a -vvv -t install MDReadmoo.pkg
MDReadmoo.pkg: rejected
source=no usable signature

$ codesign -dv "…/MD Moo Converter.app/Contents/MacOS/MDReadmoo"
Signature=adhoc
TeamIdentifier=not set
```

安装包完全没有签名，Gatekeeper 直接拒收；解出来的 app 本体也只有 **ad-hoc 签名**，没有 Developer ID，`TeamIdentifier` 为空，未经过 Apple 公证。而它的安装包 `PackageInfo` 里写着 `auth="root"`——也就是说，装的时候会索要管理员权限。

pkg + root 意味着安装脚本可以干任何事。一个转换工具没有理由这么做。我决定不运行它。

### 先让一个 agent 拆开看看

我让一个 agent 先做静态拆包。它没去碰加密逻辑，却在一个很不起眼的地方停住了——安装脚本里的 `preinstall` 只有一行：

```bash
rm -rf "/Applications/Epubor Endao Converter.app"
```

它删的是一个 **Epubor** 的应用。可 Moo-Dao 的产品，装的时候为什么要去清理 Epubor 的东西？这个对不上的地方，成了整件事真正的起点。

`postinstall` 也值得一提：

```bash
open 'http://www.moo-dao.com/moo-converter-thankyou.html?utm_medium=soft&utm_source=soft&utm_campaign=install&utm_content=MDReadmoo_1.0.1.72_osx'
```

装完自动弹一个带 UTM 追踪参数的推广页。另外，这个包只有 **x86_64** 单架构，在 Apple Silicon 上得靠 Rosetta 跑。

顺带说一句：我特意对整个 `.app` 做了完整性校验，结果这里还藏了第二个问题：

```text
$ spctl -a -vvv "MD Moo Converter.app"
MD Moo Converter.app: a sealed resource is missing or invalid

$ codesign --verify --deep --strict -vvv "MD Moo Converter.app"
… a sealed resource is missing or invalid
file added: …/Contents/MacOS/plugins/epLic.dylib
file added: …/Contents/MacOS/translator/language_cn.qm
```

翻出签名的密封清单 `Contents/_CodeSignature/CodeResources` 核对，里面**根本没有**这两个文件的条目。也就是说，**授权插件 `epLic.dylib` 和中文翻译文件是在签名之后才被塞进 bundle 的**，不受签名保护。

为了排除是我自己解包改坏的，我用 `pkgutil --expand-full` 干净重解了一遍，结果一模一样。再做个对照：把这两个文件删掉，`codesign --verify --deep --strict` 就**通过了**（`valid on disk`、`satisfies its Designated Requirement`），说明 bundle 其余部分签名完好，问题只出在这两个「后加」的文件上；但 `spctl` **仍然 `rejected`**——因为它终究只是 ad-hoc 签名。

所以这里是**两个独立的问题叠在一起**：完整性（签名后被改动）和信任（根本没有可信签名）。

## 调查

### 拆开来看：它其实是个 PyInstaller 程序

继续静态解包（`pkgutil --expand` + `cpio`），应用本体是 **PyInstaller 冻结的 PySide6（Python 3.11）** 程序。解析 PyInstaller 的 PYZ 归档后，它自己的代码其实少得可怜：`main.py`、`readmoo.py`，加上 `common/`、`module/`、`ui/` 三个包。

其中 `common/product.py` 的类结构很说明问题——一个通用的 `Product` 基类，带着 `prefix_path='MD'`、`brand='MD'`，而 `Readmoo` 子类只覆盖了名称、网址、输出路径等寥寥几个字段。这不是一款独立产品的架构，更像**一套引擎按品牌重新配置**出来的东西。

### 三个地址，把它和 Epubor 绑在一起

真正让我确信的，是代码里几处硬编码：

- 授权校验服务器：`http://jp.epubor.com:8079/onlinecheck`
- 版本更新清单：`https://download.epubor.com/software.json`
- 解密产物的密钥目录：`~/.Epubor_Keys`
- 授权插件：`plugins/epLic.dylib`（Windows 是 `epLic.dll`），通过 `CDLL` 加载
- macOS 下用的临时 AppleScript 叫 `epubortmpscript`

`.Epubor_Keys`、`jp.epubor.com`、`download.epubor.com` 这三个，是关键。**一个真正独立自研的产品，没理由把授权、更新、密钥三件事全放在另一个厂商的域名和路径下。**

### 那份更新清单，抖出了整个品牌矩阵

我直接访问了 `https://download.epubor.com/software.json`。这是一份 **Epubor 的全产品更新清单**，而且它不只列 Epubor 自家产品，而是把好几个品牌整条产品线都放在一起。摘几条：

```json
"36803": { "version": "1.0.1.72", "product": "MD Readmoo Converter for Windows",
           "url": "https://download.moo-dao.com/md_moo.exe" },
"36804": { "version": "1.0.1.72", "product": "MD Readmoo Converter for Mac",
           "url": "https://download.moo-dao.com/md_moo.zip" },
"36858": { "version": "1.0.1.23", "product": "MD Hami Mate for Windows",
           "url": "https://download.moo-dao.com/md_hami.exe" },
"36879": { "version": "1.0.1.37", "product": "MD Kobo Mate for Mac",
           "url": "https://www.moo-dao.com/kobo-mate.html" }
```

`36804` 的版本号 `1.0.1.72`，和我从本地包里解出来的客户端版本**一字不差**。一个真正的第三方套壳，不太可能让原厂把它的版本号写进自家更新清单。

同一份清单里，除了 `Epubor` 和 `MD`（Moo-Dao），还冒出了 `imElfin`、`Sososofty`、`Hisoftmate`[^1]。

| 品牌 | 主域名 | 创建时间 | 注册商 | 备注 |
| --- | --- | --- | --- | --- |
| Epubor | epubor.com | 2011-06-18 | GoDaddy | 主品牌 |
| imElfin | imelfin.com | 2013-01-24 | Name.com | 自称 "imElfin Studio" |
| Moo-Dao（MD） | moo-dao.com | 2024-04-01 | Name.com | 面向繁中 / Readmoo 市场 |
| Sososofty | sososofty.com | 2024-11-21 | Name.com | 自称 "Sososofty Software" |
| Hisoftmate | hisoftmate.com | 2025-04-28 | Name.com | 自称 "www.HiSoftmate.com" |

域名注册人信息都开了隐私保护，读不到名字。但有个更硬的线索：除了主站 `epubor.com` 用 GoDaddy，**其余四个品牌全注册在 Name.com，共用同一组解析服务器**。从时间上看，主品牌和 imElfin 是早期布局，而 Moo-Dao、Sososofty、Hisoftmate 都挤在 2024–2025 年冒出来，像是近两年的品牌扩张。

产品线也铺得很开[^2]：电子书（Kindle、Kobo、Nook、Kortext、Storytel、Hoopla、BookWalker……）、有声书与音乐（Audible、Tidal、Deezer、Amazon Music）、杂志（Readly、Zinio、Magzter、Pocketmags……），还有一堆免费小工具。最典型的是，**同一个平台往往同时有 Epubor 版和 MD 版**——`Epubor Kobo Mate` 和 `MD Kobo Mate`、`Epubor ACSM Mate` 和 `MD Adobe PDF & ePUB Converter`。同一套引擎，换张皮，分区域卖。

### 服务器：流量入口藏不住

域名注册人被隐私保护挡住了，但流量入口藏不住。DNS 一查，好几个主机指向同一台机器：

| 主机 | IP | 归属 / 位置 |
| --- | --- | --- |
| jp / download.epubor.com、moo-dao、sososofty、hisoftmate | 45.79.165.199 | Linode（Akamai Connected Cloud），美国新泽西，`li1264-199.members.linode.com` |
| www.epubor.com | 47.90.48.45 | 阿里云，香港 |
| www.imelfin.com | 148.66.143.121 | GoDaddy 主机，新加坡 |

**Epubor 的日本站、下载站，和 Moo-Dao、Sososofty、Hisoftmate 的主站/下载站，共用同一台 Linode 美国 VPS。** 一台小机器同时扛下载和授权入口，主站在阿里云香港，较早的 imElfin 在 GoDaddy 新加坡——规模不大，很符合「小团队、多品牌」的样子[^3]。

### 顺着招聘信息，找到了公司

官网 About 页只给了一个离岸名字[^4]：

> **Innovate Software Limited**
> Easey Commercial Building, 253-261 Hennessy Road, Wan Chai, Hong Kong

官网给的地址在香港湾仔。但顺招聘信息往下查，真正的运营和研发主体其实在国内。BOSS直聘上，「武汉金读科技有限公司」的招聘页[^5]明确写着：

> 作为电子书技术的推进者……海外产品网站: **https://www.epubor.com**

招聘方自己把 `epubor.com` 标成了「海外产品网站」。它的工商信息（综合爱企查、企查查、水滴信用等公开条目）大致是：

| 项目 | 内容 |
| --- | --- |
| 企业名称 | 武汉金读科技有限公司（曾用名：武汉易歌鑫科技有限公司） |
| 成立日期 | 2012-10-11 |
| 法定代表人 | 刘学军（执行董事、经理、财务负责人）；监事：翟珊梅 |
| 注册资本 | 20 万元人民币 |
| 注册地址 | 武汉东湖开发区关山二路特一号国际企业中心 3 幢 304 号 |
| 经营范围 | 计算机软件的研发、外包；网站开发；货物与技术进出口 |

> 以上来自第三方企业信息条目，**建议以国家企业信用信息公示系统（gsxt.gov.cn）为准**。

需要说明的是，客户端里的 conda/Anaconda 构建路径只能说明打包工具链，**与地理位置无关**；满屏的中文注释也只能说明开发者以中文为母语，同样不足以定位到具体地区。真正把线索钉在武汉的，是那个招聘页。

时间线上有个关键信息：香港实体 `Innovate Software Limited`（中文名「创新软件有限公司」，CRN `3467698`，BRN `77220257`）据查册成立于 **2024-10-23**，注册办事处为「香港湾仔轩尼诗道 289-295 号侨光商业大厦 10 楼 B 室」[^6]。而大陆实体「武汉金读科技有限公司」早在 **2012 年**就成立了。也就是说，**内地实体更早，香港壳反而是 2024 年才新设的**——时间点恰好和 Moo-Dao（2024-04）、Sososofty（2024-11）、Hisoftmate（2025-04）这一波新品牌重合，像是为了这轮品牌扩张才补的离岸主体。（第三方查册数据，建议以香港公司注册处为准。）

## 分析

### 技术上，它们本来就是一套东西

把客户端的线索拼起来，同源关系很清楚：应用是 PyInstaller 冻结的 PySide6 程序；业务代码是通用的 `Product` 基类加品牌子类；授权逻辑里定义了一个 `LicenseInfo` 的 C 结构体（`Platform / ProductVersion / ProductId / LicStartDate / LicMonths / LicRegLimitDays / CheckSum`），靠一个原生插件校验——这更像一套**通用的商业授权 SDK**，被多个品牌共用。各品牌产品在 `software.json` 里共享编号体系，只是前缀和下载域名不同。

一句话：这些挂着不同名字的产品，本质上是**同一套引擎与授权系统，在构建期按品牌重新配置**出来的贴牌 SKU。

### 顺带看看它自己的授权

既然拆到了授权逻辑，就多看一眼它**自己的**授权是怎么设计的（只谈设计，不展开任何绕过方法）。

授权校验交给原生插件 `epLic.dylib`（Windows 是 `epLic.dll`）。它没被 strip，导出符号很直白：

```
GetInfo
getLicense(const char*, const char*, sLicenseInfo*)
getUSeconds()
AESEncrypt / AESDecrypt / aes_key_setup
md5_update / sha256_*
```

把调用链逆一下可以看到，它确实在干正事：Python 调用的 `GetInfo` 会转到 `getLicense`，后者依次调用 `base32dec`（解授权码）、`MD5`、`GetCrc32`、`SHA256`、`AESDecrypt`，并用 `gettimeofday` 取时间。也就是说，这是一套真的「解码 + 哈希/校验 + 解密」流程，而不是「写死一个 if」的假校验。当然，调用这些函数不等于校验就一定严密，但至少说明它没有敷衍。

但设计上有几处软肋：

- 在线校验走**明文 HTTP**（`http://jp.epubor.com:8079/onlinecheck`），载荷的 AES 密钥/IV **硬编码在客户端**，而且没有 MAC；
- 黑名单（`blackEmailList` / `blackLicenseCodeList`）直接下发到客户端；
- 试用状态大概率存在本地 config 里，删改即重置。

更关键的是结构：**插件只是一个「校验器」，并不参与解密。** 真正的解密链全在 Python 里，用的是 PyCryptodome。而 Python 这层是 PyInstaller 字节码——可读、可改、可重打包。于是这套授权的强度，本质上取决于「调用方是否保密」，而不是「插件算法够不够强」。

这和前面的 DRM 是同一个死结：**只要校验发生在客户端、又由不保密的代码来调用，它就只能是抬高门槛的减速带，而不是边界。** 真要守得住，要么让插件产出参与解密的密码学材料，要么把校验放到服务端——这两样它都没做。

顺嘴一提，守方（Readmoo）自己的桌面客户端也好不到哪去：那个 Electron 应用把整个项目源码、source map，甚至带真实凭证的 `.env` 一起打包发了出去。攻守双方都困在同一个客户端信任模型里，算是这场猫鼠游戏的一个注脚。

## 结论

### 顺带说说风险

商业模式很清晰：一套 DRM 处理引擎，包装成 `Epubor / imElfin / Moo-Dao / Sososofty / Hisoftmate` 多个品牌，分平台、分区域定价，再配上联盟推广（官网 affiliate 佣金约 30%）[^2]。

对使用者来说，有几点和具体品牌无关、属于这条产品线的共性问题：

- 安装包**无签名**，app 仅 ad-hoc 签名，却以 root 安装；
- 授权校验走**明文 HTTP**，载荷加密用的密钥/IV 还硬编码在客户端里；
- 存在**远端更新通道**，在无签名前提下构成供应链风险；
- 需要读取系统钥匙串里的凭证——这对它的工作是必需的，但也意味着它会接触你机器上的敏感数据；
- 采集机器指纹（Windows `MachineGuid` / macOS `IOPlatformUUID`）用于授权绑定；
- 安装脚本会在你不知情的情况下，**静默删除机器上已有的应用**（`/Applications/Epubor Endao Converter.app`），装完还自动弹推广页。

### 最后

整件事从一个「装的时候顺手删掉 Epubor 应用」的 preinstall 脚本开始，最后牵出一张横跨五个品牌、同一套引擎、共用授权与下载基础设施的贴牌网络：

- 对外品牌：Epubor、imElfin、Moo-Dao、Sososofty、Hisoftmate；
- 离岸主体：Innovate Software Limited（创新软件有限公司，2024 年成立，香港湾仔）；
- 大陆研发实体：武汉金读科技有限公司（2012 年成立，招聘页自述「海外产品网站：epubor.com」）；
- 硬证据：Epubor 官方更新清单、共享 IP、共用授权服务器与密钥目录、通用授权插件、通用 `Product` 代码骨架。

对普通用户来说，最实际的一条其实很简单：**别买。** 这些名字不一样的产品在技术、安全和合规上是一回事，你在其中一款上遇到的隐私或安全问题，多半在另一款上一字不差地存在；更别提它的安装脚本还会在你不注意的时候动你机器上已有的东西。真有需要，更值得自己去分析、或者直接找开源实现——至少那样的代码是可读、可验证的。

## 参考资料

[^1]: 各品牌官网：imElfin https://www.imelfin.com/（[存档](https://web.archive.org/web/20260917030718/https://www.imelfin.com/)）・ Sososofty https://www.sososofty.com/（[存档](https://web.archive.org/web/20260917030624/https://www.sososofty.com/)）・ Hisoftmate https://www.hisoftmate.com/（[存档](https://web.archive.org/web/20250821164933/https://www.hisoftmate.com/)）
[^2]: Epubor 产品页 https://www.epubor.com/softwares.html（[存档](https://web.archive.org/web/20260909183820/https://www.epubor.com/softwares.html)）・ 联盟推广 https://www.epubor.com/affiliate.html（[存档](https://web.archive.org/web/20260917030541/https://www.epubor.com/affiliate.html)）
[^3]: IP 归属查询：https://ipinfo.io/45.79.165.199（[存档](https://web.archive.org/web/20170518092215/http://ipinfo.io/45.79.165.199)）
[^4]: Epubor “About Us”（Innovate Software Limited）：https://www.epubor.com/about-us.html（[存档](https://web.archive.org/web/20260917030016/https://www.epubor.com/about-us.html)）
[^5]: BOSS直聘「武汉金读科技有限公司」招聘页：https://www.zhipin.com/gongsi/cdd953d819bfc30803xz0t67.html（该站屏蔽爬虫，Wayback 无法存档；[本地存档 PDF](/refs/zhipin-wuhan-jindu.pdf)）
[^6]: 86hc.com 香港公司查册：创新软件有限公司 / INNOVATE SOFTWARE LIMITED（CRN 3467698，BRN 77220257，成立 2024-10-23）：https://www.86hc.com/innovate-software-limited（[存档](https://web.archive.org/web/20260917030501/https://www.86hc.com/innovate-software-limited)）

---

*本文基于公开网页、WHOIS/DNS 记录，以及对本地安装包的静态分析整理而成。涉及公司登记信息的部分，请以官方登记机构记录为准。*
