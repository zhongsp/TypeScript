# 发展路线图

## 2.1

* 调查 [Function bind 操作符](https://github.com/Microsoft/TypeScript/issues/3508)
* [支持工程引用](https://github.com/Microsoft/TypeScript/issues/3469)
* [`readonly` 修饰符](https://github.com/Microsoft/TypeScript/issues/12)
* 调查 [具名类型支持](https://github.com/Microsoft/TypeScript/issues/202)
* Language Service API里支持代码重构功能
* [扁平化声明](https://github.com/Microsoft/TypeScript/issues/4433)

## 2.0

* 切换到[基于转换的生成器](https://github.com/Microsoft/TypeScript/issues/5595)
* [支持ES5/ES3 `async`/`await`](https://github.com/Microsoft/TypeScript/issues/1664)
* 支持[ES7对象属性展开及剩余属性](https://github.com/Microsoft/TypeScript/issues/2103)
* [规定函数的`this`类型](https://github.com/Microsoft/TypeScript/issues/3694)
* [属性访问上的类型保护](https://github.com/Microsoft/TypeScript/issues/186)
* [切换类型保护](https://github.com/Microsoft/TypeScript/issues/2214)
* 支持[常量和Symbol上计算属性的类型检查](https://github.com/Microsoft/TypeScript/issues/5579)
* [可变类型](https://github.com/Microsoft/TypeScript/issues/5453)
* [外部装饰器](https://github.com/Microsoft/TypeScript/issues/2900)
* [弃用的装饰器](https://github.com/Microsoft/TypeScript/issues/390)
* [条件装饰器](https://github.com/Microsoft/TypeScript/issues/3538)
* 函数表达式及箭头函数的装饰器
* [支持节点注册勾子](https://github.com/Microsoft/TypeScript/issues/1823)
* [在tsconfig.json里支持Glob](https://github.com/Microsoft/TypeScript/issues/1927)
* 在语言服务API里支持快速修复
* 在tsserver/语言服务API里集成tsd
* [从js文件的JSDoc里撮类型信息](https://github.com/Microsoft/TypeScript/issues/4790)
* [增强lib.d.ts模块化](https://github.com/Microsoft/TypeScript/issues/494)
* 支持[外部辅助代码库](https://github.com/Microsoft/TypeScript/issues/3364)
* 调查[语言服务的可扩展性](https://github.com/Microsoft/TypeScript/issues/6508)

## 1.8

* [在TypeScript编译时使用`--allowjs`允许JavaScript](https://github.com/Microsoft/TypeScript/issues/4792)
* [在循环里允许捕获的`let`/`const`](https://github.com/Microsoft/TypeScript/issues/3915)
* [标记死代码](https://github.com/Microsoft/TypeScript/pull/4788)
* [使用`--outFile`连接模块输出](https://github.com/Microsoft/TypeScript/pull/5090)
* [tsconfig.json里支持注释](https://github.com/Microsoft/TypeScript/issues/4987)
* [使用`--pretty`为终端里的错误信息添加样式](https://github.com/Microsoft/TypeScript/pull/5140)
* [支持`--outFile`给命名的管道套接字和特殊设备](https://github.com/Microsoft/TypeScript/issues/4841)
* [支持使用名字字面量的计算属性](https://github.com/Microsoft/TypeScript/issues/4653)
* [字符串字面量类型](https://github.com/Microsoft/TypeScript/pull/5185)
* [JSX无状态的功能性组件](https://github.com/Microsoft/TypeScript/issues/5478)
* [优化联合/交类型接口](https://github.com/Microsoft/TypeScript/pull/5738)
* [支持F-Bounded多态性](https://github.com/Microsoft/TypeScript/pull/5949)
* [支持全路径`-project`/`-p`参数](https://github.com/Microsoft/TypeScript/issues/2869)
* [在SystemJS使用`--allowSyntheticDefaultImports`支持`default`导入操作](https://github.com/Microsoft/TypeScript/issues/5285)
* [识别JavaScript里原型的赋值](https://github.com/Microsoft/TypeScript/pull/5876)
* [在模块里使用路径映射](https://github.com/Microsoft/TypeScript/issues/5039)
* [在其它模块里增加global/module作用域](https://github.com/Microsoft/TypeScript/issues/4166)
* [在Visual Studio使用tsconfig.json做为高优先级的配置](https://github.com/Microsoft/TypeScript/issues/5287)
* [基于`this`类型保护](https://github.com/Microsoft/TypeScript/pull/5906)
* 支持[自定义JSX工厂通过`--reactNamespace`](https://github.com/Microsoft/TypeScript/pull/6146)
* [增强for-in语句检查](https://github.com/Microsoft/TypeScript/pull/6379)
* [JSX代码在VS 2015里高亮](https://github.com/Microsoft/TypeScript/issues/4835)
* 发布[TypeScript NuGet 包](https://github.com/Microsoft/TypeScript/issues/3940)

## 1.7

* [ES7幂运算符](https://github.com/Microsoft/TypeScript/issues/4812)
* [多态的`this`类型](https://github.com/Microsoft/TypeScript/pull/4910)
* [支持`--module`的`--target es6`](https://github.com/Microsoft/TypeScript/issues/4806)
* [支持目标为ES3时使用装饰器](https://github.com/Microsoft/TypeScript/pull/4741)
* [为ES6支持`async`/`await`\(Node v4\)](https://github.com/Microsoft/TypeScript/pull/5231)
* [增强的字面量初始化器解构检查](https://github.com/Microsoft/TypeScript/pull/4598)

## 1.6

* [ES6 Generators](https://github.com/Microsoft/TypeScript/issues/2873)
* [Local types](https://github.com/Microsoft/TypeScript/pull/3266)
* [泛型别名](https://github.com/Microsoft/TypeScript/issues/1616)
* [类继承语句里使用表达式](https://github.com/Microsoft/TypeScript/pull/3516)
* [Class表达式](https://github.com/Microsoft/TypeScript/issues/497)
* [tsconfig.json的`exclude`属性](https://github.com/Microsoft/TypeScript/pull/3188)
* [用户定义的类型保护函数](https://github.com/Microsoft/TypeScript/issues/1007)
* [增强外部模块解析](https://github.com/Microsoft/TypeScript/issues/2338)
* [JSX支持](https://github.com/Microsoft/TypeScript/pull/3564)
* [交叉类型](https://github.com/Microsoft/TypeScript/pull/3622)
* [`abstract`类和方法](https://github.com/Microsoft/TypeScript/issues/3578)
* [严格的对象字面量赋值检查](https://github.com/Microsoft/TypeScript/pull/3823)
* [类和接口的声明合并](https://github.com/Microsoft/TypeScript/pull/3333)
* 新增[--init](https://github.com/Microsoft/TypeScript/issues/3079)

## 1.5

* 支持[解构](https://github.com/Microsoft/TypeScript/pull/1346)
* 支持[展开操作符](https://github.com/Microsoft/TypeScript/pull/1931)
* 支持[ES6模块](https://github.com/Microsoft/TypeScript/issues/2242)
* 支持[for..of](https://github.com/Microsoft/TypeScript/pull/2207)
* 支持[ES6 Unicode 规范](https://github.com/Microsoft/TypeScript/pull/2169)
* 支持[Symbols](https://github.com/Microsoft/TypeScript/pull/1978)
* 支持[计算属性](https://github.com/Microsoft/TypeScript/issues/1082)
* 支持[tsconfig.json文件](https://github.com/Microsoft/TypeScript/pull/1692)
* 支持[ES3/ES5的let和const](https://github.com/Microsoft/TypeScript/pull/2161)
* 支持[ES3/ES5带标记的模版](https://github.com/Microsoft/TypeScript/pull/1589)
* 暴露一个新的编辑器接口通过[TS Server](https://github.com/Microsoft/TypeScript/pull/2041)
* 支持[ES7 装饰器提案](https://github.com/Microsoft/TypeScript/issues/2249)
* 支持[装饰器类型元信息](https://github.com/Microsoft/TypeScript/pull/2589)
* 新增[--rootDir](https://github.com/Microsoft/TypeScript/pull/2772)
* 新增[ts.transpile API](https://github.com/Microsoft/TypeScript/issues/2499)
* 支持[--module umd](https://github.com/Microsoft/TypeScript/issues/2036)
* 支持[--module system](https://github.com/Microsoft/TypeScript/issues/2616)
* 新增[--noEmitHelpers](https://github.com/Microsoft/TypeScript/pull/2901)
* 新增[--inlineSourceMap](https://github.com/Microsoft/TypeScript/pull/2484)
* 新增[--inlineSources](https://github.com/Microsoft/TypeScript/pull/2484)
* 新增[--newLine](https://github.com/Microsoft/TypeScript/pull/2921)
* 新增[--isolatedModules](https://github.com/Microsoft/TypeScript/issues/2499)
* 支持新的[`namespace`关键字](https://github.com/Microsoft/TypeScript/issues/2159)
* 支持[Visual Studio 2015的tsconfig.json](https://github.com/Microsoft/TypeScript/issues/3124)
* 增强[Visual Studio 2013的模块字面量高亮](https://github.com/Microsoft/TypeScript/pull/2026)

## 1.4

* 支持[联合类型和类型保护](https://github.com/Microsoft/TypeScript/pull/824)
* 新增[--noEmitOnError](https://github.com/Microsoft/TypeScript/pull/966)
* 新增[--target ES6](https://github.com/Microsoft/TypeScript/commit/873c1df74b7c7dcba59eaccc1bb4bd4b0da18a35)
* 支持[Let and Const](https://github.com/Microsoft/TypeScript/pull/904)
* 支持[模块字面量](https://github.com/Microsoft/TypeScript/pull/960)
* Library typings for ES6
* 支持[Const enums](https://github.com/Microsoft/TypeScript/issues/1029)
* 导出语言服务公共API

## 1.3

* 为新的编译器重写语言服务
* 支持[受保护的成员](https://github.com/Microsoft/TypeScript/pull/688) in classes
* 支持[元组类型](https://github.com/Microsoft/TypeScript/pull/428)

