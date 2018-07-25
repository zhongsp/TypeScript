编译器支持使用环境变量配置如何监视文件和目录的变化。

## 使用`TSC_WATCHFILE`环境变量来配置文件监视

选项                                           | 描述
-----------------------------------------------|----------------------------------------------------------------------
`PriorityPollingInterval`                      | 使用`fs.watchFile`但针对源码文件，配置文件和消失的文件使用不同的轮询间隔
`DynamicPriorityPolling`                       | 使用动态队列，对经常被修改的文件使用较短的轮询间隔，对未修改的文件使用较长的轮询间隔
`UseFsEvents`                                  | 使用 `fs.watch`，它使用文件系统事件（但在不同的系统上可能不一定准确）来查询文件的修改/创建/删除。注意少数的系统如Linux，对监视者的数量有限制，如果使用`fs.watch`创建监视失败那么将通过`fs.watchFile`来创建监视
`UseFsEventsWithFallbackDynamicPolling`        | 此选项与`UseFsEvents`类似，只不过当使用`fs.watch`创建监视失败后，回退到使用动态轮询队列进行监视（如`DynamicPriorityPolling`介绍的那样）
`UseFsEventsOnParentDirectory`                 | 此选项通过`fs.watch`（使用系统文件事件）监视文件的父目录，因此CPU占用率低但也会降低精度
默认 （无指定值）                               | 如果环境变量`TSC_NONPOLLING_WATCHER`设置为`true`，监视文件的父目录（如同`UseFsEventsOnParentDirectory`）。否则，使用`fs.watchFile`监视文件，超时时间为`250ms`。

## 使用`TSC_WATCHDIRECTORY`环境变量来配置目录监视

在那些Nodejs原生就不支持递归监视目录的平台上，我们会根据`TSC_WATCHDIRECTORY`的不同选项递归地创建对子目录的监视。 注意在那些原生就支持递归监视目录的平台上（如Windows），这个环境变量会被忽略。

选项                                           | 描述
-----------------------------------------------|----------------------------------------------------------------------
`RecursiveDirectoryUsingFsWatchFile`           | 使用`fs.watchFile`监视目录和子目录，它是一个轮询监视（消耗CPU周期）
`RecursiveDirectoryUsingDynamicPriorityPolling`| 使用动态轮询队列来获取目录与其子目录的改变
默认 （无指定值）                               | 使用`fs.watch`来监视目录及其子目录

## 背景

在编译器中`--watch`的实现依赖于Nodejs提供的`fs.watch`和`fs.watchFile`，两者各有优缺点。

`fs.watch`使用文件系统事件通知文件及目录的变化。
但是它依赖于操作系统，且事件通知并不完全可靠，在很多操作系统上的行为难以预料。
还可能会有创建监视个数的限制，如Linux系统，在包含大量文件的程序中监视器个数很快被耗尽。
但也正是因为它使用文件系统事件，不需要占用过多的CPU周期。
典型地，编译器使用`fs.watch`来监视目录（比如配置文件里声明的源码目录，无法进行模块解析的目录）。
这样就可以处理改动通知不准确的问题。
但递归地监视仅在Windows和OSX系统上支持。
这就意味着在其它系统上要使用替代方案。

`fs.watchFile`使用轮询，因此涉及到CPU周期。
但是这是最可靠的获取文件/目录状态的机制。
典型地，编译器使用`fs.watchFile`监视源文件，配置文件和消失的文件（失去文件引用），这意味着对CPU的使用依赖于程序里文件的数量。
