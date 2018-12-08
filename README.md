# BDD-to-code

[![NPM version](https://badge.fury.io/js/yadda-testcafe.png)](http://badge.fury.io/js/yadda-testcafe)
[![travis-ci](https://api.travis-ci.org/pateketrueke/yadda-testcafe.svg)](https://travis-ci.org/pateketrueke/yadda-testcafe)


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

### Hooks

Before and after hooks for tests can be defined too:

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

Multiple hooks can be specified separated with commas.

> Depending on the context `beforeEach/afterEach` or `before/after` is used automatically.

### Matchers

Additional `$matchers` can be defined within steps as follows:

```js
export default {
  matchers: {
    test: '(foo|bar)',
    noMatch: '(?:[^\s]*)',
  },

  'When ask for $test': test => async t => {
    console.log(test); // foo OR bar
  },

  'Then verify $noMatch': noMatch => async t => {
    console.log(noMatch); // undefined
  },
};
```

All non-matched placeholders will be captured as `(.+?)`, just like `$test`.

### Annotations

## Development

- `npm install`
- `npm run e2e`

Inspect the generated results from E2E snapshots:

- `npm run ui`
- `open generated/index.html`
