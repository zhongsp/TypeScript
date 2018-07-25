## 编译选项

选项                                     | 类型      | 默认值                    | 描述
----------------------------------------|-----------|--------------------------|----------------------------------------------------------------------
`--allowJs`                             | `boolean` |  `false`                 | 允许编译javascript文件。
`--allowSyntheticDefaultImports`        | `boolean` | `module === "system"`或`--esModuleInterop`    | 允许从没有设置默认导出的模块中默认导入。这并不影响代码的显示，仅为了类型检查。
`--allowUnreachableCode`                | `boolean` | `false`                  | 不报告执行不到的代码错误。
`--allowUnusedLabels`                   | `boolean` | `false`                  | 不报告未使用的标签错误。
`--alwaysStrict`                        | `boolean` | `false`                  | 以严格模式解析并为每个源文件生成`"use strict"`语句
`--baseUrl`                             | `string`  |                          | 解析非相对模块名的基准目录。查看[模块解析文档](./Module Resolution.md#base-url)了解详情。
`--charset`                             | `string`  | `"utf8"`                 | 输入文件的字符集。
`--checkJs`                             | `boolean` | `false`                  | 在.js文件中报告错误。与`--allowJs`配合使用。
`--declaration`<br/>`-d`                | `boolean` | `false`                  | 生成相应的`.d.ts`文件。
`--declarationDir`                      | `string`  |                          | 生成声明文件的输出路径。
`--diagnostics`                         | `boolean` | `false`                  | 显示诊断信息。
`--disableSizeLimit`                    | `boolean` | `false`                  | 禁用JavaScript工程体积大小的限制
`--emitBOM`                             | `boolean` | `false`                  | 在输出文件的开头加入BOM头（UTF-8 Byte Order Mark）。
`--emitDecoratorMetadata`<sup>[1]</sup> | `boolean` | `false`                  | 给源码里的装饰器声明加上设计类型元数据。查看[issue #2577](https://github.com/Microsoft/TypeScript/issues/2577)了解更多信息。
`--experimentalDecorators`<sup>[1]</sup>| `boolean` | `false`                  | 启用实验性的ES装饰器。
`--extendedDiagnostics`                 | `boolean` | `false`                  | 显示详细的诊段信息。
`--forceConsistentCasingInFileNames`    | `boolean` | `false`                  | 禁止对同一个文件的不一致的引用。
`--help`<br/>`-h`                       |           |                          | 打印帮助信息。
`--importHelpers`                       | `string`  |                          | 从[`tslib`](https://www.npmjs.com/package/tslib)导入辅助工具函数（比如`__extends`，`__rest`等）
`--inlineSourceMap`                     | `boolean` | `false`                  | 生成单个sourcemaps文件，而不是将每sourcemaps生成不同的文件。
`--inlineSources`                       | `boolean` | `false`                  | 将代码与sourcemaps生成到一个文件中，要求同时设置了`--inlineSourceMap`或`--sourceMap`属性。
`--init`                                |           |                          | 初始化TypeScript项目并创建一个`tsconfig.json`文件。
`--isolatedModules`                     | `boolean` | `false`                  | 将每个文件作为单独的模块（与“ts.transpileModule”类似）。
`--jsx`                                 | `string`  | `"Preserve"`             | 在`.tsx`文件里支持JSX：`"React"`或`"Preserve"`。查看[JSX](./JSX.md)。
`--jsxFactory`                          | `string`  | `"React.createElement"`  | 指定生成目标为react JSX时，使用的JSX工厂函数，比如`React.createElement`或`h`。
`--lib`                                 | `string[]`|                          | 编译过程中需要引入的库文件的列表。<br/>可能的值为：  <br/>► `ES5` <br/>► `ES6` <br/>► `ES2015` <br/>► `ES7` <br/>► `ES2016` <br/>► `ES2017`  <br/>► `ES2018` <br/>► `ESNext` <br/>► `DOM` <br/>► `DOM.Iterable` <br/>► `WebWorker` <br/>► `ScriptHost` <br/>► `ES2015.Core` <br/>► `ES2015.Collection` <br/>► `ES2015.Generator` <br/>► `ES2015.Iterable` <br/>► `ES2015.Promise` <br/>► `ES2015.Proxy` <br/>► `ES2015.Reflect` <br/>► `ES2015.Symbol` <br/>► `ES2015.Symbol.WellKnown` <br/>► `ES2016.Array.Include` <br/>► `ES2017.object` <br/>► `ES2017.Intl` <br/>► `ES2017.SharedMemory` <br/>► `ES2017.TypedArrays` <br/>► `ES2018.Intl` <br/>► `ES2018.Promise` <br/>► `ES2018.RegExp` <br/>► `ESNext.AsyncIterable` <br/>► `ESNext.Array` <br/><br/> 注意：如果`--lib`没有指定默认注入的库的列表。默认注入的库为：<br/> ► 针对于`--target ES5`：`DOM，ES5，ScriptHost`<br/>  ► 针对于`--target ES6`：`DOM，ES6，DOM.Iterable，ScriptHost`
`--listEmittedFiles`                    | `boolean` | `false`                  | 打印出编译后生成文件的名字。
`--listFiles`                           | `boolean` | `false`                  | 编译过程中打印文件名。
`--locale`                              | `string`  | *(platform specific)*    | 显示错误信息时使用的语言，比如：en-us。
`--mapRoot`                             | `string`  |                          | 为调试器指定指定sourcemap文件的路径，而不是使用生成时的路径。当`.map`文件是在运行时指定的，并不同于`js`文件的地址时使用这个标记。指定的路径会嵌入到`sourceMap`里告诉调试器到哪里去找它们。
`--maxNodeModuleJsDepth`                | `number`  | `0`                      | node_modules依赖的最大搜索深度并加载JavaScript文件。仅适用于`--allowJs`。
`--module`<br/>`-m`                     | `string`  | `target === "ES6" ? "ES6" : "commonjs"`                                  | 指定生成哪个模块系统代码：`"None"`，`"CommonJS"`，`"AMD"`，`"System"`，`"UMD"`，`"ES6"`或`"ES2015"`。<br/>► 只有`"AMD"`和`"System"`能和`--outFile`一起使用。<br/>►`"ES6"`和`"ES2015"`可使用在目标输出为`"ES5"`或更低的情况下。
`--moduleResolution`                    | `string`  | `module === "AMD" or "System" or "ES6" ? "Classic" : "Node"`              | 决定如何处理模块。或者是`"Node"`对于Node.js/io.js，或者是`"Classic"`（默认）。查看[模块解析](./Module Resolution.md)了解详情。
`--newLine`                             | `string`  | *(platform specific)*    | 当生成文件时指定行结束符：`"crlf"`（windows）或`"lf"`（unix）。
`--noEmit`                              | `boolean` | `false`                  | 不生成输出文件。
`--noEmitHelpers`                       | `boolean` | `false`                  | 不在输出文件中生成用户自定义的帮助函数代码，如`__extends`。
`--noEmitOnError`                       | `boolean` | `false`                  | 报错时不生成输出文件。
`--noErrorTruncation`                   | `boolean` | `false`                  | 不截短错误消息。
`--noFallthroughCasesInSwitch`          | `boolean` | `false`                  | 报告switch语句的fallthrough错误。（即，不允许switch的case语句贯穿）
`--noImplicitAny`                       | `boolean` | `false`                  | 在表达式和声明上有隐含的`any`类型时报错。
`--noImplicitReturns`                   | `boolean` | `false`                  | 不是函数的所有返回路径都有返回值时报错。
`--noImplicitThis`                      | `boolean` | `false`                  | 当`this`表达式的值为`any`类型的时候，生成一个错误。
`--noImplicitUseStrict`                 | `boolean` | `false`                  | 模块输出中不包含`"use strict"`指令。
`--noLib`                               | `boolean` | `false`                  | 不包含默认的库文件（`lib.d.ts`）。
`--noResolve`                           | `boolean` | `false`                  | 不把`/// <reference``>`或模块导入的文件加到编译文件列表。
`--noStrictGenericChecks`               | `boolean` | `false`                  | 禁用在函数类型里对泛型签名进行严格检查。
`--noUnusedLocals`                      | `boolean` | `false`                  | 若有未使用的局部变量则抛错。
`--noUnusedParameters`                  | `boolean` | `false`                  | 若有未使用的参数则抛错。
~~`--out`~~                             | `string`  |                          | 弃用。使用 `--outFile` 代替。
`--outDir`                              | `string`  |                          | 重定向输出目录。
`--outFile`                             | `string`  |                          | 将输出文件合并为一个文件。合并的顺序是根据传入编译器的文件顺序和`///<reference``>`和`import`的文件顺序决定的。查看输出文件顺序文件了解详情。
`paths`<sup>[2]</sup>                   | `Object`  |                          | 模块名到基于`baseUrl`的路径映射的列表。查看[模块解析文档](./Module Resolution.md#path-mapping)了解详情。
`--preserveConstEnums`                  | `boolean` | `false`                  | 保留`const`和`enum`声明。查看[const enums documentation](https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#94-constant-enum-declarations)了解详情。
`--preserveSymlinks`                    | `boolean` | `false`                  | 不把符号链接解析为其真实路径；将符号链接文件视为真正的文件。
`--preserveWatchOutput`                 | `boolean` | `false`                  | 保留watch模式下过时的控制台输出。
`--pretty`<sup>[1]</sup>                | `boolean` | `false`                  | 给错误和消息设置样式，使用颜色和上下文。
`--project`<br/>`-p`                    | `string`  |                          | 编译指定目录下的项目。这个目录应该包含一个`tsconfig.json`文件来管理编译。查看[tsconfig.json](./tsconfig.json.md)文档了解更多信息。
`--reactNamespace`                      | `string`  | `"React"`                | 当目标为生成`"react"` JSX时，指定`createElement`和`__spread`的调用对象
`--removeComments`                      | `boolean` | `false`                  | 删除所有注释，除了以`/!*`开头的版权信息。
`--rootDir`                             | `string`  | *(common root directory is computed from the list of input files)*   | 仅用来控制输出的目录结构`--outDir`。
`rootDirs`<sup>[2]</sup>                | `string[]`|                          | <i>根（root）</i>文件夹列表，表示运行时组合工程结构的内容。查看[模块解析文档](./Module Resolution.md#virtual-directories-with-rootdirs)了解详情。
`--skipDefaultLibCheck`                 | `boolean` | `false`                  | 忽略[库的默认声明文件](./Triple-Slash Directives.md#-reference-no-default-libtrue)的类型检查。
`--skipLibCheck`                        | `boolean` | `false`                  | 忽略所有的声明文件（`*.d.ts`）的类型检查。
`--sourceMap`                           | `boolean` | `false`                  | 生成相应的`.map`文件。
`--sourceRoot`                          | `string`  |                          | 指定TypeScript源文件的路径，以便调试器定位。当TypeScript文件的位置是在运行时指定时使用此标记。路径信息会被加到`sourceMap`里。
`--strict`                              | `boolean` | `false`                  | 启用所有严格类型检查选项。<br/>启用`--strict`相当于启用 `--noImplicitAny`, `--noImplicitThis`, `--alwaysStrict`，`--strictNullChecks`和`--strictFunctionTypes`。
`--strictFunctionTypes`                 | `boolean` | `false`                  | 禁用函数参数双向协变检查。
`--strictPropertyInitialization`        | `boolean` | `false`                  | 确保类的非`undefined`属性已经在构造函数里初始化。若要令此选项生效，需要同时启用`--strictNullChecks`。
`--strictNullChecks`                    | `boolean` | `false`                  | 在严格的`null`检查模式下，`null`和`undefined`值不包含在任何类型里，只允许用它们自己和`any`来赋值（有个例外，`undefined`可以赋值到`void`）。
`--stripInternal`<sup>[1]</sup>         | `boolean` | `false`                  | 不对具有`/** @internal */` JSDoc注解的代码生成代码。
`--suppressExcessPropertyErrors`<sup>[1]</sup> | `boolean` | `false`           | 阻止对对象字面量的额外属性检查。
`--suppressImplicitAnyIndexErrors`      | `boolean` | `false`                  | 阻止`--noImplicitAny`对缺少索引签名的索引对象报错。查看[issue #1232](https://github.com/Microsoft/TypeScript/issues/1232#issuecomment-64510362)了解详情。
`--target`<br/>`-t`                     | `string`  | `"ES3"`                  | 指定ECMAScript目标版本`"ES3"`（默认），`"ES5"`，`"ES6"`/`"ES2015"`，`"ES2016"`，`"ES2017"`或`"ESNext"`。<br/><br/> 注意：`"ESNext"`最新的生成目标列表为[ES proposed features](https://github.com/tc39/proposals)
`--traceResolution`                     | `boolean` | `false`                  | 生成模块解析日志信息
`--types`                               | `string[]`|                          | 要包含的类型声明文件名列表。查看[@types，--typeRoots和--types](./tsconfig.json.md#types-typeroots-and-types)章节了解详细信息。
`--typeRoots`                           | `string[]`|                          | 要包含的类型声明文件路径列表。查看[@types，--typeRoots和--types](./tsconfig.json.md#types-typeroots-and-types)章节了解详细信息。
`--version`<br/>`-v`                    |           |                          | 打印编译器版本号。
`--watch`<br/>`-w`                      |           |                          | 在监视模式下运行编译器。会监视输出文件，在它们改变时重新编译。监视文件和目录的具体实现可以通过环境变量进行配置。详情请看[配置 Watch](./Configuring%20Watch.md)。

* <sup>[1]</sup> 这些选项是试验性的。
* <sup>[2]</sup> 这些选项只能在`tsconfig.json`里使用，不能在命令行使用。

## 相关信息

* 在[`tsconfig.json`](./tsconfig.json.md)文件里设置编译器选项。
* 在[MSBuild工程](./Compiler%20Options%20in%20MSBuild.md)里设置编译器选项。
