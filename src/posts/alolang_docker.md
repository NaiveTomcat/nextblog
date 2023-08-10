---
title: AloLang Docker镜像使用方法
date: 2021-09-13 20:20:00
tag: 
  - 开发
  - AloLang
sidebar: auto
category: 
  - 开发
permalink: /pages/3cbd5f/
---

## AloLang Docker镜像是什么

早在2020年的7月，我发起了一项程序语言项目，后来命名为AloLang。截至目前，该项目定义了一个新的计算机语言并初步实现了其编译器（`aloc`）和标准库（`libalolangcore`）。编译器目前仅支持64位Little Endian Unix-like系统，且仅在Linux上（包含`Arch Linux`、`Ubuntu 18.04`、`Ubuntu 20.04`、`Fedora 33`和`Android 10`）测试过。并且，由于各发行版上的依赖管理区别较大，目前我们只提供了`Arch Linux`上的`PKGBUIlD`一种包管理构建方案，在其余系统上需要自行解决依赖问题，并可能还需要处理类似`Ubuntu`上`LLVM`打包问题所导致的依赖路径问题，最后使用基于`Autotools`工具链的构建工具进行构建和安装，整体较为麻烦。因此，我们提供了一个基于`ubuntu:latest`构建的包含了`aloc`及其必要依赖和alolang标准库的docker镜像，可以直接进行编译运行操作。

## 如何使用AloLang Docker镜像

### 如何使用Docker

要使用AloLang Docker镜像，首先您需要掌握Docker的基本使用方式（主要是安装Docker和下载镜像）。如您已经有该知识，您可以直接跳往下一节。

#### 安装Docker

首先，您需要在您的系统上安装Docker。

如果您使用Windows系统，您可以参照[Docker官方网站上的文档](https://docs.docker.com/desktop/windows/install/)进行安装。简而言之，您首先需要确保您在使用`Windows 10 2004`或更新的版本，并且在`程序和功能-启用或关闭Windows功能`中打开wsl的支持（`适用于Windows的Linux子系统`和`虚拟机平台`），然后在[这里](https://desktop.docker.com/win/stable/amd64/Docker%20Desktop%20Installer.exe)下载并安装docker客户端

![wsl_enable](/img/wsl_enable.png)。

如果您使用Linux系统，您可以从您的发行版软件包仓库安装或参考Docker官方文档。您还可以从[清华大学开源软件镜像站](https://mirrors.tuna.tsinghua.edu.cn/help/docker-ce/)获取安装说明。

#### 下载Docker镜像

在命令行中，使用`docker pull <image_name>`下载对应的镜像。

### 如何使用AloLang Docker镜像

首先下载AloLang Docker镜像：
```bash
docker pull registry.cn-hangzhou.aliyuncs.com/alolang/alolang-ubuntu:latest
```

完成后应该会显示：
```
latest: Pulling from alolang/alolang-ubuntu
35807b77a593: Pull complete
e44def00ceaa: Pull complete
Digest: sha256:efea2b492bbcc751d21e75b2bd56bcdcb7a9126bb256d2ea96cd24273fd5fd30
Status: Downloaded newer image for registry.cn-hangzhou.aliyuncs.com/alolang/alolang-ubuntu:latest
registry.cn-hangzhou.aliyuncs.com/alolang/alolang-ubuntu:latest
```

然后启动AloLang Docker镜像，在这一步您可以可选的将本地目录挂载进Docker容器：
```bash
docker run -it registry.cn-hangzhou.aliyuncs.com/alolang/alolang-ubuntu
```

这时您应该会进入AloLang Docker镜像的`bash`命令行。

此时您应该能使用`aloc`命令了。这个命令是AloLang的编译器。使用方法大致为：
```bash
aloc <source_file> [-o <output_file>]
```

`-o <output_file>`是可选的，如果指定了这个命令，则生成的可执行文件的名称将会为您指定的`<output_file>`参数，否则将会为`a.out`。

## 使用示例

假设您已经下载并启动了AloLang的Docker镜像，您应该会在这样一个`bash`界面里：
```
root@f5b42f9cd71b:/#
```

让我们切换到家目录（以防止将根目录弄乱）
```
root@f5b42f9cd71b:/# cd ~
root@f5b42f9cd71b:~#
```

我们现在可以写个简单的程序（镜像内置`vim`编辑器）
```
root@f5b42f9cd71b:~# vim test.alo
```

然后按下键盘上的`i`键进入编辑模式，在文件中输入一个简单的`Hello, world!`小程序
```alo
%import io.alo

func main(){
    print("Hello, world!");
}
```

按下键盘上的`ESC`键，并输入`:wq`并回车，以保存并退出。运行ls

```
root@f5b42f9cd71b:~# ls
test.alo
root@f5b42f9cd71b:~#
```

运行`aloc`进行编译
```
root@f5b42f9cd71b:~# aloc test.alo
```

:::details 输出较长，故折叠
```
root@f5b42f9cd71b:~# aloc test.alo
Start preproccessing and lexer:test.alo






extern func __cfree(int addr);
extern func __cmalloc(int size)->int;
extern func __cmemcpy(int src,int dst,int size);
func memcpy(int src,int dst,int size)
{
        __cmemcpy(src,dst,size);
        return;
}
class UnsafePointer<A>
{
        int addr;
        func __alolang_inner_load()->A*
        {

        }
        func __alolang_inner_toObj(A* pointer)
        {

        }
        func load()->A*
        {
                return this->__alolang_inner_load();
        }
        func toObj(A* pointer)
        {
                this->__alolang_inner_toObj(pointer);
                return;
        }
        func malloc(int count)
        {
                this->addr=__cmalloc(count*sizeof(A));
                return;
        }
        func free()
        {
                __cfree(this->addr);
                return;
        }
}



extern "S" func _cdouble2int(double v)->int;
func floor(double v)->int{
        double v1=0.0;
        if(v % 1.0 >= 0.0)
        {
                v1=v%1.0;
        }else{
                v1=1.0 + v % 1.0;
        }
        double t= v - v1;
        return _cdouble2int(t);
}

class array<A>
{
    UnsafePointer<A> ptr;
    int sz;
    int cap;
    func _Desired_size_to_capacity(int _size) -> int
    {
        int u = floor(_size / 16);
        return (u + 1) * 16;



    }
    func init(int _sz)
    {
        this->sz = _sz;
        this->cap = this->_Desired_size_to_capacity(_sz);
        this->ptr.malloc(this->cap);
        return;
    }
    func init()
    {
        this->sz = 0;
        this->cap = 16;
        this->ptr.malloc(this->cap);
        return;
    }
    func destroy()
    {
        this->ptr.free();
        this->sz = 0;
        this->cap = 0;
        return;
    }
    func size() -> int
    {
        return this->sz;
    }
    func capacity() -> int
    {
        return this->cap;
    }
    func data() -> A*
    {
        return this->ptr.load();
    }
    func udata() -> UnsafePointer<A>
    {
        return this->ptr;
    }
    func _Reallocate(int _Newsz)
    {
        this->cap = this->_Desired_size_to_capacity(_Newsz);
        UnsafePointer<A> newptr;
        newptr.malloc(this->cap);
        memcpy(this->ptr.addr, newptr.addr, this->sz * sizeof(A));
        this->ptr.free();
        this->ptr = newptr;
        return;
    }
    func concat(A* _ptr, int _sz)
    {
        int newsz = this->sz + _sz;
        if(newsz > this->cap) this->_Reallocate(newsz);
        UnsafePointer<A> _ptr_wrapper;
        _ptr_wrapper.toObj(_ptr);
        memcpy(_ptr_wrapper.addr, this->ptr.addr + this->sz * sizeof(A), _sz * sizeof(A));
        this->sz = newsz;
        return;
    }
    func append(A obj)
    {
        this->concat(&obj, 1);
        return;
    }
    func push_back(A obj)
    {
        this->concat(&obj, 1);
        return;
    }
    func get(int _Index) -> A*
    {
        UnsafePointer<A> cur;
        cur.addr=this->ptr.addr+_Index * sizeof(A);
        return cur.load();
    }
    func pop_back() -> A
    {


        UnsafePointer<A> p;
        p.addr = this->ptr.addr;
        p.addr = p.addr + this->sz * sizeof(A) - sizeof(A);
        this->sz = this->sz - 1;
        return *(p.load());
    }
    func erase_back(int _Size_to_erase)
    {



        this->sz = this->sz - _Size_to_erase;
        return;
    }
    func back() -> A
    {

        UnsafePointer<A> p;
        p.addr = this->ptr.addr;
        p.addr = p.addr + this->sz * sizeof(A) - sizeof(A);
        return *(p.load());
    }
}

class string
{

    array<char> data;
        func length()->int
        {
                return this->data.size();
        }
        func charAt(int index)->char
        {
                return *this->data.get(index);
        }
}



extern func print(int i);
extern func print(double f);
extern func print(bool b);
extern func print(string s);
extern func print(char c);
extern "S" func testGetInt() -> int;
extern "S" func testGetDouble() -> double;

func main(){
    print("Hello, world!");
}
Start compiling:test.alo
Function extern found:             __cfree
Function extern found:             __cmalloc
Function extern found:             __cmemcpy
Function definition found:         memcpy
Function call found:               __cmemcpy
Class definition found:            UnsafePointer
Variable definition found:         addr with type:int
Function definition found:         __alolang_inner_load
Function definition found:         __alolang_inner_toObj
Function definition found:         load
Function call found:               __alolang_inner_load
Function definition found:         toObj
Function call found:               __alolang_inner_toObj
Function definition found:         malloc
Function call found:               __cmalloc
Function definition found:         free
Function call found:               __cfree
Function extern found:             _cdouble2int
Function definition found:         floor
Variable definition found:         v1 with type:double
Variable definition found:         t with type:double
Function call found:               _cdouble2int
Class definition found:            array
Variable definition found:         ptr with type:UnsafePointer
Variable definition found:         sz with type:int
Variable definition found:         cap with type:int
Function definition found:         _Desired_size_to_capacity
Function call found:               floor
Variable definition found:         u with type:int
Function definition found:         init
Function call found:               _Desired_size_to_capacity
Function call found:               malloc
Function definition found:         init
Function call found:               malloc
Function definition found:         destroy
Function call found:               free
Function definition found:         size
Function definition found:         capacity
Function definition found:         data
Function call found:               load
Function definition found:         udata
Function definition found:         _Reallocate
Function call found:               _Desired_size_to_capacity
Variable definition found:         newptr with type:UnsafePointer
Function call found:               malloc
Function call found:               memcpy
Function call found:               free
Function definition found:         concat
Variable definition found:         newsz with type:int
Function call found:               _Reallocate
Variable definition found:         _ptr_wrapper with type:UnsafePointer
Function call found:               toObj
Function call found:               memcpy
Function definition found:         append
Function call found:               concat
Function definition found:         push_back
Function call found:               concat
Function definition found:         get
Variable definition found:         cur with type:UnsafePointer
Function call found:               load
Function definition found:         pop_back
Variable definition found:         p with type:UnsafePointer
Function call found:               load
Function definition found:         erase_back
Function definition found:         back
Variable definition found:         p with type:UnsafePointer
Function call found:               load
Class definition found:            string
Variable definition found:         data with type:array
Function definition found:         length
Function call found:               size
Function definition found:         charAt
Function call found:               get
Function extern found:             print
Function extern found:             print
Function extern found:             print
Function extern found:             print
Function extern found:             print
Function extern found:             testGetInt
Function extern found:             testGetDouble
Function definition found:         main
Function call found:               print
Start codegen:test.alo
Build finished.
debug info:g++ -O0 ./test.alo.s  -fPIE -L src/lib -lalolangcore -Bdynamic -l m -l protobuf -l stdc++ -std=c++17 -o a.out
root@f5b42f9cd71b:~#
```
:::

此时ls，可以发现生成了可执行文件`a.out`、LLVM IR可读文件`test.alo.ll`、LLVM IR字节码文件`test.alo.bc`和汇编文件`test.alo.s`
```
root@f5b42f9cd71b:~# ls
a.out  test.alo  test.alo.bc  test.alo.ll  test.alo.s
root@f5b42f9cd71b:~#
```

运行`a.out`，得到预期输出
```
root@f5b42f9cd71b:~# ./a.out
Hello, world!
root@f5b42f9cd71b:~#
```
