## 编译选项

选项                                     | 类型      | 默认值                    | 描述
----------------------------------------|-----------|--------------------------|----------------------------------------------------------------------
`--allowJs`                             | `boolean` |  `true`                  | 允许编译javascript文件。
`--allowSyntheticDefaultImports`        | `boolean` | `(module === "system")`  | 允许从没有设置默认导出的模块中默认导入。这并不影响代码的显示，仅为了类型检查。
`--allowUnreachableCode`                | `boolean` | `false`                  | 不报告执行不到的代码错误。
`--allowUnusedLabels`                   | `boolean` | `false`                  | 不报告未使用的标签错误。
`--charset`                             | `string`  | `"utf8"`                 | 输入文件的字符集。
`--declaration`<br/>`-d`                | `boolean` | `false`                  | 生成相应的'.d.ts'文件。
`--declarationDir`                      | `string`  | `null`                   | 生成声明文件的输出路径。
`--diagnostics`                         | `boolean` | `false`                  | 显示诊断信息。
`--disableSizeLimit`                    | `boolean` | `false`                  | 禁用JavaScript工程体积大小的限制
`--emitBOM`                             | `boolean` | `false`                  | 在输出文件的开头加入BOM头（UTF-8 Byte Order Mark）。
`--emitDecoratorMetadata`<sup>[1]</sup> | `boolean` | `false`                  | 给源码里的装饰器声明加上设计类型元数据。查看[issue #2577](https://github.com/Microsoft/TypeScript/issues/2577)了解更多信息。
`--experimentalDecorators`<sup>[1]</sup>| `boolean` | `false`                  | 实验性启用ES7装饰器支持。
`--forceConsistentCasingInFileNames`    | `boolean` | `false`                  | 不允许不一致包装引用相同的文件。
`--help`<br/>`-h`                       |           |                          | 打印帮助信息。
`--init`                                |           |                          | 初始化TypeScript项目并创建一个`tsconfig.json`文件。
`--inlineSourceMap`                     | `boolean` | `false`                  | 生成单个sourcemaps文件，而不是将每sourcemaps生成不同的文件。
`--inlineSources`                       | `boolean` | `false`                  | 将代码与sourcemaps生成到一个文件中，要求同时设置了`--inlineSourceMap`或`--sourceMap`属性。
`--isolatedModules`                     | `boolean` | `false`                  | 无条件地给没有解析的文件生成imports。
`--jsx`                                 | `string`  | `"Preserve"`             | 在'.tsx'文件里支持JSX：'React' 或 'Preserve'。查看[JSX](./JSX.md)。
`--listFiles`                           | `boolean` | `false`                  | 编译过程中打印文件名。
`--locale`                              | `string`  | *(platform specific)*    | 显示错误信息时使用的语言，比如：en-us。
`--mapRoot`                             | `string`  | `null`                   | 为调试器指定指定sourcemap文件的路径，而不是使用生成时的路径。当`.map`文件是在运行时指定的，并不同于`js`文件的地址时使用这个标记。指定的路径会嵌入到`sourceMap`里告诉调试器到哪里去找它们。
`--module`<br/>`-m`                     | `string`  | `(target === "ES6" ? "ES6" : "commonjs")`                                 | 指定生成哪个模块系统代码：'commonjs'，'amd'，'system'，或 'umd'或'es2015'。只有'amd'和'system'能和`--outFile`一起使用。当目标是ES5或以下的时候不能使用'es2015'。
`--moduleResolution`                    | `string`  | `(module === 'amd' | 'system' | 'ES6' ? 'classic' : 'node')`              | 决定如何处理模块。或者是'node'对于Node.js/io.js，或者是'classic'（默认）。查看[模块解析](./Module Resolution.md)了解详情。
`--newLine`                             | `string`  | *(platform specific)*    | 当生成文件时指定行结束符：'CRLF'（dos）或 'LF' （unix）。
`--noEmit`                              | `boolean` | `false`                  | 不生成输出文件。
`--noEmitHelpers`                       | `boolean` | `false`                  | 不在输出文件中生成用户自定义的帮助函数代码，如`__extends`。
`--noEmitOnError`                       | `boolean` | `false`                  | 报错时不生成输出文件。
`--noFallthroughCasesInSwitch`          | `boolean` | `false`                  | 报告switch语句的fallthrough错误。（即，不允许switch的case语句贯穿）
`--noImplicitAny`                       | `boolean` | `false`                  | 在表达式和声明上有隐含的'any'类型时报错。
`--noImplicitReturns`                   | `boolean` | `false`                  | 不是函数的所有返回路径都有返回值时报错。
`--noImplicitUseStrict`                 | `boolean` | `false`                  | 模块输出中不包含'use strict'指令。
`--noLib`                               | `boolean` | `false`                  | 不包含默认的库文件（lib.d.ts）。
`--noResolve`                           | `boolean` | `false`                  | 不把`/// <reference``>`或模块导入的文件加到编译文件列表。
`--noUnusedLocals`                      | `boolean` | `false`                  | 若有未使用的局部变量则抛错。
`--noUnusedParameters`                  | `boolean` | `false`                  | 若有未使用的参数则抛错。
~~`--out`~~                             | `string`  | `null`                   | 弃用。使用 `--outFile` 代替。
`--outDir`                              | `string`  | `null`                   | 重定向输出目录。
`--outFile`                             | `string`  | `null`                   | 将输出文件合并为一个文件。合并的顺序是根据传入编译器的文件顺序和`///<reference``>`和`import`的文件顺序决定的。查看输出文件顺序文件了解详情。
`--preserveConstEnums`                  | `boolean` | `false`                  | 保留`const`和`enum`声明。查看[const enums documentation](https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#94-constant-enum-declarations)了解详情。
`--pretty`<sup>[1]</sup>                | `boolean` | `false`                  | 给错误和消息设置样式，使用颜色和上下文。
`--project`<br/>`-p`                    | `string`  | `null`                   | 编译指定目录下的项目。这个目录应该包含一个`tsconfig.json`文件来管理编译。查看[tsconfig.json](./tsconfig.json.md)文档了解更多信息。
`--reactNamespace`                      | `string`  | `"React"`                | 当目标为生成'react' JSX时，指定`createElement`和`__spread`的调用对象
`--removeComments`                      | `boolean` | `false`                  | 删除所有注释，除了以`/!*`开头的版权信息。
`--rootDir`                             | `string`  | *(common root directory is computed from the list of input files)*   | 仅用来控制输出的目录结构`--outDir`。
`--skipDefaultLibCheck`                 | `boolean` | `false`                  |
`--sourceMap`                           | `boolean` | `false`                  | 生成相应的'.map'文件。
`--sourceRoot`                          | `string`  | `null`                   | 指定TypeScript源文件的路径，以便调试器定位。当TypeScript文件的位置是在运行时指定时使用此标记。路径信息会被加到`sourceMap`里。
`--strictNullChecks`                    | `boolean` | `false`                  | 在严格的`null`检查模式下，`null`和`undefined`值不包含在任何类型里，只允许用它们自己和`any`来赋值（有个例外，`undefined`可以赋值到`void`）。
`--stripInternal`<sup>[1]</sup>         | `boolean` | `false`                  | 不对具有`/** @internal */` JSDoc注解的代码生成代码。
`--suppressExcessPropertyErrors`<sup>[1]</sup> | `boolean` | `false`           | 阻止对对象字面量的额外属性检查。
`--suppressImplicitAnyIndexErrors`      | `boolean` | `false`                  | 阻止`--noImplicitAny`对缺少索引签名的索引对象报错。查看[issue #1232](https://github.com/Microsoft/TypeScript/issues/1232#issuecomment-64510362)了解详情。
`--target`<br/>`-t`                     | `string`  | `"ES5"`                  | 指定ECMAScript目标版本'ES3' (默认)，'ES5'，或'ES6'<sup>[1]</sup>
`--traceResolution`                     | `boolean` | `false`                  | 生成模块解析日志信息
`--version`<br/>`-v`                    |           |                          | 打印编译器版本号。
`--watch`<br/>`-w`                      |           |                          | 在监视模式下运行编译器。会监视输出文件，在它们改变时重新编译。

<sup>[1]</sup> 这些选项是试验性的。

## 相关信息

* 在[tsconfig.json](./tsconfig.json.md)文件里设置编译器选项。
* 在[MSBuild工程](./Compiler Options in MSBuild.md)里设置编译器选项。
