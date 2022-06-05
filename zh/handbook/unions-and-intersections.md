---
title: Unions and Intersection Types
layout: docs
permalink: /docs/handbook/unions-and-intersections.html
oneline: How to use unions and intersection types in TypeScript
handbook: "true"
deprecated_by: /docs/handbook/2/everyday-types.html#union-types
# prettier-ignore
deprecation_redirects: [
  discriminating-unions, /docs/handbook/2/narrowing.html#discriminated-unions
]
---

So far, the handbook has covered types which are atomic objects.
However, as you model more types you find yourself looking for tools which let you compose or combine existing types instead of creating them from scratch.

Intersection and Union types are one of the ways in which you can compose types.

## Union Types

Occasionally, you'll run into a library that expects a parameter to be either a `number` or a `string`.
For instance, take the following function:

```ts twoslash
/**
 * Takes a string and adds "padding" to the left.
 * If 'padding' is a string, then 'padding' is appended to the left side.
 * If 'padding' is a number, then that number of spaces is added to the left side.
 */
function padLeft(value: string, padding: any) {
  if (typeof padding === "number") {
    return Array(padding + 1).join(" ") + value;
  }
  if (typeof padding === "string") {
    return padding + value;
  }
  throw new Error(`Expected string or number, got '${typeof padding}'.`);
}

padLeft("Hello world", 4); // returns "    Hello world"
```

The problem with `padLeft` in the above example is that its `padding` parameter is typed as `any`.
That means that we can call it with an argument that's neither a `number` nor a `string`, but TypeScript will be okay with it.

```ts twoslash
declare function padLeft(value: string, padding: any): string;
// ---cut---
// passes at compile time, fails at runtime.
let indentedString = padLeft("Hello world", true);
```

In traditional object-oriented code, we might abstract over the two types by creating a hierarchy of types.
While this is much more explicit, it's also a little bit overkill.
One of the nice things about the original version of `padLeft` was that we were able to just pass in primitives.
That meant that usage was simple and concise.
This new approach also wouldn't help if we were just trying to use a function that already exists elsewhere.

Instead of `any`, we can use a _union type_ for the `padding` parameter:

```ts twoslash
// @errors: 2345
/**
 * Takes a string and adds "padding" to the left.
 * If 'padding' is a string, then 'padding' is appended to the left side.
 * If 'padding' is a number, then that number of spaces is added to the left side.
 */
function padLeft(value: string, padding: string | number) {
  // ...
}

let indentedString = padLeft("Hello world", true);
```

A union type describes a value that can be one of several types.
We use the vertical bar (`|`) to separate each type, so `number | string | boolean` is the type of a value that can be a `number`, a `string`, or a `boolean`.

## Unions with Common Fields

If we have a value that is a union type, we can only access members that are common to all types in the union.

```ts twoslash
// @errors: 2339

interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

declare function getSmallPet(): Fish | Bird;

let pet = getSmallPet();
pet.layEggs();

// Only available in one of the two possible types
pet.swim();
```

Union types can be a bit tricky here, but it just takes a bit of intuition to get used to.
If a value has the type `A | B`, we only know for _certain_ that it has members that both `A` _and_ `B` have.
In this example, `Bird` has a member named `fly`.
We can't be sure whether a variable typed as `Bird | Fish` has a `fly` method.
If the variable is really a `Fish` at runtime, then calling `pet.fly()` will fail.

## Discriminating Unions

A common technique for working with unions is to have a single field which uses literal types which you can use to let TypeScript narrow down the possible current type. For example, we're going to create a union of three types which have a single shared field.

```ts
type NetworkLoadingState = {
  state: "loading";
};

type NetworkFailedState = {
  state: "failed";
  code: number;
};

type NetworkSuccessState = {
  state: "success";
  response: {
    title: string;
    duration: number;
    summary: string;
  };
};

// Create a type which represents only one of the above types
// but you aren't sure which it is yet.
type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState;
```

<style type="text/css">
.markdown table.tg  {
  border-collapse:collapse;
  width: 100%;
  text-align: center;
  display: table;
}

.tg th {
  border-bottom: 1px solid black;
  padding: 8px;
  padding-bottom: 0;
}

.tg tbody, .tg tr {
  width: 100%;
}

.tg .highlight {
  background-color: #F3F3F3;
}

@media (prefers-color-scheme: dark) {
  .tg .highlight {
    background-color: #424242;
  }
}

</style>

All of the above types have a field named `state`, and then they also have their own fields:

<table class='tg' width="100%">
  <tbody>
    <tr>
      <th><code>NetworkLoadingState</code></th>
      <th><code>NetworkFailedState</code></th>
      <th><code>NetworkSuccessState</code></th>
    </tr>
    <tr class='highlight'>
      <td>state</td>
      <td>state</td>
      <td>state</td>
    </tr>
    <tr>
      <td></td>
      <td>code</td>
      <td>response</td>
    </tr>
    </tbody>
</table>

Given the `state` field is common in every type inside `NetworkState` - it is safe for your code to access without an existence check.

With `state` as a literal type, you can compare the value of `state` to the equivalent string and TypeScript will know which type is currently being used.

<table class='tg' width="100%">
  <tbody>
    <tr>
      <th><code>NetworkLoadingState</code></th>
      <th><code>NetworkFailedState</code></th>
      <th><code>NetworkSuccessState</code></th>
    </tr>
    <tr>
      <td><code>"loading"</code></td>
      <td><code>"failed"</code></td>
      <td><code>"success"</code></td>
    </tr>
    </tbody>
</table>

In this case, you can use a `switch` statement to narrow down which type is represented at runtime:

```ts twoslash
// @errors: 2339
type NetworkLoadingState = {
  state: "loading";
};

type NetworkFailedState = {
  state: "failed";
  code: number;
};

type NetworkSuccessState = {
  state: "success";
  response: {
    title: string;
    duration: number;
    summary: string;
  };
};
// ---cut---
type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState;

function logger(state: NetworkState): string {
  // Right now TypeScript does not know which of the three
  // potential types state could be.

  // Trying to access a property which isn't shared
  // across all types will raise an error
  state.code;

  // By switching on state, TypeScript can narrow the union
  // down in code flow analysis
  switch (state.state) {
    case "loading":
      return "Downloading...";
    case "failed":
      // The type must be NetworkFailedState here,
      // so accessing the `code` field is safe
      return `Error ${state.code} downloading`;
    case "success":
      return `Downloaded ${state.response.title} - ${state.response.summary}`;
  }
}
```

## Union Exhaustiveness checking

We would like the compiler to tell us when we don't cover all variants of the discriminated union.
For example, if we add `NetworkFromCachedState` to `NetworkState`, we need to update `logger` as well:

```ts twoslash
// @errors: 2366
type NetworkLoadingState = { state: "loading" };
type NetworkFailedState = { state: "failed"; code: number };
type NetworkSuccessState = {
  state: "success";
  response: {
    title: string;
    duration: number;
    summary: string;
  };
};
// ---cut---
type NetworkFromCachedState = {
  state: "from_cache";
  id: string;
  response: NetworkSuccessState["response"];
};

type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState
  | NetworkFromCachedState;

function logger(s: NetworkState) {
  switch (s.state) {
    case "loading":
      return "loading request";
    case "failed":
      return `failed with code ${s.code}`;
    case "success":
      return "got response";
  }
}
```

There are two ways to do this.
The first is to turn on [`strictNullChecks`](/tsconfig#strictNullChecks) and specify a return type:

```ts twoslash
// @errors: 2366
type NetworkLoadingState = { state: "loading" };
type NetworkFailedState = { state: "failed"; code: number };
type NetworkSuccessState = { state: "success" };
type NetworkFromCachedState = { state: "from_cache" };

type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState
  | NetworkFromCachedState;

// ---cut---
function logger(s: NetworkState): string {
  switch (s.state) {
    case "loading":
      return "loading request";
    case "failed":
      return `failed with code ${s.code}`;
    case "success":
      return "got response";
  }
}
```

Because the `switch` is no longer exhaustive, TypeScript is aware that the function could sometimes return `undefined`.
If you have an explicit return type `string`, then you will get an error that the return type is actually `string | undefined`.
However, this method is quite subtle and, besides, [`strictNullChecks`](/tsconfig#strictNullChecks) does not always work with old code.

The second method uses the `never` type that the compiler uses to check for exhaustiveness:

```ts twoslash
// @errors: 2345
type NetworkLoadingState = { state: "loading" };
type NetworkFailedState = { state: "failed"; code: number };
type NetworkSuccessState = { state: "success" };
type NetworkFromCachedState = { state: "from_cache" };

type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState
  | NetworkFromCachedState;
// ---cut---
function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

function logger(s: NetworkState): string {
  switch (s.state) {
    case "loading":
      return "loading request";
    case "failed":
      return `failed with code ${s.code}`;
    case "success":
      return "got response";
    default:
      return assertNever(s);
  }
}
```

Here, `assertNever` checks that `s` is of type `never` &mdash; the type that's left after all other cases have been removed.
If you forget a case, then `s` will have a real type and you will get a type error.
This method requires you to define an extra function, but it's much more obvious when you forget it because the error message includes the missing type name.

## Intersection Types

Intersection types are closely related to union types, but they are used very differently.
An intersection type combines multiple types into one.
This allows you to add together existing types to get a single type that has all the features you need.
For example, `Person & Serializable & Loggable` is a type which is all of `Person` _and_ `Serializable` _and_ `Loggable`.
That means an object of this type will have all members of all three types.

For example, if you had networking requests with consistent error handling then you could separate out the error handling into its own type which is merged with types which correspond to a single response type.

```ts twoslash
interface ErrorHandling {
  success: boolean;
  error?: { message: string };
}

interface ArtworksData {
  artworks: { title: string }[];
}

interface ArtistsData {
  artists: { name: string }[];
}

// These interfaces are composed to have
// consistent error handling, and their own data.

type ArtworksResponse = ArtworksData & ErrorHandling;
type ArtistsResponse = ArtistsData & ErrorHandling;

const handleArtistsResponse = (response: ArtistsResponse) => {
  if (response.error) {
    console.error(response.error.message);
    return;
  }

  console.log(response.artists);
};
```
