TypeScript不是存在于真空中。
它是由JavaScript生态系统和大量现存的JavaScript而来。
将JavaScript代码转换成TypeScript虽有些乏味但不是难事。
在这篇教程里，让我们看看如何开始。
我们假设在开始写TypeScript之前你已经理解了足够的本手册的内容。

# 设置目录

如果你在写纯JavaScript，可能你是直接运行JavaScript的
  `.js`文件在`src`，`lib`或`dist`目录里，按照预想正常运行。

若如此，那么你写的纯JavaScript文件将做为TypeScript的输入，且你将运行TypeScript的输出。
在从JS到TS的转换过程中，我们会分离输入文件以防TypeScript覆盖它们。
如果输出文件需要在特定目录下，那么它将做为输出目录。

你可能还需要对JavaScript做一些中间处理，比如合并或经过Babel再次编译。
在这种情况下，你应该已经有了如下的目录结构。

那么现在，我们假设你已经设置了这样的目录结构：

```text
projectRoot
├── src
│   ├── file1.js
│   └── file2.js
├── built
└── tsconfig.json
```

如果你在`src`目录外还有`tests`文件夹，那么在`src`里可以有一个`tsconfig.json`文件，在`tests`里还可以有一个。

# 书写配置文件

TypeScript使用`tsconfig.json`文件管理工程配置，例如你想包含哪些文件和进行哪些检查。
让我们先创建一个简单的工程配置文件：

```json
{
    "compilerOptions": {
        "outDir": "./built",
        "allowJs": true,
        "target": "es5"
    },
    "include": [
        "./src/**/*"
    ]
}
```

这里我们为TypeScript设置了一些东西:

1. 读取所有可识别的`src`目录下的文件（通过`include`）。
2. 接受JavaScript做为输入（通过`allowJs`）。
3. 生成的所有文件放在`built`目录下（通过`outDir`）。
4. 将JavaScript代码降级到低版本比如ECMAScript 5（通过`target`）。

现在，如果你在工程根目录下运行`tsc`，就可以在`built`目录下看到生成的文件。
`built`下的文件应该与`src`下的文件相同。
现在你的工程里的TypeScript已经可以工作了。

## Early Benefits

Even at this point you can get some great benefits from TypeScript understanding your project.
If you open up an editor like [VS Code](https://code.visualstudio.com) or [Visual Studio](https://visualstudio.com), you'll see that you can often get some tooling support like completion.
You can also catch certain bugs with options like:

* `noImplicitReturns` which prevents you from forgetting to return at the end of a function.
* `noFallthroughCasesInSwitch` which is helpful if you never want to forget a `break` statement between `case`s in a `switch` block.

TypeScript will also warn about unreachable code and labels, which you can disable with `allowUnreachableCode` and `allowUnusedLabels` respectively.

# Integrating with Build Tools

You might have some more build steps in your pipeline.
Perhaps you concatenate something to each of your files.
Each build tool is different, but we'll do our best to cover the gist of things.

## Gulp

If you're using Gulp in some fashion, we have a tutorial on [using Gulp](./Gulp.md) with TypeScript, and integrating with common build tools like Browserify, Babelify, and Uglify.
You can read more there.

## Webpack

Webpack integration is pretty simple.
You can use `ts-loader`, a TypeScript loader, combined with `source-map-loader` for easier debugging.
Simply run

```shell
npm install ts-loader source-map-loader
```

and merge in options from the following into your `webpack.config.js` file:

```js
module.exports = {
    entry: "./src/index.ts",
    output: {
        filename: "./dist/bundle.js",
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },

    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
            { test: /\.tsx?$/, loader: "ts-loader" }
        ],

        preLoaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, loader: "source-map-loader" }
        ]
    },

    // Other options...
};
```

It's important to note that `ts-loader` will need to run before any other loader that deals with `.js` files.
You can see an example of using Webpack in our [tutorial on React and Webpack](./React & Webpack.md).

# Moving to TypeScript Files

At this point, you're probably ready to start using TypeScript files.
The first step is to rename one of your `.js` files to `.ts`.
If your file uses JSX, you'll need to rename it to `.tsx`.

Finished with that step?
Great!
You've successfully migrated a file from JavaScript to TypeScript!

Of course, that might not feel right.
If you open that file in an editor with TypeScript support (or if you run `tsc --pretty`), you might see red squiggles on certain lines.
You should think of these the same way you'd think of red squiggles in an editor like Microsoft Word.
TypeScript will still translate your code, just like Word will still let you print your documents.

If that sounds too lax for you, you can tighten that behavior up.
If, for instance, you *don't* want TypeScript to compile to JavaScript in the face of errors, you can use the `noEmitOnError` option.
In that sense, TypeScript has a dial on its strictness, and you can turn that knob up as high as you want.

If you plan on using the stricter settings that are available, it's best to turn them on now (see [Getting Stricter Checks](#getting-stricter-checks) below).
For instance, if you never want TypeScript to silently infer `any` for a type without you explicitly saying so, you can use `noImplicitAny` before you start modifying your files.
While it might feel somewhat overwhelming, the long-term gains become apparent much more quickly.

## Weeding out Errors

Like we mentioned, it's not unexpected to get error messages after conversion.
The important thing is to actually go one by one through these and decide how to deal with the errors.
Often these will be legitimate bugs, but sometimes you'll have to explain what you're trying to do a little better to TypeScript.

### Importing from Modules

You might start out getting a bunch of errors like `Cannot find name 'require'.`, and `Cannot find name 'define'.`.
In these cases, it's likely that you're using modules.
While you can just convince TypeScript that these exist by writing out

```ts
// For Node/CommonJS
declare function require(path: string): any;
```

or

```ts
// For RequireJS/AMD
declare function define(...args: any[]): any;
```

it's better to get rid of those calls and use TypeScript syntax for imports.

First, you'll need to enable some module system by setting TypeScript's `module` flag.
Valid options are `commonjs`, `amd`, `system`, and `umd`.

If you had the following Node/CommonJS code:

```js
var foo = require("foo");

foo.doStuff();
```

or the following RequireJS/AMD code:

```js
define(["foo"], function(foo) {
    foo.doStuff();
})
```

then you would write the following TypeScript code:

```ts
import foo = require("foo");

foo.doStuff();
```

### Getting Declaration Files

If you started converting over to TypeScript imports, you'll probably run into errors like `Cannot find module 'foo'.`.
The issue here is that you likely don't have *declaration files* to describe your library.
Luckily this is pretty easy.
If TypeScript complains about a package like `lodash`, you can just write

```shell
npm install -s @types/lodash
```

If you're using a module option other than `commonjs`, you'll need to set your `moduleResolution` option to `node`.

After that, you'll be able to import lodash with no issues, and get accurate completions.

### Exporting from Modules

Typically, exporting from a module involves adding properties to a value like `exports` or `module.exports`.
TypeScript allows you to use top-level export statements.
For instance, if you exported a function like so:

```js
module.exports.feedPets = function(pets) {
    // ...
}
```

you could write that out as the following:

```ts
export function feedPets(pets) {
    // ...
}
```

Sometimes you'll entirely overwrite the exports object.
This is a common pattern people use to make their modules immediately callable like in this snippet:

```js
var express = require("express");
var app = express();
```

You might have previously written that like so:

```js
function foo() {
    // ...
}
module.exports = foo;
```

In TypeScript, you can model this with the `export =` construct.

```ts
function foo() {
    // ...
}
export = foo;
```

### Too many/too few arguments

You'll sometimes find yourself calling a function with too many/few arguments.
Typically, this is a bug, but in some cases, you might have declared a function that uses the `arguments` object instead of writing out any parameters:

```js
function myCoolFunction() {
    if (arguments.length == 2 && !Array.isArray(arguments[1])) {
        var f = arguments[0];
        var arr = arguments[1];
        // ...
    }
    // ...
}

myCoolFunction(function(x) { console.log(x) }, [1, 2, 3, 4]);
myCoolFunction(function(x) { console.log(x) }, 1, 2, 3, 4]);
```

In this case, we need to use TypeScript to tell any of our callers about the ways `myCoolFunction` can be called using function overloads.

```ts
function myCoolFunction(f: (x: number) => void, nums: number[]): void;
function myCoolFunction(f: (x: number) => void, ...nums: number[]): void;
function myCoolFunction() {
    if (arguments.length == 2 && !Array.isArray(arguments[1])) {
        var f = arguments[0];
        var arr = arguments[1];
        // ...
    }
    // ...
}
```

We added two overload signatures to `myCoolFunction`.
The first checks states that `myCoolFunction` takes a function (which takes a `number`), and then a list of `number`s.
The second one says that it will take a function as well, and then uses a rest parameter (`...nums`) to state that any number of arguments after that need to be `number`s.

### Sequentially Added Properties

Some people find it more aesthetically pleasing to create an object and add properties immediately after like so:

```js
var options = {};
options.color = "red";
options.volume = 11;
```

TypeScript will say that you can't assign to `color` and `volume` because it first figured out the type of `options` as `{}` which doesn't have any properties.
If you instead moved the declarations into the object literal themselves, you'd get no errors:

```ts
let options = {
    color: "red",
    volume: 11
};
```

You could also define the type of `options` and add a type assertion on the object literal.

```ts
interface Options { color: string; volume: number }

let options = {} as Options;
options.color = "red";
options.volume = 11;
```

Alternatively, you can just say `options` has the type `any` which is the easiest thing to do, but which will benefit you the least.

### `any`, `Object`, and `{}`

You might be tempted to use `Object` or `{}` to say that a value can have any property on it because `Object` is, for most purposes, the most general type.
However **`any` is actually the type you want to use** in those situations, since it's the most *flexible* type.

For instance, if you have something that's typed as `Object` you won't be able to call methods like `toLowerCase()` on it.
Being more general usually means you can do less with a type, but `any` is special in that it is the most general type while still allowing you to do anything with it.
That means you can call it, construct it, access properties on it, etc.
Keep in mind though, whenever you use `any`, you lose out on most of the error checking and editor support that TypeScript gives you.

If a decision ever comes down to `Object` and `{}`, you should prefer `{}`.
While they are mostly the same, technically `{}` is a more general type than `Object` in certain esoteric cases.

## Getting Stricter Checks

TypeScript comes with certain checks to give you more safety and analysis of your program.
Once you've converted your codebase to TypeScript, you can start enabling these checks for greater safety.

### No Implicit `any`

There are certain cases where TypeScript can't figure out what certain types should be.
To be as lenient as possible, it will decide to use the type `any` in its place.
While this is great for migration, using `any` means that you're not getting any type safety, and you won't get the same tooling support you'd get elsewhere.
You can tell TypeScript to flag these locations down and give an error with the `noImplicitAny` option.

### Strict `null` & `undefined` Checks

By default, TypeScript assumes that `null` and `undefined` are in the domain of every type.
That means anything declared with the type `number` could be `null` or `undefined`.
Since `null` and `undefined` are such a frequent source of bugs in JavaScript and TypeScript, TypeScript has the `strictNullChecks` option to spare you the stress of worrying about these issues.

When `strictNullChecks` is enabled, `null` and `undefined` get their own types called `null` and `undefined` respectively.
Whenever anything is *possibly* `null`, you can use a union type with the original type.
So for instance, if something could be a `number` or `null`, you'd write the type out as `number | null`.

If you ever have a value that TypeScript thinks is possibly `null`/`undefined`, but you know better, you can use the postfix `!` operator to tell it otherwise.

```ts
declare var foo: string[] | null;

foo.length;  // error - 'foo' is possibly 'null'

foo!.length; // okay - 'foo!' just has type 'string[]'
```

As a heads up, when using `strictNullChecks`, your dependencies may need to be updated to use `strictNullChecks` as well.

### No Implicit `any` for `this`

When you use the `this` keyword outside of classes, it has the type `any` by default.
For instance, imagine a `Point` class, and imagine a function that we wish to add as a method:

```ts
class Point {
    constuctor(public x, public y) {}
    getDistance(point: Point) {
        let dx = p.x - this.x;
        let dy = p.y - this.y;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }
}
// ...

// Reopen the interface.
interface Point {
    distanceFromOrigin(point: Point): number;
}
Point.prototype.distanceFromOrigin = function(point: Point) {
    return this.getDistance({ x: 0, y: 0});
}
```

This has the same problems we mentioned above - we could easily have misspelled `getDistance` and not gotten an error.
For this reason, TypeScript has the `noImplicitThis` option.
When that option is set, TypeScript will issue an error when `this` is used without an explicit (or inferred) type.
The fix is to use a `this`-parameter to give an explicit type in the interface or in the function itself:

```ts
Point.prototype.distanceFromOrigin = function(this: Point, point: Point) {
    return this.getDistance({ x: 0, y: 0});
}
```