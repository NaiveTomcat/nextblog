---
title: 如何优雅（并不）地将网易云音乐导入至iTunes
date: 2026-05-10 16:45:00
permalink: /pages/50fb0c/
sidebar: false
category:
  - 随笔
  - 杂谈
  - 开发
tag:
  - 杂项
  - 编解码器
---

## 前言

原本我认为，将网易云音乐下载的高品质音乐导入至Music.app是一个很trivial的事情。只需要：

1. 网易云音乐里下载高品质音乐
2. 如果有ncm格式的加密过的文件，用工具把它解密
3. Music.app 文件 - 导入

但是，实际操作发现完全不对劲。

## 我的音乐呢？

按照上面的流程操作之后，Music.app导入了整整0个音乐！

Google一番后，发现Apple Music不支持flac格式。这不是一个技术问题，Finder里都可以直接点击播放的，但是果子就是不想让你导入flac无损音频到iTunes里，想要无损音频只能用m4a容器里的alac codec。

好嘛，`ffmpeg`启动。

```bash
for f in *.flac
  do ffmpeg -i "$f" -c:a alac -c:v copy -map_metadata 0 "${f%.flac}.m4a"
done
```

ffmpeg转换很容易，但是：

## 我的元数据呢？

转换好了，能导入了，然后发现导入进去的音乐完全没有元数据……这下被网易云做局了（x

于是我再次开启搜索模式，最终找到了一个能拉取网易云音乐的元数据的API。虽然这一接口很可能并非为这种用途设计，但我还是花了一下午编写了一个 Python 小脚本。该脚本能够根据文件名自动匹配歌曲信息，从API拉取歌手、专辑、封面及年份等数据，再通过 mutagen 库将所有标签完整写入 m4a 文件。


## 同步歌词？别想！

进一步地，我想要把歌词也附加进去。猜猜发生了什么？Apple Music不支持对本地歌曲显示同步的歌词！只有Apple Music的云端音乐才能有同步歌词，本地音乐只配有静态的。同样的，这也不是技术原因，是逼着你用Apple Music订阅。

