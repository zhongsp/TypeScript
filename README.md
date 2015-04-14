# TypeScript
TypeScript is a superset of JavaScript that compiles to clean JavaScript output.  http://www.typescriptlang.org

* Read [TypeScript Handbook (Recommended)](http://www.typescriptlang.org/Handbook)
* Read [TypeScript 手册 (译至: 模块)](./doc/Handbook.md)

* Read [TypeScript Language Specification (Recommended)](https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md)
* Read [TypeScript 语言规范 (译完第一章)](./doc/TypeScript Language Specification.md)

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
