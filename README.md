# BDD-to-code

[![NPM version](https://badge.fury.io/js/bdd-tc.png)](http://badge.fury.io/js/bdd-tc)
[![travis-ci](https://api.travis-ci.org/tacoss/bdd-tc.svg)](https://travis-ci.org/tacoss/bdd-tc)

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
};
```

Now you can reference them with `@before` and `@after` annotations respectively:

```feature
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

- `@before` &mdash; Setup `before/beforeEach` from features and scenarios.
- `@after` &mdash; Setup `after/afterEach` from features and scenarios.
- `@only` &mdash; Append `.only` on generated fixture/test calls.
- `@skip` &mdash; Completely omit fixture/test from generated code.
- `@url` &mdash; Append `.page` calls on generated fixture/test calls.

> Any other annotation is keept as input-data and passed through invoked hooks.

Multiple values using `[ ;,]` as separator will be treated as arrays, e.g.

```feature
@media=foo,bar
```

Complex values can be passed as JSON values, e.g.

```feature
@arr=["foo", "bar"]
@obj={"baz": "buzz"}
@str="Other value, with commas, etc."
```

## Demo/dev

- `npm install` &mdash; Setup dependencies
- `npm run e2e` &mdash; Run defined e2e tests
- `npm run test:ci` &mdash; To run all unit-tests

Inspect the generated results from E2E snapshots:

- `npm run report:ui`
- `open generated/index.html`
