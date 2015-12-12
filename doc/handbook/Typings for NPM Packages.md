TypeScript编译器处理nodejs模块名时使用的是[Node.js模块解析算法](https://nodejs.org/api/modules.html#modules_all_together)。
TypeScript编译器可以同时加载与npm包绑在一起的类型信息。
编译通过下面的规则来查找`"foo"`模块的类型信息：

1. 尝试加载相应代码包目录下`package.json`文件（`node_modules/foo/`）。
如果存在，从`"typings"`字段里读取类型文件的路径。比如，在下面的`package.json`里，编译器会认为类型文件位于`node_modules/foo/lib/foo.d.ts`。

```JSON
{
    "name": "foo",
    "author": "Vandelay Industries",
    "version": "1.0.0",
    "main": "./lib/foo.js",
    "typings": "./lib/foo.d.ts"
}
```

2. 尝试加载在相应代码包目录下的名字为`index.d.ts`的文件（`node_modules/foo/`） - 这个文件应该包含了这个代码包的类型信息。

解析模块的详细算法可以在[这里](https://github.com/Microsoft/TypeScript/issues/2338)找到。

### 类型信息文件应该是什么样子的

* 是一个`.d.ts`文件
* 是一个外部模块
* 不包含`///<reference>`引用

基本的原理是类型文件不能引入新的可编译代码；
否则真正的实现文件就可能会在编译时被重盖。
另外，**加载类型信息不应该污染全局空间**，当从同一个库的不同版本中引入潜在冲突的实体的时候。