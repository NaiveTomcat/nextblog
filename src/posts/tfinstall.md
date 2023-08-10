---
title: 在机械革命Umi Pro 3的Windows上安装tensorflow的踩坑记录（With RTX 3060 Laptop）
date: 2021-04-13 21:00:00
tag: 
  - 开发
  - Python
  - TensorFlow
  - CUDA
sidebar: auto
category: 
  - 开发
permalink: /pages/787b52/
---

## 前言

本来打算在这个机子上装Arch跑开发的，然而因为Linux上糟糕的国内软件支持（上台机子上QQ for Linux/Wine QQ/Wine TIM就没跑起来连续超过10分钟过），以及放不下Microsoft Office，最终还是留在了Windows里面进行开发。

最近刚好有个深度学习的活，那就顺便把TF装了吧，3060的算力肯定比我之前的2400G要好，我想。

然后我就开始了这个踩坑之旅

## Anaconda大坑

本来我想用Anaconda装的，然而30系显卡只支持CUDA11，Anaconda上对Windows提供的最新TF版本是2.3.0（至少清华镜像源是这样），同时TF2.4+的版本才支持CUDA11。因此Anaconda的方案Pass。

## 官方Python的大坑

然后，我就下载了官方的python安装器。安装之后，我手贱执行了`python -m pip install -u pip`的操作，这个命令执行正常，但是等更新到`pip 21.0.1`之后，pip再装任何包用任何源都会报ssl错误。。。重装降级pip（从源码安装，因为pip已经不能用了）、重装python都不顶用。。。所以这个python算是废了。（不要问我为啥不手动安装，我懒得人工解析依赖，尤其是tf这种大包）

## 微软商店Python3.8 + CUDA 11.1安装流程（踩坑记录）

### 安装

上面几个路子毙了之后，我从微软商店下了python3.8（之前还总是想执行python的时候给我弹出应用商店，现在知道好处了🤣）。这个python的pip意外的能用，于是我就进行了以下操作：

- 安装CUDA Toolkit 11.1
- 安装cuDNN 8.0.4 for CUDA 11.1
- 安装`tf-nightly-gpu`

### 报错

结果，当我执行下面用来验证Tensorflow能否正确使用GPU的代码时

``` python
import tensorflow as tf
print(tf.config.list_physical_devices('GPU'))
```

报了以下错误

``` python
Python 3.8.9 (tags/v3.8.9:a743f81, Apr  2 2021, 11:10:41) [MSC v.1928 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>> import tensorflow as tf
2021-04-13 20:17:15.816771: W tensorflow/stream_executor/platform/default/dso_loader.cc:60] Could not load dynamic library 'cudart64_110.dll'; dlerror: cudart64_110.dll not found
2021-04-13 20:17:15.817103: I tensorflow/stream_executor/cuda/cudart_stub.cc:29] Ignore above cudart dlerror if you do n>>> print(tf.config.list_physical_devices('GPU'))
2021-04-13 20:17:36.158492: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library nvcuda.dll
2021-04-13 20:17:36.191206: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1770] Found device 0 with properties:
pciBusID: 0000:01:00.0 name: GeForce RTX 3060 Laptop GPU computeCapability: 8.6
coreClock: 1.425GHz coreCount: 30 deviceMemorySize: 6.00GiB deviceMemoryBandwidth: 312.97GiB/s
2021-04-13 20:17:36.191645: W tensorflow/stream_executor/platform/default/dso_loader.cc:60] Could not load dynamic library 'cudart64_110.dll'; dlerror: cudart64_110.dll not found
2021-04-13 20:17:36.191941: W tensorflow/stream_executor/platform/default/dso_loader.cc:60] Could not load dynamic library 'cublas64_11.dll'; dlerror: cublas64_11.dll not found
2021-04-13 20:17:36.192248: W tensorflow/stream_executor/platform/default/dso_loader.cc:60] Could not load dynamic library 'cublasLt64_11.dll'; dlerror: cublasLt64_11.dll not found
2021-04-13 20:17:36.192544: W tensorflow/stream_executor/platform/default/dso_loader.cc:60] Could not load dynamic library 'cufft64_10.dll'; dlerror: cufft64_10.dll not found
2021-04-13 20:17:36.192849: W tensorflow/stream_executor/platform/default/dso_loader.cc:60] Could not load dynamic library 'curand64_10.dll'; dlerror: curand64_10.dll not found
2021-04-13 20:17:36.193141: W tensorflow/stream_executor/platform/default/dso_loader.cc:60] Could not load dynamic library 'cusolver64_10.dll'; dlerror: cusolver64_10.dll not found
2021-04-13 20:17:36.193434: W tensorflow/stream_executor/platform/default/dso_loader.cc:60] Could not load dynamic library 'cusparse64_11.dll'; dlerror: cusparse64_11.dll not found
2021-04-13 20:17:36.193765: W tensorflow/stream_executor/platform/default/dso_loader.cc:60] Could not load dynamic library 'cudnn64_8.dll'; dlerror: cudnn64_8.dll not found
2021-04-13 20:17:36.193965: W tensorflow/core/common_runtime/gpu/gpu_device.cc:1803] Cannot dlopen some GPU libraries. Please make sure the missing libraries mentioned above are installed properly if you would like to use GPU. Follow the guide at https://www.tensorflow.org/install/gpu for how to download and setup the required libraries for your platform.
Skipping registering GPU devices...
[]
>>> exit()
```

我当时就懵了。。。我明明安了CUDA和cuDNN，为啥你就是找不到dll呢？

为了以防万一，我重新检查了`%PATH%`环境变量，加上了cuDNN的bin文件夹，重启电脑，打开python，执行测试代码

然后它又报了一样的错。。。

### 解决

那本着既然你不到我这来找，我把你要找的东西放到某个你一定会去找的地方的指导思想，我把`CUDA/bin`目录下的东西和cuDNN的bin目录下的东西全都复制到`System32`文件夹里面了，这回错误信息少了不少：

``` python
Python 3.8.9 (tags/v3.8.9:a743f81, Apr  2 2021, 11:10:41) [MSC v.1928 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>> import tensorflow as tf
2021-04-13 20:21:59.188311: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic >>> print(tf.config.list_physical_devices('GPU'))
2021-04-13 20:22:02.619845: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library nvcuda.dll
2021-04-13 20:22:02.652104: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1770] Found device 0 with properties:
pciBusID: 0000:01:00.0 name: GeForce RTX 3060 Laptop GPU computeCapability: 8.6
coreClock: 1.425GHz coreCount: 30 deviceMemorySize: 6.00GiB deviceMemoryBandwidth: 312.97GiB/s
2021-04-13 20:22:02.652388: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cudart64_110.dll
2021-04-13 20:22:02.657192: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cublas64_11.dll
2021-04-13 20:22:02.657277: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cublasLt64_11.dll
2021-04-13 20:22:02.660691: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cufft64_10.dll
2021-04-13 20:22:02.661647: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library curand64_10.dll
2021-04-13 20:22:02.661944: W tensorflow/stream_executor/platform/default/dso_loader.cc:60] Could not load dynamic library 'cusolver64_10.dll'; dlerror: cusolver64_10.dll not found
2021-04-13 20:22:02.664136: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cusparse64_11.dll
2021-04-13 20:22:02.666277: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cudnn64_8.dll
2021-04-13 20:22:02.666505: W tensorflow/core/common_runtime/gpu/gpu_device.cc:1803] Cannot dlopen some GPU libraries. Please make sure the missing libraries mentioned above are installed properly if you would like to use GPU. Follow the guide at https://www.tensorflow.org/install/gpu for how to download and setup the required libraries for your platform.
Skipping registering GPU devices...
[]
```

可以看到是少了`cusolver64_10.dll`的问题。因为CUDA 11.0有这个文件，11.1没有，而官方的tf又是在11.0上构建的，因此会出现这个问题。解决方案也很简单，一行powershell搞定：

``` powershell
PS C:\Windows\system32> New-Item -ItemType SymbolicLink -Path .\cusolver64_10.dll -Target .\cusolver64_11.dll
```

创建一个名为`cusolver64_10.dll`的符号链接，指向`cusolver64_11.dll`就可以了。

最终效果：

``` python
Python 3.8.9 (tags/v3.8.9:a743f81, Apr  2 2021, 11:10:41) [MSC v.1928 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>> import tensorflow as tf
2021-04-13 20:23:46.888229: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cudart64_110.dll
>>> print(tf.config.list_physical_devices('GPU'))
2021-04-13 20:23:49.604479: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library nvcuda.dll
2021-04-13 20:23:49.635657: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1770] Found device 0 with properties:
pciBusID: 0000:01:00.0 name: GeForce RTX 3060 Laptop GPU computeCapability: 8.6
coreClock: 1.425GHz coreCount: 30 deviceMemorySize: 6.00GiB deviceMemoryBandwidth: 312.97GiB/s
2021-04-13 20:23:49.635911: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cudart64_110.dll
2021-04-13 20:23:49.640891: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cublas64_11.dll
2021-04-13 20:23:49.641096: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cublasLt64_11.dll
2021-04-13 20:23:49.644103: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cufft64_10.dll
2021-04-13 20:23:49.645155: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library curand64_10.dll
2021-04-13 20:23:49.656521: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cusolver64_10.dll
2021-04-13 20:23:49.658909: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cusparse64_11.dll
2021-04-13 20:23:49.659487: I tensorflow/stream_executor/platform/default/dso_loader.cc:49] Successfully opened dynamic library cudnn64_8.dll
2021-04-13 20:23:49.659695: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1908] Adding visible gpu devices: 0
[PhysicalDevice(name='/physical_device:GPU:0', device_type='GPU')]
>>> tf.add(1,2).numpy()
2021-04-13 20:24:04.083467: I tensorflow/core/platform/cpu_feature_guard.cc:142] This TensorFlow binary is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following CPU instructions in performance-critical operations:  AVX2
To enable them in other operations, rebuild TensorFlow with the appropriate compiler flags.
2021-04-13 20:24:04.084871: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1770] Found device 0 with properties:
pciBusID: 0000:01:00.0 name: GeForce RTX 3060 Laptop GPU computeCapability: 8.6
coreClock: 1.425GHz coreCount: 30 deviceMemorySize: 6.00GiB deviceMemoryBandwidth: 312.97GiB/s
2021-04-13 20:24:04.085181: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1908] Adding visible gpu devices: 0
2021-04-13 20:24:04.574965: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1300] Device interconnect StreamExecutor with strength 1 edge matrix:
2021-04-13 20:24:04.575224: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1306]      0
2021-04-13 20:24:04.575554: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1319] 0:   N
2021-04-13 20:24:04.576003: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1456] Created TensorFlow device (/job:localhost/replica:0/task:0/device:GPU:0 with 3497 MB memory) -> physical GPU (device: 0, name: GeForce RTX 3060 Laptop GPU, pci bus id: 0000:01:00.0, compute capability: 8.6)
3
```

能读到GPU，能算东西，完工
