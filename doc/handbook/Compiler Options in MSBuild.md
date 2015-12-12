## 概述

编译选项可以在使用MSBuild的项目里通过MSBuild属性指定。

## 例子

```XML
  <PropertyGroup Condition="'$(Configuration)' == 'Debug'">
    <TypeScriptRemoveComments>false</TypeScriptRemoveComments>
    <TypeScriptSourceMap>true</TypeScriptSourceMap>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)' == 'Release'">
    <TypeScriptRemoveComments>true</TypeScriptRemoveComments>
    <TypeScriptSourceMap>false</TypeScriptSourceMap>
  </PropertyGroup>
  <Import Project="$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v$(VisualStudioVersion)\TypeScript\Microsoft.TypeScript.targets"
          Condition="Exists('$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v$(VisualStudioVersion)\TypeScript\Microsoft.TypeScript.targets')" />
```

## 映射

编译选项                                      | MSBuild属性名称                             | 可用值
---------------------------------------------|--------------------------------------------|-----------------
`--declaration`                              | TypeScriptGeneratesDeclarations            | 布尔值
`--module`                                   | TypeScriptModuleKind                       | `AMD`, `CommonJs`, `UMD` 或 `System`
`--target`                                   | TypeScriptTarget                           | `ES3`, `ES5`, or `ES6`
`--charset`                                  | TypeScriptCharset                          |
`--emitBOM`                                  | TypeScriptEmitBOM                          | 布尔值
`--emitDecoratorMetadata`                    | TypeScriptEmitDecoratorMetadata            | 布尔值
`--experimentalDecorators`                   | TypeScriptExperimentalDecorators           | 布尔值
`--inlineSourceMap`                          | TypeScriptInlineSourceMap                  | 布尔值
`--inlineSources`                            | TypeScriptInlineSources                    | 布尔值
`--locale`                                   | *自动的*                                    | 自动设置成PreferredUILang的值
`--mapRoot`                                  | TypeScriptMapRoot                          | 文件路径
`--newLine`                                  | TypeScriptNewLine                          | `CRLF` 或 `LF`
`--noEmitOnError`                            | TypeScriptNoEmitOnError                    | 布尔值
`--noEmitHelpers`                            | TypeScriptNoEmitHelpers                    | 布尔值
`--noImplicitAny`                            | TypeScriptNoImplicitAny                    | 布尔值
`--noLib`                                    | TypeScriptNoLib                            | 布尔值
`--noResolve`                                | TypeScriptNoResolve                        | 布尔值
`--out`                                      | TypeScriptOutFile                          | 文件路径
`--outDir`                                   | TypeScriptOutDir                           | 文件路径
`--preserveConstEnums`                       | TypeScriptPreserveConstEnums               | 布尔值
`--removeComments`                           | TypeScriptRemoveComments                   | 布尔值
`--rootDir`                                  | TypeScriptRootDir                          | 文件路径
`--isolatedModules`                          | TypeScriptIsolatedModules                  | 布尔值
`--sourceMap`                                | TypeScriptSourceMap                        | 文件路径
`--sourceRoot`                               | TypeScriptSourceRoot                       | 文件路径
`--suppressImplicitAnyIndexErrors`           | TypeScriptSuppressImplicitAnyIndexErrors   | 布尔值
`--suppressExcessPropertyErrors`             |  TypeScriptSuppressExcessPropertyErrors    | 布尔值
`--moduleResolution`                         | TypeScriptModuleResolution                 | `Classic` or `NodeJs`
`--jsx`                                      | TypeScriptJSXEmit                          | `React` or `Preserve`
`--project`                                  | *VS不支持*                                  |
`--watch`                                    | *VS不支持*                                  |
`--diagnostics`                              | *VS不支持*                                  |
`--listFiles`                                | *VS不支持*                                  |
`--noEmit`                                   | *VS不支持*                                  |
*VS特有选项*                                  | TypeScriptAdditionalFlags                  | *任意编译选项*


## 我使用的Visual Studio版本里支持哪些选项

查找 `C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v$(VisualStudioVersion)\TypeScript\Microsoft.TypeScript.targets` 文件。
可用的MSBuild XML标签与相应的`tsc`编译选项的映射都在那里。