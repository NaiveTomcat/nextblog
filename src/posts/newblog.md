---
title: 博客重启
date: 2021-04-12 00:00:00
tag: 
  - 开发
  - 杂项
  - 前端
permalink: /pages/c26a43/
sidebar: auto
category: 
  - 随笔
---

我之前是有一个blog的，是刚接触GitHub pages和jekyll的时候在GitHub上面部署的。当时
用的by的模板。（还有几个我维护的别的站，例如少年班苏州预科班的网站，里面也用了这个模板）

之后，原来的博客也没有什么可写的，也不知道写什么，总之挂了两三年可能上面只有两三千字吧，
而且GitHub pages也不会被百度收录，也一直没啥流量。（小彩蛋：如果你Google Trimethyldopa
这个东西，你会发现在一堆德语的论文索引页（好像是`ALPHA,BETA,BETA-TRIMETHYLDOPA, A NEW INHIBITOR OF TRYPTOPHAN AND PHENYLALANINE HYDROXYLASE`）中有一个我的站。

最近在大学也有半年了，能写的东西也有了，而且搭一个正经的blog我觉得也挺有必要的。所以，就有了这个站。

还是用的静态网页，最终选择了VuePress作为生成器，Vdoing这个主题。基本上就是吧`vdoing-demo-blog`这个仓库改了改吧

就先这样吧，新的博客，新的开始

## 2021-04-13更新

大概做了个部署脚本，思路大致是先`yarn build`编译出静态文件，然后把静态文件复制到一个git仓库内并commit然后push到上游，ssh到服务器上执行`git pull`同步。主要是服务器的ssh连接好像不是很稳定，所以通过ssh传的数据越少越好。
