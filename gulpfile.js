let gulp = require('gulp');
let rimraf = require('gulp-rimraf');
let util = require('gulp-util');
let through2 = require('through2');
let babel = require('@babel/core');

let fs = require('fs');
let path = require('path');

gulp.task('clean-bulid', function() {
  return gulp.src('./build/*')
    .pipe(rimraf());
});

gulp.task('clean-web', function() {
  return gulp.src('./web/*')
    .pipe(rimraf());
});

function cb(file, enc, cb) {
  let target = file.path.replace(path.sep + 'src' + path.sep,  path.sep + 'build' + path.sep);
  util.log(path.relative(file.cwd, file.path), '->', path.relative(file.cwd, target));
  let content = file.contents.toString('utf-8');
  content = babel.transformSync(content, {
    presets: ['@babel/preset-env']
  }).code;
  file.contents = Buffer.from(content);
  cb(null, file);
}
function cb2(file, enc, cb) {
  var target = file.path.replace(path.sep + 'build' + path.sep,  path.sep + 'web' + path.sep);
  util.log(path.relative(file.cwd, file.path), '->', path.relative(file.cwd, target));
  var content = file.contents.toString('utf-8');
  content = 'define(function(require, exports, module){' + content + '});';
  file.contents = Buffer.from(content);
  cb(null, file);
}

gulp.task('default', ['clean-bulid', 'clean-web'], function() {
  gulp.src('./src/**/*.js')
    .pipe(through2.obj(cb))
    .pipe(gulp.dest('./build/'))
    .pipe(through2.obj(cb2))
    .pipe(gulp.dest('./web/'));
});

gulp.task('watch', function() {
  gulp.watch('./src/**/*.js', function(file) {
    let to = file.path.replace(path.sep + 'src' + path.sep,  path.sep + 'build' + path.sep);
    to = path.dirname(to);
    let to2 = file.path.replace(path.sep + 'src' + path.sep,  path.sep + 'web' + path.sep);
    to2 = path.dirname(to2);
    gulp.src(file.path)
      .pipe(through2.obj(cb))
      .pipe(gulp.dest(to))
      .pipe(through2.obj(cb2))
      .pipe(gulp.dest(to2));
  });
});