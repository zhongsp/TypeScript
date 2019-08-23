# Improved behavior for calling union types

In prior versions of TypeScript, unions of callable types could *only* be invoked if they had identical parameter lists.

```ts
type Fruit = "apple" | "orange";
type Color = "red" | "orange";

type FruitEater = (fruit: Fruit) => number;     // eats and ranks the fruit
type ColorConsumer = (color: Color) => string;  // consumes and describes the colors

declare let f: FruitEater | ColorConsumer;

// Cannot invoke an expression whose type lacks a call signature.
//   Type 'FruitEater | ColorConsumer' has no compatible call signatures.ts(2349)
f("orange");
```

However, in the above example, both `FruitEater`s and `ColorConsumer`s should be able to take the string `"orange"`, and return either a `number` or a `string`.

In TypeScript 3.3, this is no longer an error.

```ts
type Fruit = "apple" | "orange";
type Color = "red" | "orange";

type FruitEater = (fruit: Fruit) => number;     // eats and ranks the fruit
type ColorConsumer = (color: Color) => string;  // consumes and describes the colors

declare let f: FruitEater | ColorConsumer;

f("orange"); // It works! Returns a 'number | string'.

f("apple");  // error - Argument of type '"apple"' is not assignable to parameter of type '"orange"'.

f("red");    // error - Argument of type '"red"' is not assignable to parameter of type '"orange"'.
```

In TypeScript 3.3, the parameters of these signatures are *intersected* together to create a new signature.

In the example above, the parameters `fruit` and `color` are intersected together to a new parameter of type `Fruit & Color`.
`Fruit & Color` is really the same as `("apple" | "orange") & ("red" | "orange")` which is equivalent to `("apple" & "red") | ("apple" & "orange") | ("orange" & "red") | ("orange" & "orange")`.
Each of those impossible intersections reduces to `never`, and we're left with `"orange" & "orange"` which is just `"orange"`.

## Caveats

This new behavior only kicks in when at most one type in the union has multiple overloads, and at most one type in the union has a generic signature.
That means methods on `number[] | string[]` like `map` (which is generic) still won't be callable.

On the other hand, methods like `forEach` will now be callable, but under `noImplicitAny` there may be some issues.

```ts
interface Dog {
    kind: "dog"
    dogProp: any;
}
interface Cat {
    kind: "cat"
    catProp: any;
}

const catOrDogArray: Dog[] | Cat[] = [];

catOrDogArray.forEach(animal => {
    //                ~~~~~~ error!
    // Parameter 'animal' implicitly has an 'any' type.
});
```

This is still strictly more capable in TypeScript 3.3, and adding an explicit type annotation will work.

```ts
interface Dog {
    kind: "dog"
    dogProp: any;
}
interface Cat {
    kind: "cat"
    catProp: any;
}

const catOrDogArray: Dog[] | Cat[] = [];
catOrDogArray.forEach((animal: Dog | Cat) => {
    if (animal.kind === "dog") {
        animal.dogProp;
        // ...
    }
    else if (animal.kind === "cat") {
        animal.catProp;
        // ...
    }
});
```

# Incremental file watching for composite projects in `--build --watch`

TypeScript 3.0 introduced a new feature for structuring builds called "composite projects".
Part of the goal here was to ensure users could break up large projects into smaller parts that build quickly and preserve project structure, without compromising the existing TypeScript experience.
Thanks to composite projects, TypeScript can use `--build` mode to recompile only the set of projects and dependencies.
You can think of this as optimizing *inter*-project builds.

TypeScript 2.7 also introduced `--watch` mode builds via a new incremental "builder" API.
In a similar vein, the entire idea is that this mode only re-checks and re-emits changed files or files whose dependencies might impact type-checking.
You can think of this as optimizing *intra*-project builds.

Prior to 3.3, building composite projects using `--build --watch` actually didn't use this incremental file watching infrastructure.
An update in one project under `--build --watch` mode would force a full build of that project, rather than determining which files within that project were affected.

In TypeScript 3.3, `--build` mode's `--watch` flag *does* leverage incremental file watching as well.
That can mean signficantly faster builds under `--build --watch`.
In our testing, this functionality has resulted in **a reduction of 50% to 75% in build times** of the original `--build --watch` times.
[You can read more on the original pull request for the change](https://github.com/Microsoft/TypeScript/pull/29161) to see specific numbers, but we believe most composite project users will see significant wins here.