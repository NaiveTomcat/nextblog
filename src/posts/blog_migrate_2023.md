---
title: 博客的再次迁移
date: 2023-08-10 12:00:00
tag: 
  - 开发
  - 杂项
  - 前端
category:
  - 随笔
---

由于`Vuepress-Theme-Vdoing`仍依赖于`Vuepress 1.x`，而`Vuepress 2.x`已经发布，且原有的博客架构略有混乱，在CF Pages上部署失败。所以我决定把博客再次迁移，这次迁移的目标是`Vuepress 2.x`+`Vuepress-Theme-Hope`。

## 迁移后技术栈

迁移后博客使用`Vuepress 2.x`和`Vuepress-Theme-Hope`的组合，使用`CloudFlare Pages`自动从GitHub仓库部署。评论系统从`Gitalk`转移至`Giscus`。

## 迁移过程

首先新建一个使用`Vuepress-Theme-Hope`的项目，完成新项目的相关配置，然后将原有博客内容复制进新项目，保持原博客设置的`permalink`不变，这样就可以保证原有链接不失效。对于原有的Front Matter等不兼容项使用正则表达式进行相应替换，友链页手动重做。本地验证后部署至CloudFlare Pages。
