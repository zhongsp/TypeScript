# TypeScript Handbook（中文版）

TypeScript让你以你想要的方式写JavaScript。
TypeScript是具有类型的JavaScript的超集并可以编译成普通的JavaScript代码。
支持任意浏览器，任意环境，任意系统并且开源。

TypeScript是Microsoft公司注册商标。

## TypeScript语言规范

Read [TypeScript Language Specification](https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md)

## 使用Gulp和TypeScript

安装 `gulp` 和 `gulp-typescript`. 查看 [package.json](./package.json).

```sh
$ npm install --global gulp
$ npm install --save-dev gulp gulp-typescript
```

配置 gulp. 查看 [gulpfile.js](./gulpfile.js).

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

## 手册之外的主题

* [tsconfig.json](https://github.com/zhongsp/TypeScript/tree/master/doc/doc/tsconfig.json.md) (TypeScript 1.5)
* [let和const](https://github.com/zhongsp/TypeScript/tree/master/doc/doc/let_and_const.md) (TypeScript 1.4)
* [元组类型 - Tuple Types](https://github.com/zhongsp/TypeScript/tree/master/doc/doc/tuple_types.md) (TypeScript 1.3) 
* [受保护的成员 - Protected members](https://github.com/zhongsp/TypeScript/tree/master/doc/doc/protected.md) (TypeScript 1.3) 
