# Browserify

### 安装

```sh
npm install tsify
```

### 使用命令行交互

```sh
browserify main.ts -p [ tsify --noImplicitAny ] > bundle.js
```

### 使用API

```js
var browserify = require("browserify");
var tsify = require("tsify");

browserify()
    .add('main.ts')
    .plugin('tsify', { noImplicitAny: true })
    .bundle()
    .pipe(process.stdout);
```

更多详细信息：[smrq/tsify](https://github.com/smrq/tsify)

# Duo

### 安装

```sh
npm install duo-typescript
```

### 使用命令行交互

```sh
duo --use duo-typescript entry.ts
```

### 使用API

```js
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

# Grunt

### 安装

```sh
npm install grunt-ts
```

### 基本Gruntfile.js

````js
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
````

更多详细信息：[TypeStrong/grunt-ts](https://github.com/TypeStrong/grunt-ts)

# gulp

### 安装

```sh
npm install gulp-typescript
```

### 基本gulpfile.js

```js
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

# jspm

### 安装

```sh
npm install -g jspm@beta
```

_注意：目前jspm的0.16beta版本支持TypeScript_

更多详细信息：[TypeScriptSamples/jspm](https://github.com/Microsoft/TypeScriptSamples/tree/jspm/jspm)

# webpack

### 安装

```sh
npm install awesome-typescript-loader --save-dev
```

### 基本webpack.config.js

```js
module.exports = {

    // Currently we need to add '.ts' to resolve.extensions array.
    resolve: {
        extensions: ['', '.ts', '.webpack.js', '.web.js', '.js']
    },

    // Source maps support (or 'inline-source-map' also works)
    devtool: 'source-map',

    // Add loader for .ts files.
    module: {
        loaders: [
            {
                test: /\.ts$/,
                loader: 'awesome-typescript-loader'
            }
        ]
    }
};
```

更多详细信息：[s-panferov/awesome-typescript-loader](https://github.com/s-panferov/awesome-typescript-loader)