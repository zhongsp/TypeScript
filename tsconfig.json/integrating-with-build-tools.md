# 与其它构建工具整合

构建工具

* [Babel](integrating-with-build-tools.md#babel)
* [Browserify](integrating-with-build-tools.md#browserify)
* [Duo](integrating-with-build-tools.md#duo)
* [Grunt](integrating-with-build-tools.md#grunt)
* [Gulp](integrating-with-build-tools.md#gulp)
* [Jspm](integrating-with-build-tools.md#jspm)
* [Webpack](integrating-with-build-tools.md#webpack)
* [MSBuild](integrating-with-build-tools.md#msbuild)
* [NuGet](integrating-with-build-tools.md#nuget)

## Babel

### 安装

```bash
npm install @babel/cli @babel/core @babel/preset-typescript --save-dev
```

### .babelrc

```javascript
{
  "presets": ["@babel/preset-typescript"]
}
```

### 使用命令行工具

```bash
./node_modules/.bin/babel --out-file bundle.js src/index.ts
```

### package.json

```javascript
{
  "scripts": {
    "build": "babel --out-file bundle.js main.ts"
  },
}
```

### 在命令行上运行Babel

```bash
npm run build
```

## Browserify

### 安装

```bash
npm install tsify
```

### 使用命令行交互

```bash
browserify main.ts -p [ tsify --noImplicitAny ] > bundle.js
```

### 使用API

```javascript
var browserify = require("browserify");
var tsify = require("tsify");

browserify()
    .add('main.ts')
    .plugin('tsify', { noImplicitAny: true })
    .bundle()
    .pipe(process.stdout);
```

更多详细信息：[smrq/tsify](https://github.com/smrq/tsify)

## Duo

### 安装

```bash
npm install duo-typescript
```

### 使用命令行交互

```bash
duo --use duo-typescript entry.ts
```

### 使用API

```javascript
var Duo = require('duo');
var fs = require('fs')
var path = require('path')
var typescript = require('duo-typescript');

var out = path.join(__dirname, "output.js")

Duo(__dirname)
    .entry('entry.ts')
    .use(typescript())
    .run(function (err, results) {
        if (err) throw err;
        // Write compiled result to output file
        fs.writeFileSync(out, results.code);
    });
```

更多详细信息：[frankwallis/duo-typescript](https://github.com/frankwallis/duo-typescript)

## Grunt

### 安装

```bash
npm install grunt-ts
```

### 基本Gruntfile.js

```javascript
module.exports = function(grunt) {
    grunt.initConfig({
        ts: {
            default : {
                src: ["**/*.ts", "!node_modules/**/*.ts"]
            }
        }
    });
    grunt.loadNpmTasks("grunt-ts");
    grunt.registerTask("default", ["ts"]);
};
```

更多详细信息：[TypeStrong/grunt-ts](https://github.com/TypeStrong/grunt-ts)

## Gulp

### 安装

```bash
npm install gulp-typescript
```

### 基本gulpfile.js

```javascript
var gulp = require("gulp");
var ts = require("gulp-typescript");

gulp.task("default", function () {
    var tsResult = gulp.src("src/*.ts")
        .pipe(ts({
              noImplicitAny: true,
              out: "output.js"
        }));
    return tsResult.js.pipe(gulp.dest('built/local'));
});
```

更多详细信息：[ivogabe/gulp-typescript](https://github.com/ivogabe/gulp-typescript)

## Jspm

### 安装

```bash
npm install -g jspm@beta
```

_注意：目前jspm的0.16beta版本支持TypeScript_

更多详细信息：[TypeScriptSamples/jspm](https://github.com/Microsoft/TypeScriptSamples/tree/master/jspm)

## Webpack

### 安装

```bash
npm install ts-loader --save-dev
```

### Webpack 2 webpack.config.js 基础配置

```javascript
module.exports = {
    entry: "./src/index.tsx",
    output: {
        path: '/',
        filename: "bundle.js"
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"]
    },
    module: {
        rules: [
            // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
            { test: /\.tsx?$/, use: ["ts-loader"], exclude: /node_modules/ }
        ]
    }
}
```

### Webpack 1 webpack.config.js 基础配置

```javascript
module.exports = {
    entry: "./src/index.tsx",
    output: {
        filename: "bundle.js"
    },
    resolve: {
        // Add '.ts' and '.tsx' as a resolvable extension.
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    module: {
        loaders: [
            // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    }
};
```

查看[更多关于ts-loader的详细信息](https://www.npmjs.com/package/ts-loader)

或者

* [awesome-typescript-loader](https://www.npmjs.com/package/awesome-typescript-loader)

## MSBuild

更新工程文件，包含本地安装的`Microsoft.TypeScript.Default.props`（在顶端）和`Microsoft.TypeScript.targets`（在底部）文件：

```markup
<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="4.0" DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <!-- Include default props at the top -->
  <Import
      Project="$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v$(VisualStudioVersion)\TypeScript\Microsoft.TypeScript.Default.props"
      Condition="Exists('$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v$(VisualStudioVersion)\TypeScript\Microsoft.TypeScript.Default.props')" />

  <!-- TypeScript configurations go here -->
  <PropertyGroup Condition="'$(Configuration)' == 'Debug'">
    <TypeScriptRemoveComments>false</TypeScriptRemoveComments>
    <TypeScriptSourceMap>true</TypeScriptSourceMap>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)' == 'Release'">
    <TypeScriptRemoveComments>true</TypeScriptRemoveComments>
    <TypeScriptSourceMap>false</TypeScriptSourceMap>
  </PropertyGroup>

  <!-- Include default targets at the bottom -->
  <Import
      Project="$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v$(VisualStudioVersion)\TypeScript\Microsoft.TypeScript.targets"
      Condition="Exists('$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v$(VisualStudioVersion)\TypeScript\Microsoft.TypeScript.targets')" />
</Project>
```

关于配置MSBuild编译器选项的更多详细信息，请参考：[在MSBuild里使用编译选项](compiler-options-in-msbuild.md)

## NuGet

* 右键点击 -&gt; Manage NuGet Packages
* 查找`Microsoft.TypeScript.MSBuild`
* 点击`Install`
* 安装完成后，Rebuild。

更多详细信息请参考[Package Manager Dialog](http://docs.nuget.org/Consume/Package-Manager-Dialog)和[using nightly builds with NuGet](https://github.com/Microsoft/TypeScript/wiki/Nightly-drops#using-nuget-with-msbuild)

