var gulp = require('gulp'),
  ts = require('gulp-typescript');

gulp.task('typescript', function() {
  var tsResult = gulp.src('ts/**/*.ts')
    .pipe(ts({
      target: 'ES5',
      declarationFiles: false,
      noExternalResolve: true
    }));

  tsResult.dts.pipe(gulp.dest('dist/tsdefinitions'));

  return tsResult.js.pipe(gulp.dest('dist/typescript'));
});

gulp.task('watch', function() {
  gulp.watch(['ts/**/*.ts'], ['typescript']);
});

gulp.task('default', ['typescript', 'watch']);
