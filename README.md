# TypeScript

TypeScript is a superset of JavaScript that compiles to clean JavaScript output.  http://www.typescriptlang.org

请阅读 :book: [TypeScript Handbook 中文版 - Published with GitBook](http://zhongsp.gitbooks.io/typescript-handbook/content/)


## 目录

* [基础类型](./doc/handbook/Basic Types.md)
* [枚举](./doc/handbook/Enums.md)
* [变量声明](./doc/handbook/Variable Declarations.md)
* [接口](./doc/handbook/Interfaces.md)
* [类](./doc/handbook/Classes.md)
* [命名空间和模块](./doc/handbook/Namespaces and Modules.md)
* [命名空间](./doc/handbook/Namespaces.md)
* [模块](./doc/handbook/Modules.md)
* [函数](./doc/handbook/Functions.md)
* [泛型](./doc/handbook/Generics.md)
* [混入](./doc/handbook/Mixins.md)
* [声明合并](./doc/handbook/Declaration Merging.md)
* [类型推论](./doc/handbook/Type Inference.md)
* [类型兼容性](./doc/handbook/Type Compatibility.md)
* [书写.d.ts文件](./doc/handbook/Writing Definition Files.md)
* [Iterators 和 Generators](./doc/handbook/Iterators and Generators.md)
* [Symbols](./doc/handbook/Symbols.md)
* [Decorators](./doc/handbook/Decorators.md)
* [tsconfig.json](./doc/handbook/tsconfig.json.md)
* [编译选项](./doc/handbook/Compiler Options.md)

**TypeScript Handbook**

* Read [TypeScript Handbook (Recommended, BUT not up to date officially)](http://www.typescriptlang.org/Handbook)
* Read [TypeScript手册中文版 - Published with GitBook（持续更新中，最新版）](http://zhongsp.gitbooks.io/typescript-handbook/content/):book: 

**TypeScript Language Specification**

* Read [TypeScript Language Specification (Recommended)](https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md)
* Read [TypeScript 语言规范 (译完第一章)](./doc/TypeScript Language Specification.md)

**Others**

* [编码规范](./doc/coding_guidelines.md)

I'd love for you to contribute to the translation:)


## Using Gulp with TypeScript

Install `gulp` and `gulp-typescript`. See [package.json](./package.json).

```sh
$ npm install --global gulp
$ npm install --save-dev gulp gulp-typescript
```

Config gulp. See [gulpfile.js](./gulpfile.js).

```js
gulp.task('typescript', function() {
  var tsResult = gulp.src('ts/*.ts')
    .pipe(ts({
      target: 'ES5',
      declarationFiles: false,
      noExternalResolve: true
    }));

  tsResult.dts.pipe(gulp.dest('dist/tsdefinitions'));

  return tsResult.js.pipe(gulp.dest('dist/typescript'));
});
```
