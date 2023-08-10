---
title: 机械革命Umi Pro 3的Linux EC踩坑记录
date: 2021-07-30 14:00:00
tag: 
  - 开发
  - 系统
  - 笔记本
sidebar: auto
category: 
  - 开发
permalink: /pages/0214cf/
---

## 前言

突然发现已经有一个月没更博客了 ~~（虽然说这大概是正常频率）~~ ，最近把Windows升到了最新的内部预览版本`22000.100`，有了`wslg`的支持（虽然看起来`wslg`默认用户`uid`是`1000`，导致`dbus`出了亿点点问题，好多程序跑不起来……），据说也支持挂载硬盘进去了。我就想这对于双系统十分利好，主要在文件共享方面。同时D盘也快满了，于是就将D盘挪到一整块1t的固态上去，腾出来的地方装了一个Arch Linux，没想到遇到了非常多的问题……

## 安装

既然说到安装`Linux`之后的问题，那首先就要说说安装的时候遇到的问题了:thinking:。装的时候没有用`archinstall`，照着`archwiki`上的步骤一步一步装就行了（这次我记住在Live CD里安网络管理包了:rofl:，上次装arch的时候又重新进Live CD专门为解决无线的问题），装完基本包之后重启进tty，内存CPU硬盘都能认出来，`GRUB`也没出锅，开始配置图形界面。

桌面环境我选择了`KDE Plasma`这一套，主要还是出于个人习惯：曾经在`Gnome`和`KDE Plasma`中间左右横跳，最后还是觉得`KDE Plasma`用起来更舒服（除了`dolphin`），于是这次就直接装`plasma`软件包组了。装完之后，按照惯例，自然就装上`sddm`作为显示管理器了。然后，创建一般用户，设置`sudoer`文件，命令行输入`sddm`，然后就翻车了……`sddm`正常启动，然后输入密码登录之后就黑屏卡住了……不知道什么原因，`systemctl enable sddm.service --now`就*看似*解决了这个问题。

进桌面环境之后，照例配主题配UI之类的不提，然后就是<ruby>喜闻乐见<rt><rp>（</rp>非常离谱<rp>）</rp></rt></ruby>的安驱动（Nvidia驱动）环节。安好`nvidia`、`cuda`、`cudnn`之后，运行`nvidia-xconfig`命令，重启之后**甚至sddm都出不来……**无奈只能切到新的tty上恢复`/etc/X11/xorg.conf`到之前的状态。笔记本的可见光摄像头和红外摄像头居然都不需要驱动，用vlc找到设备路径 ~~并欣赏了IR摄像头拍出的奇妙画面~~ 之后，从AUR上安装`howdy`并配置好pam，就可以使用人脸识别登录、解锁和授权`sudo`了。打开系统监视器，粗略看看CPU频率，基本都在4GHz以上，安装过程（大概）就结束了。

## 暗坑

还记得上面说的“打开系统监视器，粗略看看CPU频率，基本都在4GHz以上”吗？第一个暗坑就在这里。后面的使用中发现，CPU在较重负载上只能做到全核2.4GHz的频率（不过也比标称的2.3GHz高一点就是了:rofl:）。根据散热风扇噪声大小，我判断风扇并没有全速运转（多线程编译内核的时候声音甚至比在Windows下面日常插电使用的声音还小），于是就怀疑风扇控制的问题（这是第二个暗坑，我还没爬出来:upside_down_face:）。不过传感器报的封装温度和最高核心温度都只在60℃上下，我就倍感奇怪。于是我怀疑供电选择的问题，因为Windows里面从电池供电的时候笔记本的行为和这里非常接近。通过acpi相关工具，引出了第三个坑：这个本子（至少）在Linux里面的ACPI支持有大问题：Thermal Zone温度和散热风扇居然都没有出现在acpi设备里面……想要改这些东西，就只能找野办法了。

第一个暗坑比较好解决，BIOS里面有个`Turbo Mode`的选项，需要选上。以及笔记本的“造物者模式”按钮似乎也有这样的效果。但是后面的暗坑就比较难处理了。

在笔记本设备上，有个东西叫做EC：Embedded Controller。这个东西一般就是个单片机，控制主板上一大堆东西，包括电源控制、散热控制等。一般来说EC都是能给它控制的功能暴露一个ACPI接口给上层OS的，但是这个主板不太一样，暴露给上层的ACPI接口非常少，用`acpi -V`能看到的信息只有这些：

:::details
```
Battery 0: Full, 100%
Battery 0: design capacity 4100 mAh, last full capacity 3900 mAh = 95%
Adapter 0: on-line
Thermal 0: ok, 56.0 degrees C
Thermal 0: trip point 0 switches to mode critical at temperature 100.0 degrees C
Thermal 1: ok, 56.0 degrees C
Thermal 1: trip point 0 switches to mode critical at temperature 100.0 degrees C
Cooling 0: Processor 0 of 3
Cooling 1: iwlwifi_1 no state information available
Cooling 2: Processor 0 of 3
Cooling 3: Processor 0 of 3
Cooling 4: TCC Offset 5 of 63
Cooling 5: Processor 0 of 3
Cooling 6: Processor 0 of 3
Cooling 7: Processor 0 of 3
Cooling 8: Processor 0 of 3
Cooling 9: Processor 0 of 3
Cooling 10: Processor 0 of 3
Cooling 11: x86_pkg_temp no state information available
Cooling 12: Processor 0 of 3
Cooling 13: Processor 0 of 3
Cooling 14: intel_powerclamp no state information available
Cooling 15: Processor 0 of 3
Cooling 16: Processor 0 of 3
Cooling 17: Processor 0 of 3
Cooling 18: Processor 0 of 3
Cooling 19: pch_cometlake no state information available
Cooling 20: Processor 0 of 3
```
:::

所以要想人工控制EC，可行的方法只有直接读写EC的寄存器了（非常野的方法）。然而到现在为止，我并没有找出EC寄存器和实际功能的对应关系（这个官方那里估计会有，但是能不能要到就非常不好说了），因此在这里提出一点个人的思路，希望能抛砖引玉。

### 整体思路

由于EC也属于ACPI系统的一部分，并且在Linux系统中可以通过`/sys/kernel/debug/ec/`下的“文件”访问到EC的寄存器，因此主要有两条路可以走：

1. 反编译DSDT和SSDT表，获取寄存器地址和名称的对应关系，再通过实际的控制逻辑判断寄存器的实际用途
  
  > 由于DSDT和SSDT表中符号名称只能有4个字符，因此可读性较差。

2. 通过`nbfc`提供的EC寄存器相关工具监视寄存器值的变化，同时通过其余手段使要找的寄存器的值发生变化（例如给以高负载使CPU升温使风扇转速变化），缩小可疑范围后尝试写对应寄存器地址观察有无实际效果

  > 经常有不止一组寄存器会变化，因此需要不停试错，同时写EC寄存器有一定风险

综上，最佳方案使两条路一起走，相互佐证：

- 通过上述第二种方案找出可疑的寄存器，再从反编译的DSDT描述文件中寻找对应地址的实际用途

- 通过上述第一种方案找出的寄存器，可以通过第二种方案进行排除

### 实际操作

按照上面的思路，我提取了DSDT和SSDT表，进行了反编译，并且找到了一些可疑的寄存器。然而，我在这里遇到了问题：风扇转速改变时，有`0x3E` `0x49` `0x4C` `0x4F` `0x60` `0x61` `0x64` `0x65` `0x6C` `0x6D`十个寄存器的值都在变化。从反编译的DSDT描述文件中，仅找到了`0x3E`寄存器的意义为`ThermalZone Temp`，其余寄存器地址在描述文件中均**没有**指定。相关区域代码如下所示：

:::details 寄存器定义
``` asl
OperationRegion (ECXP, EmbeddedControl, Zero, 0xFF)
            Field (ECXP, ByteAcc, Lock, Preserve)
            {
                XIF0,   16, 
                XIF1,   16, 
                XIF2,   16, 
                XIF3,   16, 
                XIF4,   16, 
                XIF5,   16, 
                XIF6,   16, 
                XIF7,   16, 
                XIF8,   16, 
                XIF9,   64, 
                XIFA,   64, 
                XIFB,   64, 
                XIFC,   64, 
                XST0,   16, 
                XST1,   16, 
                XST2,   16, 
                XST3,   16, 
                XTP0,   16, 
                XCIN,   1, 
                    ,   1, 
                XTIN,   1, 
                Offset (0x3D), 
                BLLV,   8, 
                XHPP,   7, 
                Offset (0x3F), 
                Offset (0x40), 
                XSEC,   8, 
                XLPT,   8, 
                    ,   3, 
                Q70D,   1, 
                Q70M,   1, 
                Offset (0x43), 
                XBRL,   3, 
                    ,   4, 
                XBKL,   1, 
                Offset (0x56), 
                VGTP,   1, 
                    ,   4, 
                BLSC,   1, 
                MDTP,   2, 
                Offset (0x58), 
                    ,   7, 
                EIST,   1, 
                Offset (0x5A), 
                DEXS,   8, 
                XSLT,   1, 
                    ,   2, 
                GC6I,   1, 
                GPST,   1, 
                Offset (0x5C), 
                Offset (0x63), 
                TCOS,   8, 
                Offset (0x66), 
                TURB,   8, 
                Offset (0x6A), 
                PL1L,   8, 
                PL2L,   8, 
                Offset (0x6E), 
                PL3L,   8, 
                PL4L,   8, 
                Offset (0x72), 
                    ,   4, 
                XS4F,   1, 
                Offset (0x76), 
                    ,   1, 
                SLID,   1, 
                    ,   1, 
                S3WA,   1, 
                    ,   1, 
                HPEN,   1, 
                Offset (0x77), 
                Offset (0x78), 
                HBTN,   8, 
                BRTS,   8, 
                W8BR,   8, 
                    ,   1, 
                TOPD,   1, 
                WUSB,   1, 
                FGPT,   1, 
                WEBC,   1, 
                BLTH,   1, 
                DV3G,   1, 
                WLAN,   1, 
                OSDF,   8, 
                CGVT,   8, 
                Offset (0x8A), 
                LDAT,   8, 
                HDAT,   8, 
                RFLG,   1, 
                WFLG,   1, 
                BFLG,   1, 
                CFLG,   1, 
                    ,   3, 
                DRDY,   1, 
                CMDL,   8, 
                CMDH,   8, 
                Offset (0x90), 
                ACIC,   1, 
                BPST,   1, 
                BSOK,   1, 
                Offset (0x9F), 
                ACWT,   1, 
                HTMF,   1, 
                ACFL,   1, 
                Offset (0xA0), 
                Offset (0xA6), 
                CYCN,   16, 
                Offset (0xC0), 
                BIF0,   16, 
                BIF1,   16, 
                BIF2,   16, 
                BIF3,   16, 
                BIF4,   16, 
                BIF5,   16, 
                BIF6,   16, 
                BIF7,   16, 
                BIF8,   16, 
                BIF9,   64, 
                BIFA,   64, 
                BIFB,   64, 
                BIFC,   64, 
                BST0,   16, 
                BST1,   16, 
                BST2,   16, 
                BST3,   16, 
                BTP0,   16, 
                ACIN,   1, 
                    ,   1, 
                BTIN,   1, 
                Offset (0xFD)
            }
```
:::

:::details 包含`0x3E`寄存器的相关逻辑
``` asl
ThermalZone (ECTZ)
        {
            Method (_CRT, 0, Serialized)  // _CRT: Critical Temperature
            {
                Return (0x0E94)
            }

            Method (_TMP, 0, Serialized)  // _TMP: Temperature
            {
                If ((ECON == Zero))
                {
                    Return (0x0BC2)
                }

                If ((^^PCI0.LPCB.EC0.THOT != Zero))
                {
                    ^^PCI0.LPCB.EC0.THOT = Zero
                    Return (0x0FA0)
                }
                Else
                {
                    Return ((0x0AAC + (^^PCI0.LPCB.EC0.XHPP * 0x0A)))
                }
            }
        }
```
:::

同时，这些寄存器在写的时候的行为也不稳定，大大增大了定位难度。

目前已经能定位到`0x6C`和`0x6D`两个寄存器组成的双字和风扇转速有很大的相关性，但是写入无效。可能的解释有两个：这是读取风扇转速的寄存器，或者手动写入风扇转速需要首先改变另一个寄存器的值。


## 总结

相关的问题其实只会影响使用中比较小的一部分（现在遇到的问题大概就是风扇即使在CPU的温度已经接近`Tj max`的时候似乎还不会全部运作，或者是仅CPU侧风扇高速运转，GPU侧未控制到，造成睿频频率降低），整体而言还可以接受。但是还是希望官方或者硬件大佬能够为这个型号的Linux适配做出一些改进吧，同一个厂的`Code 01`的相关支持已经有了，希望这个型号（毕竟采用同方相似甚至相同的主板的机器也不少）也能做出相关适配，或者发布相关资料吧。
