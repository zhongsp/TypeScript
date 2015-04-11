# TypeScript
TypeScript is a superset of JavaScript that compiles to clean JavaScript output.  http://www.typescriptlang.org

* Read [TypeScript Handbook](http://www.typescriptlang.org/Handbook)
* Read [TypeScript Handbook in Simplified Chinese (in translating...)](./doc/Handbook.md)
* Read [TypeScript Language Specification](https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md)
* Read [TypeScript Language Specification in Simplified Chinese (in translating...)](./doc/TypeScript Language Specification.md)

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
