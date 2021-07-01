# BDD-to-code

[![NPM version](https://badge.fury.io/js/bdd-tc.svg)](http://badge.fury.io/js/bdd-tc)
[![codecov](https://codecov.io/gh/tacoss/bdd-tc/branch/master/graph/badge.svg)](https://codecov.io/gh/tacoss/bdd-tc)
[![Build status](https://github.com/tacoss/bdd-tc/workflows/ci/badge.svg)](https://github.com/tacoss/bdd-tc/actions)

> Transforms Yadda features into working Testcafé tests.

## How it works?

First we need a feature-file, say `./e2e/features/demo.feature`:

```feature
Feature: Some description

Scenario: Perform a single action

  Given one step
  When I run another step
  Then I test for something specific
```

Now we must define some steps to cover it, e.g. `./e2e/steps/demo.js`:

```js
import { Selector } from 'testcafe';

export default {
  'Given one step': () => async t => {
    await t
      .expect('body').ok();
  },

  'When I run another step': () => async t => {
    await t
      .click(Selector('button'));
  },

  'Then I test for $phrase': value => async t => {
    await t
      .expect(Selector('body').innerText)
      .contains(value);
  },
};
```

Finally we can generate the test-files and execute them:

```bash
$ bdd-tc e2e/features -- testcafe --color chrome:headless
```

### Steps

Steps are _labeled_ functions that receive arguments and return actual test functions.

Those calls are inlined on the generated tests, but its code is actually imported:


```js
import $step0 from '../steps/demo.js';

fixture `Some description`;

test(`Perform a single action`, async t => {
  await $step0[`Given one step`]()(t);
  await $step0[`When I run another step`]()(t);
  await $step0[`Then I test for \$phrase`]("something specific")(t);
});
```

### Hooks

Before and after hooks for tests can be defined too.

They're are similar to step functions:

```js
export default {
  before: {
    namedHook: () => async t => {
      // do something
    },
  },

  after: {
    // etc.
  },

  // use @path as input
  url(path = '/') {
    return process.env.BASE_URL + path;
  },
};
```

Now you can reference them with `@before` and `@after` annotations respectively:

```behat
@after=doSomething
Feature: Some description

@before=namedHook,somethingElse
Scenario: Perform a single action

  Given one step
  When I run another step
  Then I test for something specific
```

> Depending on the context, `beforeEach/afterEach` or `before/after` is used automatically.

### Matchers

Additional `$matchers` can be defined within steps as follows:

```js
export default {
  matchers: {
    test: '(foo|bar)',
    noMatch: '(?:[^\\s]*)',
  },

  'When ask for $test': test => async t => {
    console.log(test); // foo OR bar
  },

  'Then verify $noMatch': noMatch => async t => {
    console.log(noMatch); // undefined
  },
};
```

Captures made from matchers will be passed as arguments, non-matched placeholders will be captured as `(.+?)` and passed too.

> Use `(?:<PATTERN>)` to omit captured values from matched placeholders.

### Annotations

Built-in annotations are:

- `@xsnapshot` &mdash; Unique for features, disables any `@snapshot` from scenarios below
- `@snapshot` &mdash; Unique for scenarios, it'll take snapshots after each step!
- `@before` &mdash; Setup `before/beforeEach` from features and scenarios
- `@after` &mdash; Setup `after/afterEach` from features and scenarios
- `@only` &mdash; Append `.only` on generated fixture/test calls
- `@skip` &mdash; Completely omit fixture/test from generated code
- `@page` &mdash; Optional pathame, used only if `url()` is setup
- `@url` &mdash; Append `.page` calls on generated fixture/test calls

Given `@snapshost` value is passed as `takeSnapshot`'s selector option, so it can be an array, in which case will fallback until one selector matches/exists.

> Any other annotation is keept as input-data and passed through invoked hooks.

Multiple values using `[ ;,]` as separator will be treated as arrays, e.g.

```behat
@media=foo,bar
```

Complex values can be passed as JSON values, e.g.

```behat
@arr=["foo", "bar"]
@obj={"baz": "buzz"}
@str="Other value, with commas, etc."
```

### Working with steps

In order to assist you during writing steps, you can leverage on:

- `takeSnapshot(...)` &mdash; Calls the same method from [testcafe-blink-diff](https://www.npmjs.com/package/testcafe-blink-diff)
- `useSelectors(obj)` &mdash; Object containing `Selector(...)` definitions, can be nested
- `useFixtures(obj)` &mdash; Object containing any values as fixtures, can be nested
- `getVal(key)` &mdash; Validate and return value from registered fixtures, see above
- `getEl(key)` &mdash; Validate and return selector from registered ones, see above
- `$(...)` &mdash; Shortcut for `Selector(...)`, same options as original call

### Working with fixtures

Importing the `bdd-tc/matchers` module you gain access to:

- `jsf(schema[, options])` &mdash; Generate one or many samples from given JSON-Schema<sup>1</sup>
- `faker[...]` &mdash; Faker.js instance - [see demo](https://cdn.rawgit.com/Marak/faker.js/master/examples/browser/index.html)
- `chance[...]` &mdash; Chance.js instance - [see docs](https://chancejs.com/)
- `gen([type[, schema]])` &mdash; Generate a sample based on any given type, additional JSON-Schema is applied if given
- `date([step])` &mdash; Random `Date` object, given optional step: `seconds`, `minutes`, `hours`, `days`, `months` or `years`
- `pick(dataset)` &mdash; Pick any value from given dataset, even work with strings!
- `oneOf(dataset, whereField, fieldValue)` &mdash; Find any item on dataset that matches field/value
- `number([min[, max]])` &mdash; Returns a random number within min/max boundaries
- `randexp(regexp)` &mdash; Return a string generated from any given `RegExp`
- `shuffle(dataset)` &mdash; Copy, randomize and returns any given dataset

> <sup>1</sup> We're using [json-schema-faker](https://www.npmjs.com/package/json-schema-faker) under the hood to generate those.

## Demo/dev

- `npm install` &mdash; Setup dependencies
- `npm run e2e` &mdash; Run defined e2e tests
- `npm run test:ci` &mdash; To run all unit-tests

Inspect the generated results from E2E snapshots:

- `npm run report:ui`
- `open generated/index.html`
