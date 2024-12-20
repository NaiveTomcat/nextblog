---
title: 类原生系统上的Mifare Classic UID模拟
date: 2024-12-21 00:40:00
permalink: /pages/9a7f60/
sidebar: auto
category:
  - 开发
tag:
  - NFC
  - Android
---

## 前言

最近更新了手机，由OnePlus Ace换成了Ace3，并且在收货后立刻刷入了`PixelOS`。在刷入过程中虽遇到了一些问题（见[这里及之后几条](https://t.me/neko_rei/210)，但最终成功刷入。使用过程中发现，类原生系统并无国产OEM系统的门禁卡模拟（即Mifare Classic卡的UID模拟）功能。本文记录了我在类原生系统上实现Mifare Classic卡UID模拟的过程。

## 基础知识

### Mifare Classic卡

Mifare Classic卡是一种常见的非接触式IC卡，遵循ISO 14443标准，由NXP公司生产。其最大特点是卡片的UID（卡片唯一标识符）是固定且不可更改的。根据此，许多门禁系统使用卡片的UID作为卡片的唯一标识，因此门禁卡模拟的基本原理即是模拟卡片的UID。

### Android NFC栈

Android系统支持NFC功能。对于本次的需求，我们主要关注Android NFC栈对于ISO 14443标准的支持。

自Android 4.4（API 19）起，Android系统提供了`Host Card Emulation`系列API支持`Nfc-A (ISO/IEC 14443 type A)`协议的卡模拟。但是，该功能的预期使用场景是通过该协议交换数据，且协议规定了HCE设备预期返回随机的UID。因此，我们无法通过HCE实现Mifare Classic卡的UID模拟。

然而Android系统的NFC栈底层仍然基于`libnfc-nxp`。因此获取root权限后，我们可以直接修改其配置文件实现Mifare Classic卡UID模拟。

## 实现过程

### 依赖条件

- 具有Root权限的Android设备
- 设备的`/vendor/etc/libnfc-nxp.conf`文件可读写

### 实现步骤

获取Root权限后，修改`/vendor/etc/libnfc-nxp.conf`文件。具体修改内容如下：

- `NXP_CORE_CONF`
- `NXP_NFC_PROFILE_EXTN`

具体修改内容为，修改`NXP_CORE_CONF`中的`0x33, 0x00`指令为相对应的设置UID的指令。根据官方文档，对于四字节UID`AB:CD:EF:01`，设置指令为`0x33, 0x04, 0xAB, 0xCD, 0xEF, 0x01`；同时将上述指令追加至`NXP_NFC_PROFILE_EXTN`中。

修改完成后重启NFC服务，即可模拟写入的UID。

为方便模拟，参考了[此项目](https://github.com/qwe321qwe321qwe321/NFC-UID-Emulator)及其修正了高版本Android权限问题的[Fork](https://github.com/yikza/NFC-UID-Emulator)，并在其基础上进行了一些修改，见[此处](https://github.com/NaiveTomcat/NFC-UID-Emulator)。得到了较为方便的图形化的可以保存多张卡的UID模拟工具。
