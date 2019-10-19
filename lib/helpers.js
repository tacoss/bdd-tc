const { takeSnapshot } = require('testcafe-blink-diff');
const { Selector } = require('testcafe');

const SHARED_ELS = {};
const SHARED_DATA = {};

const RE_SPLIT = /[\s;,]/;

function useSelectors(...els) {
  Object.assign(SHARED_ELS, ...els);
}

function useFixtures(...data) {
  Object.assign(SHARED_DATA, ...data);
}

function getVal(innerText, formatter) {
  if (!innerText || typeof innerText !== 'string') {
    throw new TypeError(`Missing value, given '${innerText}'`);
  }

  const matches = innerText.match(/^<(.+?)>$/) || [null, innerText];
  const keys = matches[1].split(RE_SPLIT);

  try {
    innerText = SHARED_DATA;

    while (keys.length) {
      innerText = innerText[keys.shift()];
    }
  } catch (e) {
    throw new TypeError(`Unable to retrieve fixture for '${matches[1]}'`);
  }

  if (typeof formatter === 'function') {
    innerText = formatter(innerText);
  }

  if (typeof innerText === 'undefined') {
    throw new TypeError(`Unable to resolve value for '${matches[1]}'`);
  }

  return innerText;
}

function getEl(selector) {
  if (!selector || typeof selector !== 'string') {
    throw new TypeError(`Missing selector, given '${selector}'`);
  }

  const matches = selector.match(/^<(.+?)>$/) || [null, selector];
  const keys = matches[1].split(RE_SPLIT);

  try {
    selector = SHARED_ELS;

    while (keys.length) {
      selector = selector[keys.shift()];
    }
  } catch (e) {
    throw new TypeError(`Unable to resolve selector '${matches[1]}'`);
  }

  if (typeof selector === 'undefined') {
    throw new TypeError(`Selector for '${matches[1]}' is not defined`);
  }

  return selector;
}

function $(selector, options) {
  return Selector(selector, options);
}

module.exports = {
  takeSnapshot,
  useSelectors,
  useFixtures,
  getVal,
  getEl,
  $,
};
