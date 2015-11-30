# TypeScript
TypeScript is a superset of JavaScript that compiles to clean JavaScript output.  http://www.typescriptlang.org

Please read: :book: [TypeScript手册中文版 - Published with GitBook](http://zhongsp.gitbooks.io/typescript-handbook/content/)

**TypeScript Handbook**

* Read [TypeScript Handbook (Recommended, BUT not up to date officially)](http://www.typescriptlang.org/Handbook)
* Read [TypeScript手册中文版 - Published with GitBook（持续更新中，最新版）](http://zhongsp.gitbooks.io/typescript-handbook/content/):book: 

**Beyond Handbook && Latest features**

* [tsconfig.json](./doc/tsconfig.json.md) (TypeScript 1.5)
* [let和const](./doc/let_and_const.md) (TypeScript 1.4)

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
